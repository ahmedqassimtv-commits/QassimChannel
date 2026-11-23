/* ══ ثوابت الحركة الجوّية — Origin Financial & Apple Motion Philosophy ══
   - التحولات السريعة (Hover / State): 0.2s ease
   - الظهور الجوّي الطويل (Atmospheric Reveal): 1.6s–2.0s بمنحنى
     cubic-bezier(0.455, 0.03, 0.515, 0.955) بدون ارتداد مبالغ فيه. */

export const ORIGIN_EASE = [0.455, 0.03, 0.515, 0.955]
export const APPLE_EASE = [0.22, 1, 0.36, 1]

export const entrySprings = {
  editorial: {
    duration: 1.45,
    ease: ORIGIN_EASE,
  },
  atmospheric: {
    duration: 1.85,
    ease: ORIGIN_EASE,
  },
  quick: {
    duration: 0.2,
    ease: 'easeOut',
  },
}

export const revealStagger = 0.1
