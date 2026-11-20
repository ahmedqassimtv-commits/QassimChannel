/* مرجع واحد لـ Lenis (التمرير الناعم) عشان أي مكوّن يقدر يوقف التمرير
   وقت فتح طبقة (مشغّل السينما، البحث) ويرجّعه بعدها. */
let lenis = null

export function setLenis(instance) {
  lenis = instance
}

export function getLenis() {
  return lenis
}

let locks = 0
export function lockScroll() {
  locks += 1
  if (locks === 1) {
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
  }
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1)
  if (locks === 0) {
    lenis?.start()
    document.documentElement.style.overflow = ''
  }
}

export function scrollToTop(immediate = true) {
  if (lenis) lenis.scrollTo(0, { immediate, force: true })
  else window.scrollTo(0, 0)
}
