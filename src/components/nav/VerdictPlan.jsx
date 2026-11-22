import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { VERDICT_ITEMS } from './navConfig.js'
import { reviews } from '../../data/reviews.js'
import useLiquidCapsule from './useLiquidCapsule.js'
import RollingNumber from './RollingNumber.jsx'
import NavGlyph from './NavGlyph.jsx'
import { SPRINGS, STAGGER_MS, kick, register, spring, springGroup } from '../../motion/springs.js'

/* ══ الفِردِكت — "Plan switch" ════════════════════════════════════════════
   Rebuilt from designbookmark's Plan Switch with the same springs:
   - a segmented switch (أفلام / مسلسلات) whose thumb is the liquid capsule
     (lead 620/36 + trail 190/19 edges)
   - the "price" is the average verdict, rolling digit by digit (320/24, 45 ms)
   - the points re-enter one by one on every switch (fade 420/32, 45 ms stagger)
   - one call to action that opens the chosen section */

const TYPE = { '/verdict/movies': 'فيلم', '/verdict/series': 'مسلسل' }

function stats(to) {
  const list = reviews.filter((r) => r.mediaType === TYPE[to])
  const avg = list.length ? list.reduce((s, r) => s + Number(r.rating), 0) / list.length : 0
  return { count: list.length, avg: avg.toFixed(1) }
}

function Points({ items, version }) {
  const refs = useRef([])
  const sp = useRef([])
  useEffect(() => {
    sp.current = items.map(() => spring(0, SPRINGS.fade))
    const map = Object.fromEntries(sp.current.map((s, i) => [i, s]))
    const unreg = register(
      springGroup(
        map,
        () => {
          sp.current.forEach((s, i) => {
            const el = refs.current[i]
            if (!el) return
            const v = Math.max(0, Math.min(1, s.x))
            el.style.opacity = v.toFixed(3)
            el.style.transform = `translate3d(0, ${((1 - s.x) * 8).toFixed(2)}px, 0)`
            el.style.filter = v > 0.98 ? 'none' : `blur(${((1 - v) * 4).toFixed(2)}px)`
          })
        },
        0.002,
      ),
    )
    const timers = sp.current.map((s, i) =>
      window.setTimeout(
        () => {
          s.t = 1
          kick()
        },
        60 + i * STAGGER_MS,
      ),
    )
    return () => {
      timers.forEach(window.clearTimeout)
      unreg()
    }
  }, [items, version])
  return (
    <ul className="qz-plan-points">
      {items.map((p, i) => (
        <li
          key={`${version}-${p}`}
          ref={(el) => {
            refs.current[i] = el
          }}
          style={{ opacity: 0 }}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="m3.5 8.4 2.9 2.8 6.1-6.4" />
          </svg>
          {p}
        </li>
      ))}
    </ul>
  )
}

export default function VerdictPlan({ onPick }) {
  const { pathname } = useLocation()
  const [to, setTo] = useState(() =>
    VERDICT_ITEMS.some((v) => v.to === pathname) ? pathname : VERDICT_ITEMS[0].to,
  )
  const trackRef = useRef(null)
  const capRef = useRef(null)
  const btnRefs = useRef({})
  const cap = useLiquidCapsule(trackRef, capRef)
  const item = VERDICT_ITEMS.find((v) => v.to === to)
  const { count, avg } = stats(to)

  useLayoutEffect(() => {
    cap.moveTo(btnRefs.current[to])
  }, [to, cap])

  return (
    <div className="qz-plan" dir="rtl">
      <div className="qz-plan-head">
        <span className="qz-plan-eyebrow">
          الفِردِكت <span className="qz-latin">THE VERDICT</span>
        </span>
        <div ref={trackRef} className="qz-plan-seg" role="tablist" aria-label="نوع المراجعة">
          <span ref={capRef} className="qz-plan-thumb" aria-hidden="true" />
          {VERDICT_ITEMS.map((v) => (
            <button
              key={v.to}
              ref={(el) => {
                btnRefs.current[v.to] = el
              }}
              type="button"
              role="tab"
              aria-selected={to === v.to}
              data-on={to === v.to ? 'true' : undefined}
              onPointerDown={() => cap.press(true)}
              onPointerUp={() => cap.press(false)}
              onPointerLeave={() => cap.press(false)}
              onClick={() => setTo(v.to)}
            >
              {v.short}
            </button>
          ))}
        </div>
      </div>

      <div className="qz-plan-card">
        <div className="qz-plan-top">
          <strong className="qz-plan-name">{item.label}</strong>
          <span className="qz-plan-badge">{count} مراجعة</span>
        </div>
        <p className="qz-plan-price">
          <RollingNumber value={avg} className="qz-plan-num" />
          <span className="qz-plan-unit">
            من 10
            <small>متوسط الحكم</small>
          </span>
        </p>
        <Points items={item.points} version={to} />
        <Link to={to} className="qz-plan-cta" onClick={onPick} role="menuitem">
          افتح {item.label}
          <NavGlyph name="arrow" />
        </Link>
      </div>
    </div>
  )
}
