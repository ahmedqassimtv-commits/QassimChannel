/* ══ الصوت ══════════════════════════════════════════════════════════
   النطق من المتصفح نفسه (Web Speech API) بصوت عربي لو موجود.
   onWord بتتنادى مع كل كلمة عشان الفم يتحرك معاها. لو مفيش صوت عربي
   أو الصوت مقفول: بنمثّل الكلام بتوقيت تقريبي (الفم بيتحرك والنص بيظهر).
   لاحقاً ممكن نبدّلها بصوت أحمد الحقيقي (ملف صوت من سيرفر) من غير ما
   نغيّر حاجة في باقي الكود. */

let cachedVoice
function arabicVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  if (cachedVoice !== undefined && cachedVoice) return cachedVoice
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

/** بيرجّع دالة بتوقف الكلام */
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
      t += 180 + w.length * 55
    })
    timers.push(window.setTimeout(() => !stopped && onEnd?.(), t + 150))
  }

  if (muted || !voice || !window.speechSynthesis) {
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
    window.speechSynthesis?.cancel()
  }
}

export function hasArabicVoice() {
  return Boolean(arabicVoice())
}
