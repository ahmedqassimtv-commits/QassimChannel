/* ══ الصوت — قاسم الافتراضي ═══════════════════════════════════════════
   النطق من المتصفح نفسه (Web Speech API) بصوت عربي لو متاح.
   onWord بتتنادى مع كل كلمة عشان حركة الرأس والفم تتزامن معاها.
   لو مفيش صوت عربي أو الصوت مقفول: محاكاة إيقاعية متوازنة لإظهار النص
   وتحريك النموذج بنعومة. */

let cachedVoice

function arabicVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  cachedVoice =
    voices.find((v) => /^ar[-_]EG/i.test(v.lang)) ||
    voices.find((v) => /^ar[-_]SA/i.test(v.lang)) ||
    voices.find((v) => /^ar/i.test(v.lang)) ||
    null
  return cachedVoice
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = undefined
    arabicVoice()
  })
}

export function speak(text, { muted = false, onStart, onWord, onEnd } = {}) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const voice = arabicVoice()
  let stopped = false
  let timers = []

  const simulate = () => {
    onStart?.()
    let t = 0
    words.forEach((w, i) => {
      timers.push(window.setTimeout(() => !stopped && onWord?.(i), t))
      t += 170 + w.length * 48
    })
    timers.push(window.setTimeout(() => !stopped && onEnd?.(), t + 140))
  }

  // الصوت اتشال من الموقع: النص بيظهر كلمة كلمة من غير نطق
  if (true) {
    simulate()
  } else {
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    u.lang = voice.lang
    u.rate = 1.02
    u.pitch = 1
    let i = 0
    u.onstart = () => onStart?.()
    u.onboundary = (e) => {
      if (e.name === 'word' || e.name === undefined) onWord?.(i++)
    }
    u.onend = () => !stopped && onEnd?.()
    u.onerror = () => {
      if (!stopped) simulate()
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  return () => {
    stopped = true
    timers.forEach((t) => window.clearTimeout(t))
    timers = []
  }
}

export function hasArabicVoice() {
  return Boolean(arabicVoice())
}
