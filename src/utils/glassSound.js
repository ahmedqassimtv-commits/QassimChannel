/*
 * محرك الصوت الموحّد لموقع قاسمز
 * ------------------------------------------------------------------
 * - AudioContext واحد بيتعمل بس بعد أول تفاعل حقيقي (ضغطة/كيبورد)
 *   → مفيش تحذير "The AudioContext was not allowed to start" في الكونسول
 * - أصوات واجهة بأسلوب iOS: نقرات قصيرة جافة + نبضة haptic، من غير نغمات موسيقية
 * - موسيقى أون إير بتتفك مرة واحدة في الذاكرة وبتلف (loop) من غير أي فاصل أو تقطيع
 * - لما الموسيقى شغالة، أصوات الواجهة بتوطى أوتوماتيك (Ducking) عشان مايتخانقوش
 */

const ON_AIR_SRC = '/sounds/on-air-chill.mp3'
const ON_AIR_VOLUME_KEY = 'qassimz:on-air-volume'
const DEFAULT_MUSIC_VOLUME = 0.5
const FADE_IN_S = 2.4
const FADE_OUT_S = 1.6
// كل صوت واجهة بيظهر ويختفي بمنحنى ناعم (من غير «طقة» في البداية أو قطع مفاجئ في الآخر)
const UI_ATTACK = 0.004
const UI_TAIL = 0.035

/* ==================================================================
 * 1. الكونتكست والـ Buses
 * ================================================================== */
let ctx = null
let masterGain = null
let uiBus = null
let uiMuted = false
let musicBus = null
let reverbSend = null
let noiseBuffer = null
let masterVolume = 0.7

// المتصفح بيسمح بالصوت بس بعد تفاعل حقيقي (hover مش بيتحسب)
let userActivated =
  typeof navigator !== 'undefined' && Boolean(navigator.userActivation?.hasBeenActive)
const activationWaiters = new Set()

function markActivated() {
  if (userActivated) return
  userActivated = true
  window.removeEventListener('pointerdown', markActivated, true)
  window.removeEventListener('keydown', markActivated, true)
  window.removeEventListener('touchend', markActivated, true)
  const ac = ensureContext()
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {})
  activationWaiters.forEach((fn) => fn())
  activationWaiters.clear()
}

if (typeof window !== 'undefined' && !userActivated) {
  window.addEventListener('pointerdown', markActivated, true)
  window.addEventListener('keydown', markActivated, true)
  window.addEventListener('touchend', markActivated, true)
}

function onActivated(fn) {
  if (userActivated) fn()
  else activationWaiters.add(fn)
  return () => activationWaiters.delete(fn)
}

// صدى قصير مصنوع برمجياً (غرفة صغيرة) — بيدّي الأصوات عمق احترافي من غير ملفات
function buildImpulse(ac, seconds = 0.45, decay = 3.2) {
  const length = Math.floor(ac.sampleRate * seconds)
  const impulse = ac.createBuffer(2, length, ac.sampleRate)
  for (let ch = 0; ch < 2; ch += 1) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  return impulse
}

