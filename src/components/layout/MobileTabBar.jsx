import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft } from 'lucide-react'
import { LiquidGlass } from '../glass/LiquidGlass.tsx'
import GlassIcon from '../ui/GlassIcon.jsx'
import { NAV, sectionKey } from './navConfig.js'
import { SPRING } from '../motion/Motion.jsx'
import { playGlassDropdown, playGlassTap } from '../../utils/glassSound.js'

/* ══ التابات السفلية (موبايل وتابلت) ═════════════════════════════════
   زي شريط تابات iOS: كبسولة زجاج عائمة تحت، فقاعة بتتزحلق للتاب النشط.
   الفِردِكت ومساحة بيفتحوا لوح سفلي (sheet) بأقسامهم، بيتقفل بالسحب
   لتحت أو بلمسة برّه. الشريط بيستخبى لما تنزل في الصفحة وبيرجع لما
   تطلع، عشان المحتوى ياخد الشاشة كلها وقت القراءة. */

const SHORT = {
  '/': 'الرئيسية',
  verdict: 'الفِردِكت',
  '/stories': 'الحكايات',
  '/videos': 'فيديو',
  '/articles': 'مقالات',
  masaha: 'مساحة',
}

function useHideOnScroll() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    let raf = 0
    const read = () => {
      raf = 0
      const y = window.scrollY
      const dy = y - last
      if (Math.abs(dy) > 8) {
        // بيستخبى بس بعد أول شاشة، وبيرجع مع أي طلوع أو قرب آخر الصفحة
        const nearBottom = window.innerHeight + y > document.documentElement.scrollHeight - 160
        setHidden(dy > 0 && y > 320 && !nearBottom)
        last = y
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return hidden
}

function Sheet({ item, onClose }) {
  const reduce = useReducedMotion()
  const startY = useRef(null)
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
        transition={{ type: 'spring', bounce: 0.12, duration: 0.45 }}
        drag={reduce ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.6 }}
        onDragStart={(_, info) => {
          startY.current = info.point.y
        }}
        onDragEnd={(_, info) => {
          // سحبة لتحت أو رمية سريعة = قفل
          if (info.offset.y > 90 || info.velocity.y > 600) onClose()
        }}
      >
        <div className="qz-sheet-grip" aria-hidden="true" />
        <p className="px-3 pb-2 text-xs font-semibold text-[color:var(--qz-accent)]">
          {item.label}
          {item.tag ? <span className="qz-latin ms-2 text-[10px] opacity-70">{item.tag}</span> : null}
        </p>
        <div className="flex flex-col gap-1">
          {item.children.map((child) => (
            <Link
              key={child.to}
              to={child.to}
              onClick={() => {
                playGlassTap()
                onClose()
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 active:bg-[rgb(var(--qz-mint-rgb)/0.08)]"
            >
              <GlassIcon icon={child.icon} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-[color:var(--qz-text)]">{child.label}</span>
                <span className="mt-0.5 block text-xs text-[color:var(--qz-text-3)]">{child.sub}</span>
              </span>
              <ArrowUpLeft className="size-4 text-[color:var(--qz-text-3)]" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </motion.div>
    </>
  )
}

export default function MobileTabBar() {
  const { pathname } = useLocation()
  const active = sectionKey(pathname)
  const hidden = useHideOnScroll()
  const [sheet, setSheet] = useState(null)

  useEffect(() => setSheet(null), [pathname])

  const sheetItem = NAV.find((n) => n.key === sheet)

  return (
    <>
      <nav
        className="qz-tabbar lg:hidden"
        aria-label="التنقل السريع"
        data-hidden={hidden && !sheet ? 'true' : undefined}
      >
        <LiquidGlass
          appearance="dark"
          material="clear"
          refraction={20}
          bezel={18}
          dispersion={0.1}
          blur={2.4}
          fallbackBlur={20}
          className="qz-tabbar-glass"
        >
          <div className="qz-tabbar-row">
            {NAV.map((item) => {
              const isActive = active === item.key || sheet === item.key
              const Icon = item.icon
              const content = (
                <>
                  {isActive && <motion.span layoutId="qz-tab-pill" className="qz-tab-pill" transition={SPRING} />}
                  <Icon aria-hidden="true" strokeWidth={isActive ? 2.1 : 1.75} />
                  <span>{SHORT[item.key] ?? item.label}</span>
                </>
              )
              return item.children ? (
                <button
                  key={item.key}
                  type="button"
                  className="qz-tab"
                  data-active={isActive ? 'true' : undefined}
                  aria-haspopup="dialog"
                  aria-expanded={sheet === item.key}
                  onClick={() => {
                    playGlassDropdown(sheet !== item.key)
                    setSheet((prev) => (prev === item.key ? null : item.key))
                  }}
                >
                  {content}
                </button>
              ) : (
                <Link
                  key={item.key}
                  to={item.to}
                  className="qz-tab"
                  data-active={isActive ? 'true' : undefined}
                  aria-current={active === item.key ? 'page' : undefined}
                  onClick={() => playGlassTap()}
                >
                  {content}
                </Link>
              )
            })}
          </div>
        </LiquidGlass>
      </nav>

      <AnimatePresence>{sheetItem && <Sheet key={sheetItem.key} item={sheetItem} onClose={() => setSheet(null)} />}</AnimatePresence>
    </>
  )
}
