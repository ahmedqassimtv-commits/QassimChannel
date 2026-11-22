import { useCallback, useEffect, useMemo, useRef } from 'react'
import { SPRINGS, kick, register, spring, springGroup, tune } from '../../motion/springs.js'

/* ══ The liquid capsule ════════════════════════════════════════════════════
   The pill that sits under the hovered / active item. Its two edges are two
   independent springs: the edge in the direction of travel uses the stiff
   "lead" spring, the other edge the loose "trail" spring — so the capsule
   stretches toward where it's going, then the tail catches up (a drop of
   liquid, not a sliding box). While stretched it thins a little (volume is
   kept), its gloss slides against the motion, and on press it swells like the
   iOS 26 tab-bar lens. Everything starts from the live value, so it can be
   redirected mid-flight without a jump. */

export default function useLiquidCapsule(trackRef, capsuleRef, { vertical = false } = {}) {
  const st = useRef(null)
  if (!st.current) {
    st.current = {
      a: spring(0, SPRINGS.lead), // start edge (left / top)
      b: spring(0, SPRINGS.lead), // end edge (right / bottom)
      o: spring(0, SPRINGS.fade), // opacity
      p: spring(1, SPRINGS.pop), // press swell
      placed: false,
    }
  }

  useEffect(() => {
    const s = st.current
    const unreg = register(
      springGroup(
        { a: s.a, b: s.b, o: s.o, p: s.p },
        () => {
          const el = capsuleRef.current
          if (!el) return
          const size = Math.max(0, s.b.x - s.a.x)
          const rest = Math.max(1, s.b.t - s.a.t)
          const stretch = Math.min(0.6, Math.max(0, size / rest - 1))
          const thin = 1 - stretch * 0.22
          const vel = (s.a.v + s.b.v) / 2
          const sheen = Math.max(-18, Math.min(18, -vel * 0.012))
          if (vertical) {
            el.style.height = `${size}px`
            el.style.transform = `translate3d(0, ${s.a.x}px, 0) scale(${(thin * s.p.x).toFixed(4)}, ${s.p.x.toFixed(4)})`
          } else {
            el.style.width = `${size}px`
            el.style.transform = `translate3d(${s.a.x}px, 0, 0) scale(${s.p.x.toFixed(4)}, ${(thin * s.p.x).toFixed(4)})`
          }
          el.style.opacity = Math.max(0, Math.min(1, s.o.x)).toFixed(3)
          el.style.setProperty('--sheen', `${sheen.toFixed(2)}px`)
        },
        0.01,
      ),
    )
    return unreg
  }, [capsuleRef, vertical])

  /** Move to an item (element inside the track). instant = no travel. */
  const moveTo = useCallback(
    (el, { instant = false } = {}) => {
      const s = st.current
      const track = trackRef.current
      if (!el || !track) {
        s.o.t = 0
        kick()
        return
      }
      const start = vertical ? el.offsetTop : el.offsetLeft
      const end = start + (vertical ? el.offsetHeight : el.offsetWidth)
      if (instant || !s.placed || s.o.x < 0.05) {
        // appear in place (no slide from a stale position)
        s.a.x = s.a.t = start
        s.b.x = s.b.t = end
        s.a.v = s.b.v = 0
        s.placed = true
      } else {
        const forward = start > s.a.t
        tune(s.a, forward ? SPRINGS.trail : SPRINGS.lead)
        tune(s.b, forward ? SPRINGS.lead : SPRINGS.trail)
        s.a.t = start
        s.b.t = end
      }
      s.o.t = 1
      kick()
    },
    [trackRef, vertical],
  )

  const press = useCallback((on) => {
    st.current.p.t = on ? 1.08 : 1
    kick()
  }, [])

  const hide = useCallback(() => {
    st.current.o.t = 0
    kick()
  }, [])

  return useMemo(() => ({ moveTo, press, hide }), [moveTo, press, hide])
}