function ensureContext() {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  if (!userActivated) return null

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null

  ctx = new AudioContextClass({ latencyHint: 'interactive' })

  // Master: ضاغط ناعم + ليميتر يمنع أي ذروة مؤذية للودن
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -20
  compressor.knee.value = 14
  compressor.ratio.value = 3.5
  compressor.attack.value = 0.004
  compressor.release.value = 0.2

  masterGain = ctx.createGain()
  masterGain.gain.value = masterVolume
  masterGain.connect(compressor)
  compressor.connect(ctx.destination)

  // Bus الواجهة: فلتر دفا يقص الحدة
  const uiWarmth = ctx.createBiquadFilter()
  uiWarmth.type = 'lowpass'
  uiWarmth.frequency.value = 4200 // أنعم: بيشيل الحدة العالية اللي بتزعج الودن
  uiWarmth.Q.value = 0.5
  // Leveler: ضاغط سريع على أصوات الواجهة بس → كل الأصوات تطلع بنفس العلو تقريباً
  const leveler = ctx.createDynamicsCompressor()
  leveler.threshold.value = -34
  leveler.knee.value = 8
  leveler.ratio.value = 5
  leveler.attack.value = 0.0015
  leveler.release.value = 0.09
  const makeup = ctx.createGain()
  makeup.gain.value = 1.1
  uiBus = ctx.createGain()
  uiBus.gain.value = uiMuted ? 0 : 1
  uiBus.connect(leveler)
  leveler.connect(makeup)
  makeup.connect(uiWarmth)
  uiWarmth.connect(masterGain)

  // Send للصدى
  const convolver = ctx.createConvolver()
  convolver.buffer = buildImpulse(ctx)
  reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.1
  reverbSend.connect(convolver)
  convolver.connect(masterGain)

  // Bus الموسيقى
  musicBus = ctx.createGain()
  musicBus.gain.value = 1
  musicBus.connect(masterGain)

  // ضوضاء بيضاء جاهزة لكل النقرات
  noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate)
  const nd = noiseBuffer.getChannelData(0)
  for (let i = 0; i < nd.length; i += 1) nd[i] = Math.random() * 2 - 1

  // لما التاب يتخبى/يرجع: الصوت كله بيختفي ويظهر بنعومة بدل ما يقطع أو يرجع فجأة
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!ctx || !masterGain) return
      const now = ctx.currentTime
      masterGain.gain.cancelScheduledValues(now)
      masterGain.gain.setValueAtTime(masterGain.gain.value, now)
      masterGain.gain.setTargetAtTime(document.hidden ? 0.0001 : masterVolume, now, document.hidden ? 0.25 : 0.4)
    })
  }

  return ctx
}

function getEngine() {
  const ac = ensureContext()
  if (!ac) return null
  if (ac.state === 'suspended') ac.resume().catch(() => {})
  if (ac.state === 'closed') return null
  return ac
}

export function setUiMuted(muted) {
  uiMuted = muted
  if (ctx && uiBus) uiBus.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.03)
}

/* ==================================================================
 * 2. لبنات الصوت (Voices) — بأسلوب iOS: نقرات قصيرة جافة، من غير نغمات موسيقية
 * ================================================================== */
function connectOut(node, { reverb = 0 } = {}) {
  node.connect(uiBus)
  if (reverb > 0) {
    const send = ctx.createGain()
    send.gain.value = reverb
    node.connect(send)
    send.connect(reverbSend)
  }
}

// «تك» iOS: موجة sine بتنزل بسرعة جداً في الطبقة (pitch drop) → إحساس نقرة خشب/زجاج صغيرة
function tick({ at = 0, freq = 1700, drop = 0.55, decay = 0.022, peak = 0.08 }) {
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  // طبقة أوطى (×0.68) → النقرة بقت «طَب» دافية بدل «تِك» حادة
  const f = freq * 0.68
  osc.frequency.setValueAtTime(f, t)
  osc.frequency.exponentialRampToValueAtTime(f * drop, t + decay)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + UI_ATTACK)
  g.gain.setTargetAtTime(0.0001, t + UI_ATTACK, (decay + UI_TAIL) / 4)
  osc.connect(g)
  connectOut(g, { reverb: 0.06 })
  osc.start(t)
  osc.stop(t + decay + UI_TAIL + 0.08)
}

// حافة النقرة: ضوضاء عالية التردد لمدة ملي ثواني (اللي بتدّي الإحساس "النضيف")
function transient({ at = 0, freq = 4200, q = 0.8, duration = 0.005, peak = 0.035 }) {
  const t = ctx.currentTime + at
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq * 0.7
  bp.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.0015)
  g.gain.setTargetAtTime(0.0001, t + 0.0015, (duration + 0.01) / 3)
  src.connect(bp)
  bp.connect(g)
  connectOut(g, { reverb: 0.04 })
  src.start(t, Math.random() * 0.4)
  src.stop(t + duration + 0.06)
}

