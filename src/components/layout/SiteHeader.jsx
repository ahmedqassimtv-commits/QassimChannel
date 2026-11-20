import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft, ChevronDown, Search } from 'lucide-react'
import BrandLogo from '../brand/BrandLogo.jsx'
import GlassIcon from '../ui/GlassIcon.jsx'
import DaylightThemeSwitch from '../ui/DaylightThemeSwitch.jsx'
import { LiquidGlass } from '../glass/LiquidGlass.tsx'
import YouTubeThumb from '../ui/YouTubeThumb.jsx'
import { NAV, sectionKey } from './navConfig.js'
import { setTheme, useTheme } from '../../utils/theme.js'
import { prefetchRoute } from '../../utils/liquidGlassEngine.js'
import { playGlassDropdown, playGlassTap } from '../../utils/glassSound.js'
import { reviews } from '../../data/reviews.js'
import { SPRING } from '../motion/Motion.jsx'

/* ══ النافبار ══════════════════════════════════════════════════════
   كبسولة زجاج سائل عائمة (LiquidGlass بانكسار حقيقي على Chromium).
   - كل قسم بأيقونة زجاجية (GlassIcon) زي القوائم المنسدلة بالظبط.
   - فقاعة زجاجية واحدة بتتزحلق تحت العنصر اللي الماوس عليه (layoutId)،
     ونقطة متوهجة تحت القسم النشط.
   - الفِردِكت ومساحة بيفتحوا لوح منسدل طالع من الزرار نفسه
     (transform-origin على الزرار)، وفي الفِردِكت آخر مراجعة كبطاقة.
   - مع التمرير الكبسولة بتتقلص (CSS على data-compact).
   - تحت lg: شريط علوي صغير (لوجو + بحث + ثيم) والتنقل في التابات السفلية. */

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

function useCompact(threshold = 40) {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    let raf = 0
    const read = () => {
      raf = 0
      const y = window.scrollY
      setCompact((prev) => (prev ? y > threshold * 0.5 : y > threshold))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [threshold])
  return compact
}

