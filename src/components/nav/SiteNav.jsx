import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import BrandLogo from '../brand/BrandLogo.jsx'
import { LiquidGlass } from '../glass/LiquidGlass.tsx'
import NavDropdown from './NavDropdown.jsx'
import NavIcon from './NavIcon.jsx'
import RollText from './RollText.jsx'
import ThemeOrb from './ThemeOrb.jsx'
import useCompact from './useCompact.js'
import { NAV, sectionKey } from './navConfig.js'
import { prefetchRoute } from '../../utils/liquidGlassEngine.js'
import { playGlassDropdown, playGlassTap } from '../../utils/glassSound.js'
import { SPRING } from '../motion/Motion.jsx'

/* ══ النافبار — «الجزيرة الزجاجية» ════════════════════════════════════
   كبسولة زجاج سائل عائمة في النص (LiquidGlass بانكسار حقيقي على Chromium).
   - كل قسم: أيقونة بتتحرك + اسم بيلفّ لفوق لما الماوس يقف عليه.
   - فقاعة واحدة بتتزحلق تحت العنصر اللي عليه الماوس، وخط منوّر تحت النشط.
   - الفِردِكت ومساحة بيفتحوا قائمة زجاج من تحت الزرار (NavDropdown).
   - البحث زرار أيقونة، والثيم زرار مدوّر واحد بيلف على التلات ثيمات.
   - مع التمرير الكبسولة بتصغر. تحت lg: لوجو + بحث + ثيم بس،
     والتنقل في التابات السفلية (MobileTabBar). */

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
const MENU_W = 400

export default function SiteNav({ onOpenSearch }) {
  const { pathname } = useLocation()
  const active = sectionKey(pathname)
  const compact = useCompact()
  const [hover, setHover] = useState(null)
  const [open, setOpen] = useState(null)
  const [anchor, setAnchor] = useState({ top: 0, center: 0 })
  const itemRefs = useRef({})
  const rowRef = useRef(null)
  const menuRef = useRef(null)
  const closeTimer = useRef(0)
  const openTimer = useRef(0)
  const focusFirst = useRef(false)

  // أي تنقل بيقفل القائمة
  useEffect(() => {
    setOpen(null)
    setHover(null)
  }, [pathname])

  const measure = useCallback((key) => {
    const el = itemRefs.current[key]
    const row = rowRef.current
    if (!el || !row) return
    const r = el.getBoundingClientRect()
    const s = row.getBoundingClientRect()
    const half = MENU_W / 2 + 12
    const center = Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half)
    setAnchor({ top: s.bottom + 12, center })
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
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(null)
      itemRefs.current[open]?.focus()
    }
    const onScroll = () => Math.abs(window.scrollY - y0) > 40 && setOpen(null)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open])

  // فتح بالكيبورد: أول عنصر ياخد الفوكس بعد ما القائمة تترسم
  useEffect(() => {
    if (!open || !focusFirst.current) return
    focusFirst.current = false
    requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]')?.focus())
  }, [open])

  const openMenu = (key, immediate = false) => {
    window.clearTimeout(closeTimer.current)
    window.clearTimeout(openTimer.current)
    const go = () =>
      setOpen((prev) => {
        if (prev !== key) playGlassDropdown(true)
        return key
      })
    if (immediate) go()
    else openTimer.current = window.setTimeout(go, 90)
  }
  const closeMenu = () => {
    window.clearTimeout(openTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(null), 170)
  }

  const onMenuKeyDown = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])]
    if (!items.length) return
    e.preventDefault()
    const i = items.indexOf(document.activeElement)
    const step = e.key === 'ArrowDown' ? 1 : -1
    items[(i + step + items.length) % items.length].focus()
  }

  const openItem = NAV.find((n) => n.key === open)

  return (
    <>
      <header className="qz-island" data-compact={compact ? 'true' : undefined} dir="rtl">
        <LiquidGlass
          appearance="dark"
          material="clear"
          refraction={24}
          bezel={22}
          dispersion={0.12}
          blur={2.6}
          fallbackBlur={22}
          className="qz-island-glass"
        >
          <div ref={rowRef} className="qz-island-row">
            <Link
              to="/"
              className="qz-island-brand"
              aria-label="قاسمز — الرئيسية"
              onClick={() => playGlassTap()}
            >
              <BrandLogo variant="glass" title="قاسمز" className="qz-island-logo" />
            </Link>

            <nav
              aria-label="التنقل الرئيسي"
              className="qz-island-nav"
              onPointerLeave={() => setHover(null)}
            >
              {NAV.map((item) => {
                const isActive = active === item.key
                const isOpen = open === item.key
                const common = {
                  ref: (el) => {
                    itemRefs.current[item.key] = el
                  },
                  className: 'qz-island-link qz-roll-host',
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
                      <motion.span
                        layoutId="qz-island-hover"
                        className="qz-island-hover"
                        transition={SPRING}
                      />
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="qz-island-dot"
                        className="qz-island-dot"
                        transition={SPRING}
                      />
                    )}
                    <NavIcon icon={item.icon} motion={item.motion} />
                    <RollText>{item.label}</RollText>
                    {item.children && (
                      <ChevronDown
                        className="qz-island-chev"
                        data-open={isOpen ? 'true' : undefined}
                        aria-hidden="true"
                      />
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
                    aria-controls={isOpen ? `qz-menu-${item.key}` : undefined}
                    onPointerLeave={closeMenu}
                    onClick={() => (isOpen ? setOpen(null) : openMenu(item.key, true))}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        focusFirst.current = true
                        if (isOpen) menuRef.current?.querySelector('[role="menuitem"]')?.focus()
                        else openMenu(item.key, true)
                      }
                    }}
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

            <div className="qz-island-actions">
              <button
                type="button"
                className="qz-island-search"
                onClick={onOpenSearch}
                aria-label="بحث في الموقع (Ctrl+K)"
              >
                <Search className="size-[18px]" aria-hidden="true" />
                <kbd className="qz-kbd">{IS_MAC ? '⌘K' : 'Ctrl K'}</kbd>
              </button>
              <ThemeOrb />
            </div>
          </div>
        </LiquidGlass>
      </header>

      <AnimatePresence>
        {openItem && (
          <NavDropdown
            key={openItem.key}
            ref={menuRef}
            item={openItem}
            anchor={anchor}
            onEnter={() => openMenu(openItem.key, true)}
            onLeave={closeMenu}
            onKeyDown={onMenuKeyDown}
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