// جسم النقرة: نبضة منخفضة قصيرة جداً (زي الـ Haptic) بتحسسك إن الزرار "اتداس"
function thump({ at = 0, freq = 150, decay = 0.03, peak = 0.05 }) {
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + decay)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + UI_ATTACK * 1.5)
  g.gain.setTargetAtTime(0.0001, t + UI_ATTACK * 1.5, (decay + UI_TAIL) / 4)
  osc.connect(g)
  connectOut(g)
  osc.start(t)
  osc.stop(t + decay + UI_TAIL + 0.08)
}

// نفَس هوا هادي جداً (فتح/قفل القوائم)
function swish({ at = 0, from = 1200, to = 3200, duration = 0.12, peak = 0.018 }) {
  const t = ctx.currentTime + at
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 0.7
  bp.frequency.setValueAtTime(from, t)
  bp.frequency.exponentialRampToValueAtTime(to, t + duration)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(peak, t + duration * 0.45)
  g.gain.setTargetAtTime(0.0001, t + duration * 0.45, duration * 0.3)
  src.connect(bp)
  bp.connect(g)
  connectOut(g, { reverb: 0.15 })
  src.start(t, Math.random() * 0.3)
  src.stop(t + duration * 2.2 + 0.05)
}

const lastPlayed = {}
function throttle(key, ms) {
  const now = performance.now()
  if (now - (lastPlayed[key] || 0) < ms) return false
  lastPlayed[key] = now
  return true
}

const vary = (amount = 0.04) => 1 + (Math.random() - 0.5) * amount

/* ==================================================================
 * 3. أصوات الواجهة (نفس أسماء الدوال القديمة عشان مفيش حاجة تتكسر)
 * ================================================================== */

/*
 * توازن الصوت: كل الأصوات معمولة على نفس «المستوى» (LEVEL) عشان مفيش صوت يطلع عالي وصوت واطي.
 * - النقرة الأساسية لكل صوت = TICK، حافة النقرة = EDGE، نبضة الـ haptic = BODY
 * - الأصوات القصيرة جداً (hover / الدرجات) بنطوّل ذيلها شوية بدل ما نعلّي الذروة
 *   عشان الودن تسمعها بنفس الإحساس من غير ما تبقى حادة
 * - وفيه Leveler (ضاغط سريع) على bus الواجهة بيوحّد أي فرق متبقي
 */
const LEVEL = 0.028 // هادي ومريح — مش عالي
const TICK = LEVEL
const EDGE = LEVEL * 0.42
const BODY = LEVEL * 0.6
const AIR = LEVEL * 0.3

// نقرة اختيار/تنقل: «تك» iOS نضيفة + نبضة haptic خفيفة
export function playGlassTap() {
  if (!getEngine() || !throttle('tap', 50)) return
  const v = vary()
  transient({ freq: 3800 * v, peak: EDGE })
  tick({ freq: 1500 * v, decay: 0.024, peak: TICK })
  thump({ freq: 140, peak: BODY })
}

// تمدد/انكماش البحث: نفَس هوا + نقرة هبوط في الآخر
export function playGlassMorph(expanding = true) {
  if (!getEngine() || !throttle('morph', 120)) return
  swish(expanding ? { from: 900, to: 2600, duration: 0.14, peak: AIR } : { from: 2600, to: 900, duration: 0.12, peak: AIR })
  transient({ at: expanding ? 0.11 : 0.09, freq: 3400, peak: EDGE * 0.8 })
  tick({ at: expanding ? 0.11 : 0.09, freq: expanding ? 1800 : 1400, decay: 0.022, peak: TICK })
}

// فتح/قفل القائمة: «فوب» ناعمة زي فتح قائمة سياق في iOS
export function playGlassDropdown(opening = true) {
  if (!getEngine() || !throttle('dropdown', 90)) return
  if (opening) {
    transient({ freq: 3200, peak: EDGE })
    swish({ from: 1100, to: 3000, duration: 0.11, peak: AIR })
    tick({ freq: 1700, decay: 0.022, peak: TICK })
  } else {
    swish({ from: 2800, to: 1000, duration: 0.09, peak: AIR })
    transient({ freq: 3000, peak: EDGE * 0.8 })
    tick({ freq: 1300, decay: 0.022, peak: TICK })
  }
}

