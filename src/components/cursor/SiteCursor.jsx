import { useEffect, useRef } from 'react'
import { SPRINGS, kick, register, spring, springGroup, tune } from '../../motion/springs.js'

/* ══ الماوس ═══════════════════════════════════════════════════════════════
   نقطة صغيرة بتمشي مع الإيد بالظبط (follow 900/50) وحلقة زجاج وراها بتتأخر
   شوية (trail 190/19). فوق أي حاجة بتتداس الحلقة بتكبر وتبقى عدسة زجاج،
   فوق النص المكتوب بتبقى خط كتابة، ومع الضغط بتنكمش (pop 520/16).
   على اللمس، أو reduced motion، أو جوّه بكرة الفِردِكت (ليها ماوسها) بيختفي
   ويرجع ماوس النظام. */

const INTERACTIVE =
  'a, button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], label, summary, select'
const TEXT =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"]'

export default function SiteCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || reduce.matches) return undefined
    const root = document.documentElement
    root.classList.add('qz-has-cursor')

    const s = {
      dx: spring(-100, SPRINGS.follow),
      dy: spring(-100, SPRINGS.follow),
      rx: spring(-100, SPRINGS.trail),
      ry: spring(-100, SPRINGS.trail),
      size: spring(34, SPRINGS.settle),
      w: spring(1, SPRINGS.settle), // عرض الحلقة نسبة للارتفاع (خط الكتابة)
      press: spring(1, SPRINGS.pop),
      o: spring(0, SPRINGS.fade),
    }
    let seeded = false
    const unreg = register(
      springGroup(
        s,
        () => {
          const dot = dotRef.current
          const ring = ringRef.current
          if (!dot || !ring) return
          const o = Math.max(0, Math.min(1, s.o.x)).toFixed(3)
          dot.style.transform = `translate3d(${s.dx.x}px, ${s.dy.x}px, 0) translate(-50%, -50%) scale(${s.press.x.toFixed(3)})`
          dot.style.opacity = o
          const h = s.size.x * s.press.x
          ring.style.width = `${(h * s.w.x).toFixed(2)}px`
          ring.style.height = `${h.toFixed(2)}px`
          ring.style.transform = `translate3d(${s.rx.x}px, ${s.ry.x}px, 0) translate(-50%, -50%)`
          ring.style.opacity = o
        },
        0.05,
      ),
    )

    let mode = ''
    const setMode = (m) => {
      if (m === mode) return
      mode = m
      ringRef.current.dataset.mode = m
      dotRef.current.dataset.mode = m
      s.size.t = m === 'hot' ? 58 : m === 'text' ? 26 : 34
      s.w.t = m === 'text' ? 0.12 : 1
      kick()
    }

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      if (!seeded) {
        for (const k of ['dx', 'rx']) s[k].x = s[k].t = e.clientX
        for (const k of ['dy', 'ry']) s[k].x = s[k].t = e.clientY
        seeded = true
      }
      s.dx.t = s.rx.t = e.clientX
      s.dy.t = s.ry.t = e.clientY
      const t = e.target
      const inReel = !!t?.closest?.('.qz-reel')
      s.o.t = inReel ? 0 : 1
      if (t?.closest?.(TEXT)) setMode('text')
      else if (t?.closest?.(INTERACTIVE)) setMode('hot')
      else setMode('')
      kick()
    }
    const onDown = () => {
      s.press.t = 0.82
      kick()
    }
    const onUp = () => {
      s.press.t = 1
      kick()
    }
    const onLeave = () => {
      s.o.t = 0
      kick()
    }
    // الحلقة بتلحق أسرع مع السكرول علشان ماتتأخرش عن المحتوى
    tune(s.rx, SPRINGS.trail)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
      unreg()
      root.classList.remove('qz-has-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className="qz-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="qz-cursor-dot" aria-hidden="true" />
    </>
  )
}
