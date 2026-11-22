import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import NavGlyph from './NavGlyph.jsx'
import VerdictPlan from './VerdictPlan.jsx'
import SpringMenu from './SpringMenu.jsx'
import useLiquidCapsule from './useLiquidCapsule.js'
import { NAV, sectionKey } from './navConfig.js'
import { SPRINGS, kick, register, spring, springGroup } from '../../motion/springs.js'

/* ══ التابات السفلية (موبايل وتابلت) ═════════════════════════════════
   نفس زجاج الجزيرة ونفس الكبسولة السائلة والأيقونات المتحركة.
   زي iOS 26: مع السكرول لتحت الشريط بيصغر (الأسماء بتختفي والأيقونات
   بتقرب)، ومع الطلوع بيرجع. الفِردِكت ومساحة بيفتحوا لوح من تحت فيه
   نفس الـPlan switch والـSpring dropdown. */

const SHORT = {
  '/': 'الرئيسية',
  verdict: 'الفِردِكت',
  '/stories': 'الحكايات',
  '/videos': 'فيديو',
  '/articles': 'مقالات',
  masaha: 'مساحة',
}

function playGlyph(el) {
  if (!el || el.dataset.play) return
  el.dataset.play = 'true'
  window.setTimeout(() => delete el.dataset.play, 900)
}

function useMinimize(barRef) {
  useEffect(() => {
    const m = spring(0, SPRINGS.soft)
    const unreg = register(
      springGroup(
        { m },
        () => {
          const el = barRef.current
          if (!el) return
          const k = Math.max(0, Math.min(1.1, m.x))
          el.style.setProperty('--mini', k.toFixed(3))
          el.style.transform = `translate3d(0, ${(k * 8).toFixed(2)}px, 0) scale(${(1 - 0.1 * k).toFixed(4)})`
        },
        0.002,
      ),
    )
    let last = window.scrollY
    let raf = 0
    const read = () => {
      raf = 0
      const y = window.scrollY
      const dy = y - last
      if (Math.abs(dy) < 6) return
      const nearBottom = window.innerHeight + y > document.documentElement.scrollHeight - 140
      const next = dy > 0 && y > 200 && !nearBottom ? 1 : 0
      if (next !== m.t) {
        m.t = next
        kick()
      }
      last = y
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      unreg()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [barRef])
}

function Sheet({ item, onClose }) {
  const reduce = useReducedMotion()
  return (
    <>
      <motion.div
        className="qz-sheet-scrim lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={item.label}
        className="qz-sheet lg:hidden"
        data-lenis-prevent
        initial={reduce ? { opacity: 0 } : { y: '110%' }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        exit={reduce ? { opacity: 0 } : { y: '110%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        drag={reduce ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          // سحبة لتحت أو رمية سريعة = قفل (بنحسب مكان الوقوف من السرعة)
          const projected = info.offset.y + (info.velocity.y / 1000) * (0.998 / 0.002)
          if (projected > 160) onClose()
        }}
      >
        <div className="qz-sheet-grip" aria-hidden="true" />
        {item.key === 'verdict' ? (
          <VerdictPlan onPick={onClose} />
        ) : (
          <SpringMenu items={item.children} label={item.label} onPick={onClose} />
        )}
      </motion.div>
    </>
  )
}

export default function MobileTabBar() {
  const { pathname } = useLocation()
  const active = sectionKey(pathname)
  const [sheet, setSheet] = useState(null)
  const barRef = useRef(null)
  const trackRef = useRef(null)
  const capRef = useRef(null)
  const itemRefs = useRef({})
  const cap = useLiquidCapsule(trackRef, capRef)
  useMinimize(barRef)

  useEffect(() => setSheet(null), [pathname])

  const target = sheet || active
  useLayoutEffect(() => {
    cap.moveTo(itemRefs.current[target])
  }, [target, cap])
  useEffect(() => {
    const ro = new ResizeObserver(() => cap.moveTo(itemRefs.current[target], { instant: true }))
    if (trackRef.current) ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [target, cap])

  const sheetItem = NAV.find((n) => n.key === sheet)

  return (
    <>
      <nav ref={barRef} className="qz-tabbar lg:hidden" aria-label="التنقل السريع" dir="rtl">
        <span className="qz-nav-glass" aria-hidden="true" />
        <div ref={trackRef} className="qz-tabbar-row">
          <span ref={capRef} className="qz-nav-capsule" aria-hidden="true" />
          {NAV.map((item) => {
            const isActive = target === item.key
            const common = {
              ref: (el) => {
                itemRefs.current[item.key] = el
              },
              className: 'qz-tab',
              'data-active': isActive ? 'true' : undefined,
              onPointerDown: (e) => {
                cap.press(true)
                playGlyph(e.currentTarget)
              },
              onPointerUp: () => cap.press(false),
              onPointerCancel: () => cap.press(false),
            }
            const content = (
              <>
                <NavGlyph name={item.glyph} />
                <span className="qz-tab-label">{SHORT[item.key] ?? item.label}</span>
              </>
            )
            return item.children ? (
              <button
                key={item.key}
                type="button"
                {...common}
                aria-haspopup="dialog"
                aria-expanded={sheet === item.key}
                onClick={() => setSheet((prev) => (prev === item.key ? null : item.key))}
              >
                {content}
              </button>
            ) : (
              <Link
                key={item.key}
                to={item.to}
                {...common}
                aria-current={active === item.key ? 'page' : undefined}
              >
                {content}
              </Link>
            )
          })}
        </div>
      </nav>

      <AnimatePresence>
        {sheetItem && <Sheet key={sheetItem.key} item={sheetItem} onClose={() => setSheet(null)} />}
      </AnimatePresence>
    </>
  )
}