// كتابة: نقرة كيبورد iOS، بتتغير شوية كل مرة عشان ماتبقاش آلية
export function playGlassKeystroke() {
  if (!getEngine() || !throttle('key', 28)) return
  const v = vary(0.1)
  transient({ freq: 2600 * v, q: 0.9, duration: 0.006, peak: EDGE * 0.6 })
  tick({ freq: 1900 * v, drop: 0.7, decay: 0.016, peak: TICK * 0.55 })
}

// تمرير الماوس: نفس عيلة الأصوات بس بذيل أطول شوية فبتتسمع بوضوح من غير ما تزعج
export function playGlassHover() {
  if (!userActivated || !getEngine() || !throttle('hover', 220)) return
  tick({ freq: 2200 * vary(), drop: 0.75, decay: 0.014, peak: TICK * 0.35 })
}

// سويتش زجاجي: نقرة بداية + نقرة «هبوط» لما الفقاعة توصل (زي سويتش iOS)
export function playGlassToggle(on = true) {
  if (!getEngine() || !throttle('toggle', 80)) return
  transient({ freq: 3600, peak: EDGE })
  tick({ freq: on ? 1600 : 1300, decay: 0.022, peak: TICK })
  tick({ at: 0.16, freq: on ? 1950 : 1150, decay: 0.022, peak: TICK * 0.9 })
  thump({ at: 0.16, freq: on ? 170 : 130, peak: BODY })
}

// تبديل بين اختيارات (أفلام/مسلسلات...): نقرة + هبوط بنفس المستوى
export function playGlassSegment() {
  if (!getEngine() || !throttle('segment', 80)) return
  const v = vary()
  transient({ freq: 3600 * v, peak: EDGE })
  tick({ freq: 1500 * v, decay: 0.022, peak: TICK })
  tick({ at: 0.2, freq: 1800 * v, decay: 0.02, peak: TICK * 0.85 })
  thump({ at: 0.2, peak: BODY * 0.8 })
}

// «درجات» السلايدر وانت بتسحب (كل 10٪) — كلها بنفس العلو، والطبقة بس هي اللي بتتغير
export function playGlassDetent(value = 0.5) {
  if (!getEngine() || !throttle('detent', 35)) return
  const edge = value === 0 || value === 1
  tick({ freq: 1700 + value * 700, drop: 0.72, decay: edge ? 0.02 : 0.013, peak: TICK * 0.8 })
  if (edge) thump({ freq: 150, peak: BODY * 0.7 })
}

/* ==================================================================
 * 4. موسيقى «أون إير» — Web Audio بالكامل
 * ================================================================== */
function readSavedVolume() {
  try {
    const raw = window.localStorage.getItem(ON_AIR_VOLUME_KEY)
    const v = raw == null ? NaN : Number(raw)
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : DEFAULT_MUSIC_VOLUME
  } catch {
    return DEFAULT_MUSIC_VOLUME
  }
}

// منحنى سمعي: نص السلايدر يبقى فعلاً "نص الصوت" للودن
const volumeToGain = (v) => Math.pow(v, 1.7) * 0.85

let musicVolume = typeof window === 'undefined' ? DEFAULT_MUSIC_VOLUME : readSavedVolume()
let musicArrayPromise = null
let musicBufferPromise = null
let musicBuffer = null
let musicSource = null
let musicGain = null
let musicStartedAt = 0
let musicOffset = 0
let musicStopTimer = null
let musicToken = 0
let fallbackTimer = null

let isOnAirActive = false
let onAirUserPaused = false
let cancelActivationWait = null

// idle | loading | playing | paused | blocked | fallback
let onAirState = { status: 'idle', volume: musicVolume }
const onAirListeners = new Set()

