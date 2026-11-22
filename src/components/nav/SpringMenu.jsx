import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import NavGlyph from './NavGlyph.jsx'
import useLiquidCapsule from './useLiquidCapsule.js'
import { SPRINGS, STAGGER_MS, kick, register, spring, springGroup } from '../../motion/springs.js'

/* ══ مساحة — "Spring dropdown" ═════════════════════════════════════════════
   Rebuilt from designbookmark's Spring Dropdown with the same springs:
   - rows drop in one after another (select-open 360/24, 45 ms stagger),
     each from a little above with a short blur, so the list "pours" open
   - the highlight under the pointer is a vertical liquid capsule
     (select-hl 620/34 lead + trail edges), so it stretches between rows
   - the current page gets a check that draws itself */

export default function SpringMenu({ items, onPick, label }) {
  const { pathname } = useLocation()
  const listRef = useRef(null)
  const hlRef = useRef(null)
  const rowRefs = useRef([])
  const hl = useLiquidCapsule(listRef, hlRef, { vertical: true })
  const current = items.find((i) => pathname.startsWith(i.to))

  // rows pour in
  useEffect(() => {
    const sp = items.map(() => spring(0, SPRINGS.selectOpen))
    const unreg = register(
      springGroup(
        Object.fromEntries(sp.map((s, i) => [i, s])),
        () => {
          sp.forEach((s, i) => {
            const el = rowRefs.current[i]
            if (!el) return
            const v = Math.max(0, Math.min(1, s.x))
            el.style.opacity = v.toFixed(3)
            el.style.transform = `translate3d(0, ${((1 - s.x) * -10).toFixed(2)}px, 0) scale(${(0.96 + 0.04 * s.x).toFixed(4)})`
            el.style.filter = v > 0.98 ? 'none' : `blur(${((1 - v) * 5).toFixed(2)}px)`
          })
        },
        0.002,
      ),
    )
    const timers = sp.map((s, i) =>
      window.setTimeout(() => {
        s.t = 1
        kick()
      }, i * STAGGER_MS),
    )
    // highlight starts on the current page
    const ci = items.indexOf(current)
    if (ci >= 0) hl.moveTo(rowRefs.current[ci], { instant: true })
    return () => {
      timers.forEach(window.clearTimeout)
      unreg()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  return (
    <div className="qz-smenu" dir="rtl">
      {label && <p className="qz-smenu-label">{label}</p>}
      <div
        ref={listRef}
        className="qz-smenu-list"
        onPointerLeave={() => {
          const ci = items.indexOf(current)
          if (ci >= 0) hl.moveTo(rowRefs.current[ci])
          else hl.hide()
        }}
      >
        <span ref={hlRef} className="qz-smenu-hl" aria-hidden="true" />
        {items.map((it, i) => {
          const on = it === current
          return (
            <Link
              key={it.to}
              to={it.to}
              role="menuitem"
              ref={(el) => {
                rowRefs.current[i] = el
              }}
              className="qz-smenu-row"
              data-on={on ? 'true' : undefined}
              style={{ opacity: 0 }}
              onPointerEnter={(e) => hl.moveTo(e.currentTarget)}
              onFocus={(e) => hl.moveTo(e.currentTarget)}
              onPointerDown={() => hl.press(true)}
              onPointerUp={() => hl.press(false)}
              onClick={onPick}
            >
              <span className="qz-smenu-ico">
                <it.icon aria-hidden="true" strokeWidth={1.7} />
              </span>
              <span className="qz-smenu-text">
                <span className="qz-smenu-title">{it.label}</span>
                <span className="qz-smenu-sub">{it.sub}</span>
              </span>
              {on ? (
                <svg className="qz-smenu-check" viewBox="0 0 16 16" aria-label="أنت هنا">
                  <path d="m3.5 8.4 2.9 2.8 6.1-6.4" />
                </svg>
              ) : (
                <NavGlyph name="arrow" className="qz-smenu-go" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