function MegaPanel({ item, anchor, onEnter, onLeave, onPick }) {
  const reduce = useReducedMotion()
  const latest = item.key === 'verdict' ? reviews[0] : null
  return (
    <motion.div
      key={item.key}
      role="menu"
      aria-label={item.label}
      className="qz-mega"
      style={{ top: anchor.top, right: anchor.right, transformOrigin: `${anchor.originX}px 0px` }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -6, filter: 'blur(8px)' }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4, filter: 'blur(6px)' }}
      transition={SPRING}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <LiquidGlass appearance="dark" material="regular" refraction={16} fallbackBlur={24} className="qz-mega-glass">
        <div className={`qz-mega-grid ${latest ? 'has-feature' : ''}`}>
          <div className="qz-mega-list">
            <p className="qz-mega-eyebrow">
              {item.label}
              {item.tag ? <span> — {item.tag}</span> : null}
            </p>
            {item.children.map((child) => (
              <Link
                key={child.to}
                to={child.to}
                role="menuitem"
                className="qz-mega-item group/item"
                onMouseEnter={() => prefetchRoute(child.to)}
                onClick={onPick}
              >
                <GlassIcon icon={child.icon} size="lg" />
                <span className="min-w-0">
                  <span className="qz-mega-title">{child.label}</span>
                  <span className="qz-mega-sub">{child.sub}</span>
                </span>
                <ArrowUpLeft className="qz-mega-arrow size-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
          {latest && (
            <Link to={latest.mediaType === 'مسلسل' ? '/verdict/series' : '/verdict/movies'} className="qz-mega-feature" onClick={onPick}>
              <YouTubeThumb youtubeId={latest.youtubeId} alt="" className="qz-mega-feature-img" />
              <span className="qz-mega-feature-body">
                <span className="qz-mega-eyebrow">آخر حُكم</span>
                <span className="qz-mega-feature-title">{latest.titleAr || latest.title}</span>
                <span className="qz-mega-feature-rate">
                  {latest.rating}
                  <small>/10</small>
                </span>
              </span>
            </Link>
          )}
        </div>
      </LiquidGlass>
    </motion.div>
  )
}

export default function SiteHeader({ onOpenSearch }) {
  const { pathname } = useLocation()
  const active = sectionKey(pathname)
  const compact = useCompact()
  const theme = useTheme()
  const [hover, setHover] = useState(null)
  const [open, setOpen] = useState(null)
  const [anchor, setAnchor] = useState({ top: 0, right: 0, originX: 0 })
  const itemRefs = useRef({})
  const shellRef = useRef(null)
  const closeTimer = useRef(0)
  const openTimer = useRef(0)

  // أي تنقل بيقفل اللوح
  useEffect(() => {
    setOpen(null)
    setHover(null)
  }, [pathname])

  const measure = useCallback((key) => {
    const el = itemRefs.current[key]
    const shell = shellRef.current
    if (!el || !shell) return
    const r = el.getBoundingClientRect()
    const s = shell.getBoundingClientRect()
    const panelRight = Math.max(12, window.innerWidth - r.right - 24)
    setAnchor({ top: s.bottom + 10, right: panelRight, originX: window.innerWidth - panelRight - r.left - r.width / 2 })
  }, [])

  useLayoutEffect(() => {
    if (!open) return undefined
    measure(open)
    const onResize = () => measure(open)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open, compact, measure])

  // Escape يقفل، والتمرير بعيد يقفل
  useEffect(() => {
    if (!open) return undefined
    const y0 = window.scrollY
    const onKey = (e) => e.key === 'Escape' && setOpen(null)
    const onScroll = () => Math.abs(window.scrollY - y0) > 40 && setOpen(null)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open])

  const openMenu = (key, immediate = false) => {
    window.clearTimeout(closeTimer.current)
    window.clearTimeout(openTimer.current)
    const go = () => {
      setOpen((prev) => {
        if (prev !== key) playGlassDropdown(true)
        return key
      })
    }
    if (immediate) go()
    else openTimer.current = window.setTimeout(go, 90)
  }
  const closeMenu = () => {
    window.clearTimeout(openTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(null), 170)
  }

  const openItem = NAV.find((n) => n.key === open)

  return (
    <>
      <header className="qz-header" data-compact={compact ? 'true' : undefined} dir="rtl">
        <LiquidGlass
          appearance="dark"
          material="clear"
          refraction={24}
          bezel={22}
          dispersion={0.12}
          blur={2.6}
          fallbackBlur={22}
          className="qz-header-glass"
        >
          <div ref={shellRef} className="qz-header-row">
            <Link to="/" className="qz-header-brand" aria-label="قاسمز — الرئيسية" onClick={() => playGlassTap()}>
              <BrandLogo variant="glass" title="قاسمز" className="qz-header-logo" />
            </Link>

            <nav aria-label="التنقل الرئيسي" className="qz-nav" onPointerLeave={() => setHover(null)}>
              {NAV.map((item) => {
                const isActive = active === item.key
                const isOpen = open === item.key
                const common = {
                  ref: (el) => {
                    itemRefs.current[item.key] = el
                  },
                  className: 'qz-nav-item',
                  'data-active': isActive ? 'true' : undefined,
                  onPointerEnter: () => {
                    setHover(item.key)
                    if (item.children) openMenu(item.key)
                    else {
                      closeMenu()
                      prefetchRoute(item.to)
                    }
                  },
                }
                const inner = (
                  <>
                    {hover === item.key && (
                      <motion.span layoutId="qz-nav-hover" className="qz-nav-hover" transition={SPRING} />
                    )}
                    {isActive && <motion.span layoutId="qz-nav-dot" className="qz-nav-dot" transition={SPRING} />}
                    <GlassIcon icon={item.icon} size="sm" active={isActive || isOpen} className="relative" />
                    <span className="relative">{item.label}</span>
                    {item.children && (
                      <ChevronDown className={`qz-nav-chev ${isOpen ? 'is-open' : ''}`} aria-hidden="true" />
                    )}
                  </>
                )
                return item.children ? (
                  <button
                    key={item.key}
                    type="button"
                    {...common}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    onPointerLeave={closeMenu}
                    onClick={() => (isOpen ? setOpen(null) : openMenu(item.key, true))}
                  >
                    {inner}
                  </button>
                ) : (
                  <Link
                    key={item.key}
                    to={item.to}
                    {...common}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => playGlassTap()}
                  >
                    {inner}
                  </Link>
                )
              })}
            </nav>

            <div className="qz-header-actions">
              <button type="button" className="qz-search-btn" onClick={onOpenSearch} aria-label="بحث في الموقع (Ctrl+K)">
                <Search className="size-4" aria-hidden="true" />
                <span className="qz-search-label">بحث</span>
                <kbd className="qz-kbd">{IS_MAC ? '⌘K' : 'Ctrl K'}</kbd>
              </button>
              <DaylightThemeSwitch
                theme={theme === 'gold' ? 'blue' : theme}
                onCycleTheme={(next) => setTheme(next === 'blue' ? 'gold' : next)}
                className="qz-theme-switch"
              />
            </div>
          </div>
        </LiquidGlass>
      </header>

      <AnimatePresence>
        {openItem && (
          <MegaPanel
            key={openItem.key}
            item={openItem}
            anchor={anchor}
            onEnter={() => openMenu(openItem.key, true)}
            onLeave={closeMenu}
            onPick={() => {
              setOpen(null)
              playGlassTap()
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