function setOnAirState(patch) {
  onAirState = { ...onAirState, ...patch }
  onAirListeners.forEach((fn) => fn(onAirState))
}

// تحميل الملف مسبقاً (من غير AudioContext) — بيتنادى لما الماوس يقرّب من «أون إير»
export function preloadOnAirMusic() {
  if (typeof window === 'undefined') return null
  if (!musicArrayPromise) {
    musicArrayPromise = fetch(ON_AIR_SRC)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.arrayBuffer()
      })
      .catch((error) => {
        musicArrayPromise = null
        throw error
      })
  }
  return musicArrayPromise
}

function getMusicBuffer(ac) {
  if (musicBuffer) return Promise.resolve(musicBuffer)
  if (!musicBufferPromise) {
    musicBufferPromise = preloadOnAirMusic()
      .then((ab) => ac.decodeAudioData(ab.slice(0)))
      .then((buffer) => {
        musicBuffer = buffer
        return buffer
      })
      .catch((error) => {
        musicBufferPromise = null
        throw error
      })
  }
  return musicBufferPromise
}

function setDucking(on) {
  if (!ctx || !uiBus) return
  uiBus.gain.setTargetAtTime(uiMuted ? 0 : on ? 0.6 : 1, ctx.currentTime, 0.6)
}

function stopFallback() {
  if (fallbackTimer) {
    window.clearInterval(fallbackTimer)
    fallbackTimer = null
  }
}

// لو الملف فشل يتحمل: كوردات Rhodes هادية بدل الصمت
function startFallback() {
  if (fallbackTimer || !getEngine()) return
  setOnAirState({ status: 'fallback' })
  const progression = [
    [293.66, 349.23, 440.0, 523.25],
    [261.63, 329.63, 392.0, 493.88],
    [220.0, 261.63, 329.63, 392.0],
    [246.94, 293.66, 369.99, 440.0],
  ]
  let step = 0
  const playChord = () => {
    if (!isOnAirActive || onAirUserPaused || !ctx) return
    const chord = progression[step % progression.length]
    step += 1
    const level = 0.02 * Math.max(0.15, volumeToGain(musicVolume) / volumeToGain(DEFAULT_MUSIC_VOLUME))
    chord.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.09
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(level, t + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6)
      osc.connect(g)
      g.connect(musicBus)
      osc.start(t)
      osc.stop(t + 2.7)
    })
  }
  playChord()
  fallbackTimer = window.setInterval(playChord, 3200)
}

// منحنى Fade سلس (S-curve) بدل الخط المستقيم → الدخول والخروج بيبقوا طبيعيين للودن
function fadeGain(param, from, to, duration, at) {
  const steps = 64
  const curve = new Float32Array(steps)
  const a = Math.max(0, from)
  for (let i = 0; i < steps; i += 1) {
    const x = i / (steps - 1)
    const e = 0.5 - 0.5 * Math.cos(Math.PI * x)
    curve[i] = a + (to - a) * e
  }
  try {
    param.setValueCurveAtTime(curve, at, duration)
  } catch {
    param.setValueAtTime(a, at)
    param.linearRampToValueAtTime(to, at + duration)
  }
}

function clearStopTimer() {
  if (musicStopTimer) {
    window.clearTimeout(musicStopTimer)
    musicStopTimer = null
  }
}

function startSource(buffer) {
  const ac = ctx
  clearStopTimer()

  // لو لسه في Fade-Out شغال: نرجّع الصوت بنعومة بدل ما نبدأ من الأول
  if (musicSource && musicGain) {
    musicGain.gain.cancelScheduledValues(ac.currentTime)
    fadeGain(musicGain.gain, musicGain.gain.value, volumeToGain(musicVolume), 0.9, ac.currentTime)
    setOnAirState({ status: 'playing' })
    setDucking(true)
    return
  }

  musicGain = ac.createGain()
  fadeGain(musicGain.gain, 0.0001, volumeToGain(musicVolume), FADE_IN_S, ac.currentTime)
  musicGain.connect(musicBus)

  const src = ac.createBufferSource()
  src.buffer = buffer
  src.loop = true // لف gapless من غير أي تقطيع
  src.connect(musicGain)
  const offset = musicOffset % buffer.duration
  src.start(ac.currentTime, offset)
  musicStartedAt = ac.currentTime - offset
  musicSource = src

  stopFallback()
  setDucking(true)
  setOnAirState({ status: 'playing' })
}

function playMusic() {
  const token = ++musicToken
  clearStopTimer()

  const ac = getEngine()
  if (!ac) {
    // لسه مفيش تفاعل → نحمّل الملف ونستنى أول ضغطة
    preloadOnAirMusic()?.catch(() => {})
    setOnAirState({ status: 'blocked' })
    cancelActivationWait?.()
    cancelActivationWait = onActivated(() => {
      cancelActivationWait = null
      if (isOnAirActive && !onAirUserPaused) playMusic()
    })
    return
  }

  if (!musicBuffer) setOnAirState({ status: 'loading' })

  getMusicBuffer(ac)
    .then((buffer) => {
      if (token !== musicToken || !isOnAirActive || onAirUserPaused) return
      startSource(buffer)
    })
    .catch(() => {
      if (token !== musicToken || !isOnAirActive || onAirUserPaused) return
      startFallback()
    })
}

function pauseMusic(nextStatus) {
  musicToken += 1 // يلغي أي تشغيل مستني الفك
  cancelActivationWait?.()
  cancelActivationWait = null
  stopFallback()
  setDucking(false)
  setOnAirState({ status: nextStatus })

  if (!musicSource || !musicGain || !ctx) return
  const src = musicSource
  const gain = musicGain
  const now = ctx.currentTime
  gain.gain.cancelScheduledValues(now)
  fadeGain(gain.gain, gain.gain.value, 0, FADE_OUT_S, now)

  clearStopTimer()
  musicStopTimer = window.setTimeout(() => {
    musicStopTimer = null
    if (musicSource !== src) return
    if (musicBuffer) musicOffset = (ctx.currentTime - musicStartedAt) % musicBuffer.duration
    try {
      src.stop()
    } catch {
      /* already stopped */
    }
    src.disconnect()
    gain.disconnect()
    musicSource = null
    musicGain = null
  }, FADE_OUT_S * 1000 + 40)
}

export function startOnAirAmbient() {
  isOnAirActive = true
  if (onAirUserPaused) {
    setOnAirState({ status: 'paused' })
    return
  }
  playMusic()
}

export function stopOnAirAmbient() {
  isOnAirActive = false
  pauseMusic('idle')
}

export function toggleOnAirPlayback() {
  const { status } = onAirState
  const isOn = status === 'playing' || status === 'loading' || status === 'fallback'
  if (isOn) {
    onAirUserPaused = true
    pauseMusic('paused')
  } else {
    onAirUserPaused = false
    isOnAirActive = true
    playMusic()
  }
}

export function setOnAirVolume(val) {
  const v = Math.max(0, Math.min(1, Number(val)))
  if (!Number.isFinite(v)) return
  musicVolume = v
  try {
    window.localStorage.setItem(ON_AIR_VOLUME_KEY, String(v))
  } catch {
    /* التخزين مقفول */
  }
  if (ctx && musicGain && onAirState.status === 'playing') {
    musicGain.gain.cancelScheduledValues(ctx.currentTime)
    musicGain.gain.setTargetAtTime(volumeToGain(v), ctx.currentTime, 0.04)
  }
  setOnAirState({ volume: v })
}

export function getOnAirState() {
  return onAirState
}

export function subscribeOnAir(listener) {
  onAirListeners.add(listener)
  return () => onAirListeners.delete(listener)
}

/* ==================================================================
 * 5. توافق مع الكود القديم
 * ================================================================== */
export function setAmbientVolume(val) {
  masterVolume = Math.max(0, Math.min(1, Number(val) || 0.85))
  if (ctx && masterGain) masterGain.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.05)
}

export function startAmbient() {
  return Boolean(getEngine())
}

export function stopAmbient() {}
