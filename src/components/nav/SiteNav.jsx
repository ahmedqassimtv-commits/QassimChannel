import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpLeft,
  BookOpen,
  ChevronDown,
  Film,
  History,
  Library,
  Menu,
  Search,
  Video,
  X,
} from 'lucide-react'
import BrandLogo from '../brand/BrandLogo.jsx'
import NavHost from '../ai/NavHost.jsx'
import DaylightThemeSwitch from '../ui/DaylightThemeSwitch.jsx'
import NavDropdown from './NavDropdown.jsx'
import NavIcon from './NavIcon.jsx'
import useCompact from './useCompact.js'
import { NAV, sectionKey } from './navConfig.js'
import { videos } from '../../data/videos.js'
import { reviews } from '../../data/reviews.js'
import { articles } from '../../data/articles.js'
import { stories } from '../../data/stories.js'
import { books } from '../../data/books.js'
import { useCinema } from '../qz/CinemaPlayer.jsx'
import { setThemeWithWipe, THEME_META, useTheme } from '../../utils/theme.js'
import { playGlassDropdown, playGlassKeystroke, playGlassMorph, playGlassTap } from '../../utils/glassSound.js'
import { SPRING, SPRING_NAV } from '../motion/Motion.jsx'

/* ══ النافبار العلوي المتكيّف مع كل قسم ═══════════════════════════════
   يتحوّل شكل ومادة وألوان وحواف النافبار تلقائياً عند الدخول لكل قسم
   ليتلاءم مع هوية الصفحة (معرض الحكايات، جريدة المقالات، دفتر قاع الأفكار،
   بكرة الفِردِكت، عن أحمد، والجزيرة الزجاجية). */

function getNavTheme(pathname) {
  if (pathname.startsWith('/stories')) return 'stories'
  if (pathname.startsWith('/articles')) return 'articles'
  if (pathname.startsWith('/ideas') || pathname.startsWith('/masaha/ideas')) return 'ideas'
  if (pathname.startsWith('/verdict') || pathname.startsWith('/review')) return 'verdict'
  if (
    pathname === '/masaha/ahmed' ||
    pathname === '/ahmed' ||
    pathname === '/about' ||
    pathname === '/masaha/about'
  ) {
    return 'ahmed'
  }
  return 'glass'
}

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
const MENU_W = 360

const normalizeAr = (s = '') =>
  String(s)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')

function buildSearchIndex() {
  const sections = NAV.flatMap((n) => (n.children ? n.children : [n])).map((n) => ({
    group: 'الأقسام',
    title: n.label,
    sub: n.sub ?? 'قسم رئيسي في منصة قاسمز',
    to: n.to,
    icon: n.icon,
  }))
  return [
    ...sections,
    ...videos.map((v) => ({
      group: 'الفيديوهات',
      title: v.title,
      sub: `${v.category} · ${v.summary ?? ''}`,
      thumb: `https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`,
      video: v,
      icon: Video,
    })),
    ...reviews.map((r) => ({
      group: 'الفِردِكت',
      title: r.titleAr || r.title,
      sub: `${r.title} · ${r.mediaType} · ${r.rating}/10`,
      extra: (r.tags ?? []).join(' '),
      thumb: `https://i.ytimg.com/vi/${r.youtubeId}/mqdefault.jpg`,
      to: r.mediaType === 'مسلسل' ? '/verdict/series' : '/verdict/movies',
      icon: Film,
    })),
    ...articles.map((a) => ({
      group: 'المقالات',
      title: a.title,
      sub: `${a.category} · ${a.excerpt}`,
      to: `/articles/${a.slug}`,
      icon: BookOpen,
    })),
    ...stories.map((s) => ({
      group: 'الحكايات',
      title: s.title,
      sub: `${s.year} · ${s.location}`,
      to: '/stories',
      icon: History,
    })),
    ...books.map((b) => ({
      group: 'الكتب',
      title: b.title,
      sub: b.author,
      to: '/masaha/books',
      icon: Library,
    })),
  ].map((item) => ({ ...item, key: normalizeAr(`${item.title} ${item.sub} ${item.extra ?? ''}`) }))
}

function MobileGlassMenu({ active, navTheme = 'glass', navTone = 'dark', onClose }) {
  const reduce = useReducedMotion()
  const [expanded, setExpanded] = useState(null)

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label="قائمة التنقل"
      className="qz-mob-menu"
      data-nav-theme={navTheme}
      data-nav-tone={navTone}
      dir="rtl"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.96, filter: 'blur(8px)' }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97, filter: 'blur(6px)' }}
      transition={SPRING}
    >
      <div className="qz-island-menu-glass qz-mob-menu-glass">
        <nav aria-label="أقسام الموقع" className="qz-mob-menu-body">
          {NAV.map((item, idx) => {
            const isActive = active === item.key
            const isExp = expanded === item.key || (!expanded && isActive && item.children)

            if (item.children) {
              return (
                <div key={item.key} className="qz-mob-group">
                  <button
                    type="button"
                    className="qz-mob-item"
                    data-active={isActive ? 'true' : undefined}
                    aria-expanded={Boolean(isExp)}
                    onClick={() => {
                      playGlassDropdown(!isExp)
                      setExpanded((prev) => (prev === item.key ? null : item.key))
                    }}
                  >
                    <span className="qz-island-menu-icon">
                      <NavIcon icon={item.icon} motion={item.motion} />
                    </span>
                    <span className="qz-mob-item-label">
                      <span>{item.label}</span>
                      {item.tag ? <span className="qz-latin qz-mob-tag">{item.tag}</span> : null}
                    </span>
                    <ChevronDown
                      className="qz-island-chev"
                      data-open={isExp ? 'true' : undefined}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isExp && (
                      <motion.div
                        initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="qz-mob-sublist"
                      >
                        {item.children.map((child, ci) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            className="qz-mob-subitem"
                            onClick={() => {
                              playGlassTap()
                              onClose()
                            }}
                          >
                            <span className="qz-island-menu-num qz-latin">
                              {String(ci + 1).padStart(2, '0')}
                            </span>
                            <NavIcon icon={child.icon} motion={child.motion} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-[color:var(--qz-text)]">
                                {child.label}
                              </span>
                              <span className="block text-xs text-[color:var(--qz-text-3)]">
                                {child.sub}
                              </span>
                            </span>
                            <ArrowUpLeft className="size-4 text-[color:var(--qz-text-3)]" aria-hidden="true" />
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            }

            return (
              <motion.div
                key={item.key}
                initial={reduce ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: reduce ? 0 : idx * 0.025 }}
              >
                <Link
                  to={item.to}
                  className="qz-mob-item"
                  data-active={isActive ? 'true' : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    playGlassTap()
                    onClose()
                  }}
                >
                  <span className="qz-island-menu-icon">
                    <NavIcon icon={item.icon} motion={item.motion} />
                  </span>
                  <span className="qz-mob-item-label">{item.label}</span>
                  <ArrowUpLeft className="size-4 text-[color:var(--qz-text-3)]" aria-hidden="true" />
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </div>
    </motion.div>
  )
}

export default function SiteNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const cinema = useCinema()
  const reduce = useReducedMotion()
  const active = sectionKey(pathname)
  const navTheme = getNavTheme(pathname)
  const compact = useCompact()
  const theme = useTheme()

  const [storiesDark, setStoriesDark] = useState(false)
  const [storiesTop, setStoriesTop] = useState(true)
  const [storiesHidden, setStoriesHidden] = useState(false)
  // سويتش الثيمات متاح في الجزيرة الزجاجية ومُدمج بطابع الورق والحبر في قاع الأفكار
  const showThemeSwitch = navTheme === 'glass' || navTheme === 'ideas' || navTheme === 'ahmed'
  const [themePulse, setThemePulse] = useState(false)
  const [themeToast, setThemeToast] = useState(null)
  const toastTimerRef = useRef(0)
  const pulseTimerRef = useRef(0)

  const navTone =
    navTheme === 'articles' || navTheme === 'ideas'
      ? 'light'
      : navTheme === 'stories'
        ? storiesDark
          ? 'dark'
          : 'light'
        : 'dark'

  // استشعار سطح القاعة الحالية خلف النافبار داخل قسم الحكايات (Putty فاتح ⇄ Ink داكن)
  useEffect(() => {
    if (navTheme !== 'stories') {
      setStoriesDark(false)
      setStoriesTop(true)
      setStoriesHidden(false)
      return undefined
    }
    let rafId = 0
    let lastY = window.scrollY
    const checkSurface = () => {
      rafId = 0
      const y = window.scrollY
      const dy = y - lastY
      if (Math.abs(dy) > 6) {
        // زي Structured: الهيدر بيختفي وانت نازل، ويرجع أول ما تطلع لفوق
        setStoriesHidden(dy > 0 && y > window.innerHeight * 0.6)
        lastY = y
      }
      setStoriesTop(y < 24)
      const probeY = 44
      const sections = document.querySelectorAll('[data-structured-surface]')
      let isDark = false
      for (const el of sections) {
        const rect = el.getBoundingClientRect()
        if (rect.top <= probeY && rect.bottom >= probeY) {
          isDark = el.getAttribute('data-structured-surface') === 'ink'
          break
        }
      }
      setStoriesDark((prev) => (prev === isDark ? prev : isDark))
    }
    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(checkSurface)
    }
    checkSurface()
    const initTimer = window.setTimeout(checkSurface, 120)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.clearTimeout(initTimer)
      if (rafId) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [navTheme, pathname])

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimerRef.current)
      window.clearTimeout(pulseTimerRef.current)
    }
  }, [])

  const handleCycleTheme = useCallback((nextRaw) => {
    const next = nextRaw === 'blue' ? 'gold' : nextRaw
    setThemeWithWipe(next, switchRef.current)
    setThemePulse(true)
    window.clearTimeout(pulseTimerRef.current)
    pulseTimerRef.current = window.setTimeout(() => setThemePulse(false), 620)
    const meta = THEME_META[next]
    if (meta) {
      setThemeToast({ key: `${next}-${Date.now()}`, label: meta.label, accent: meta.accent })
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = window.setTimeout(() => setThemeToast(null), 1650)
    }
  }, [])

  const headerRef = useRef(null)
  const switchRef = useRef(null)
  const itemRefs = useRef({})
  const rowRef = useRef(null)
  const menuRef = useRef(null)
  const searchWrapRef = useRef(null)
  const searchInputRef = useRef(null)
  const searchDropRef = useRef(null)
  const closeTimer = useRef(0)
  const openTimer = useRef(0)
  const focusFirst = useRef(false)

  const [hover, setHover] = useState(null)
  const [open, setOpen] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchor, setAnchor] = useState({ top: 0, center: 0 })

  // حالة شريط البحث المدمج داخل النافبار
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCursor, setSearchCursor] = useState(0)

  const searchIndex = useMemo(buildSearchIndex, [])
  const searchResults = useMemo(() => {
    const q = normalizeAr(searchQuery.trim())
    if (!q) return searchIndex.filter((i) => i.group === 'الأقسام').slice(0, 8)
    const words = q.split(/\s+/)
    return searchIndex
      .map((item) => {
        if (!words.every((w) => item.key.includes(w))) return null
        const t = normalizeAr(item.title)
        const score =
          (t.startsWith(words[0]) ? 0 : t.includes(words[0]) ? 1 : 2) +
          (item.group === 'الأقسام' ? -0.5 : 0)
        return { item, score }
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 8)
      .map((r) => r.item)
  }, [searchQuery, searchIndex])

  const openInlineSearch = useCallback(() => {
    setOpen(null)
    setMobileOpen(false)
    setSearchExpanded(true)
    setSearchOpen(true)
    setSearchCursor(0)
    playGlassMorph(true)
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }, [])

  const closeInlineSearch = useCallback(() => {
    searchInputRef.current?.blur()
    setSearchOpen(false)
    setSearchExpanded(false)
    setSearchQuery('')
    setSearchCursor(0)
    playGlassMorph(false)
  }, [])

  // أي تنقل بيقفل القوائم والبحث المدمج
  useEffect(() => {
    setOpen(null)
    setHover(null)
    setMobileOpen(false)
    setSearchOpen(false)
    setSearchExpanded(false)
    setSearchQuery('')
  }, [pathname])

  // إغلاق قائمة الموبايل تلقائياً عند تكبير الشاشة للديسكتوب
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e) => {
      if (e.matches) setMobileOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // اختصارات الكيبورد العامة (Ctrl+K أو / يفتحوا شريط البحث داخل النافبار نفسه)
  useEffect(() => {
    const onKey = (e) => {
      const typing =
        /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (searchExpanded) closeInlineSearch()
        else openInlineSearch()
      } else if (e.key === '/' && !typing) {
        e.preventDefault()
        openInlineSearch()
      } else if (e.key === 'Escape') {
        if (searchExpanded || searchOpen) closeInlineSearch()
        if (mobileOpen) setMobileOpen(false)
        if (open) {
          const k = open
          setOpen(null)
          itemRefs.current[k]?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchExpanded, searchOpen, mobileOpen, open, openInlineSearch, closeInlineSearch])

  // إغلاق عند النقر خارج النافبار أو التمرير
  useEffect(() => {
    const onPointerDown = (e) => {
      const t = e.target
      if (
        (searchExpanded || searchOpen) &&
        !searchWrapRef.current?.contains(t) &&
        !searchDropRef.current?.contains(t)
      ) {
        closeInlineSearch()
      }
      if (mobileOpen && !headerRef.current?.contains(t)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [searchExpanded, searchOpen, mobileOpen, closeInlineSearch])

  useEffect(() => {
    if (!open && !searchOpen && !mobileOpen) return undefined
    const y0 = window.scrollY
    const onScroll = () => {
      if (Math.abs(window.scrollY - y0) > 36) {
        if (open) setOpen(null)
        if (searchOpen) setSearchOpen(false)
        if (mobileOpen) setMobileOpen(false)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open, searchOpen, mobileOpen])

  const measure = useCallback((key) => {
    const el = itemRefs.current[key]
    const row = rowRef.current
    if (!el || !row) return
    const r = el.getBoundingClientRect()
    const s = row.getBoundingClientRect()
    const half = MENU_W / 2 + 12
    // «عن أحمد»: النافبار شريط جانبي، فالقايمة بتفتح جنبه بدل ما تنزل تحته
    if (navTheme === 'ahmed' && window.innerWidth >= 1024) {
      setAnchor({ top: Math.max(12, Math.min(r.top - 8, window.innerHeight - 440)), center: s.left - half })
      return
    }
    const center = Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half)
    setAnchor({ top: s.bottom + 12, center })
  }, [navTheme])

  useLayoutEffect(() => {
    if (!open) return undefined
    measure(open)
    const onResize = () => measure(open)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open, compact, measure])

  useEffect(() => {
    if (!open || !focusFirst.current) return
    focusFirst.current = false
    requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]')?.focus())
  }, [open])

  const openMenu = (key, immediate = false) => {
    if (searchExpanded) return
    window.clearTimeout(closeTimer.current)
    window.clearTimeout(openTimer.current)
    const go = () =>
      setOpen((prev) => {
        if (prev !== key) playGlassDropdown(true)
        return key
      })
    if (immediate) go()
    else openTimer.current = window.setTimeout(go, 70)
  }
  const closeMenu = () => {
    window.clearTimeout(openTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(null), 160)
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

  const pickSearchResult = (item) => {
    if (!item) return
    playGlassTap()
    closeInlineSearch()
    if (item.video) cinema.open(item.video)
    else if (item.to) navigate(item.to)
  }

  const onSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSearchOpen(true)
      if (searchResults.length) setSearchCursor((c) => (c + 1) % searchResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSearchOpen(true)
      if (searchResults.length)
        setSearchCursor((c) => (c - 1 + searchResults.length) % searchResults.length)
    } else if (e.key === 'Enter' && searchResults[searchCursor]) {
      e.preventDefault()
      pickSearchResult(searchResults[searchCursor])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeInlineSearch()
    }
  }

  const openItem = NAV.find((n) => n.key === open)

  return (
    <div ref={headerRef}>
      <header
        className="qz-island"
        data-nav-theme={navTheme}
        data-nav-tone={navTone}
        data-compact={compact ? 'true' : undefined}
        data-at-top={navTheme === 'stories' && storiesTop ? 'true' : undefined}
        data-autohide={navTheme === 'stories' && storiesHidden && !open && !mobileOpen && !searchExpanded ? 'true' : undefined}
        data-searching={searchExpanded ? 'true' : undefined}
        dir="rtl"
      >
        <div className="qz-island-glass">
          <div ref={rowRef} className="qz-island-row">
            {/* الشعار + فقاعة قاسم الافتراضي (AI) */}
            <div className="flex flex-none items-center gap-1.5">
              <Link
                to="/"
                className="qz-island-brand"
                aria-label="قاسمز — الرئيسية"
                onClick={() => playGlassTap()}
              >
                <BrandLogo
                  variant={navTone === 'light' ? 'solid' : 'glass'}
                  title="قاسمز"
                  className="qz-island-logo"
                />
              </Link>
              <NavHost
                navTheme={navTheme}
                navTone={navTone}
                compact={compact}
                searchExpanded={searchExpanded}
                onOpenChange={(isOpen) => {
                  if (isOpen) {
                    setOpen(null)
                    setMobileOpen(false)
                  }
                }}
              />
            </div>

            <span className="qz-island-sep qz-island-sep-desk" aria-hidden="true" />

            {/* روابط الأقسام — تنكمش بنعومة داخل النافبار عند فتح حقل البحث المدمج */}
            <nav
              aria-label="التنقل الرئيسي"
              className="qz-island-nav"
              data-hidden={searchExpanded ? 'true' : undefined}
              onPointerLeave={() => setHover(null)}
            >
              {NAV.map((item) => {
                const isActive = active === item.key
                const isOpen = open === item.key
                const common = {
                  ref: (el) => {
                    itemRefs.current[item.key] = el
                  },
                  className: 'qz-island-link',
                  'data-active': isActive ? 'true' : undefined,
                  onPointerEnter: () => {
                    setHover(item.key)
                    if (item.children) openMenu(item.key)
                    else closeMenu()
                  },
                }
                const inner = (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="qz-island-active"
                        className="qz-island-active"
                        transition={SPRING_NAV}
                      />
                    )}
                    {hover === item.key && hover !== active && (
                      <motion.span
                        layoutId="qz-island-hover"
                        className="qz-island-hover"
                        transition={SPRING_NAV}
                      />
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="qz-island-dot"
                        className="qz-island-dot"
                        transition={SPRING_NAV}
                      />
                    )}
                    <NavIcon icon={item.icon} motion={item.motion} />
                    <span className="qz-island-label">{item.label}</span>
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

            <span className="qz-island-sep qz-island-sep-desk" aria-hidden="true" />

            {/* مجموعة البحث المدمج + سويتش الثيم المدمج + قائمة الموبايل */}
            <div className="qz-island-actions">
              <div
                ref={searchWrapRef}
                role="combobox"
                aria-expanded={searchExpanded && searchOpen}
                aria-haspopup="listbox"
                aria-controls="qz-inline-search-list"
                className="qz-inline-search"
                data-expanded={searchExpanded ? 'true' : undefined}
                onClick={() => {
                  if (!searchExpanded) openInlineSearch()
                  else {
                    setSearchOpen(true)
                    searchInputRef.current?.focus()
                  }
                }}
              >
                <Search className="qz-inline-search-ico" aria-hidden="true" />
                {searchExpanded ? (
                  <>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onFocus={() => setSearchOpen(true)}
                      onChange={(e) => {
                        playGlassKeystroke()
                        setSearchQuery(e.target.value)
                        setSearchCursor(0)
                        setSearchOpen(true)
                      }}
                      onKeyDown={onSearchKeyDown}
                      placeholder="ابحث في الأقسام، الفيديوهات، المقالات..."
                      aria-label="بحث في منصة قاسمز"
                      autoComplete="off"
                      spellCheck="false"
                      className="qz-inline-search-input"
                    />
                    <button
                      type="button"
                      className="qz-inline-search-close"
                      aria-label="إغلاق البحث"
                      onClick={(e) => {
                        e.stopPropagation()
                        closeInlineSearch()
                      }}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <span className="qz-inline-search-label">
                    <span>بحث</span>
                    <kbd className="qz-kbd">{IS_MAC ? '⌘K' : 'Ctrl K'}</kbd>
                  </span>
                )}
              </div>

              {showThemeSwitch && (
                <>
              {/* سويتش الثيم مدمج داخل نفس كبسولة النافبار مع نبضة حركة وإشعار الثيم */}
              <div
                ref={switchRef}
                className="qz-island-switch-slot"
                data-pulsing={themePulse ? 'true' : undefined}
              >
                <DaylightThemeSwitch
                  theme={theme === 'gold' ? 'blue' : theme}
                  onCycleTheme={handleCycleTheme}
                  className="qz-theme-switch"
                />
                <AnimatePresence>
                  {themeToast && (
                    <motion.div
                      key={themeToast.key}
                      role="status"
                      aria-live="polite"
                      className="qz-theme-toast"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.9 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.94 }}
                      transition={SPRING}
                    >
                      <span
                        className="qz-theme-toast-dot"
                        style={{ backgroundColor: themeToast.accent }}
                        aria-hidden="true"
                      />
                      <span>{themeToast.label}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

                </>
              )}

              <span className="qz-island-sep qz-island-sep-mob" aria-hidden="true" />

              <button
                type="button"
                className="qz-island-mob-btn"
                aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                aria-expanded={mobileOpen}
                onClick={() => {
                  if (searchExpanded) closeInlineSearch()
                  playGlassDropdown(!mobileOpen)
                  setMobileOpen((v) => !v)
                }}
              >
                {mobileOpen ? (
                  <X className="size-[18px]" aria-hidden="true" />
                ) : (
                  <Menu className="size-[18px]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* قائمة اقتراحات البحث المنسدلة مباشرة تحت شريط البحث بدون إخفاء الموقع */}
        <AnimatePresence>
          {searchExpanded && searchOpen && (
            <motion.div
              ref={searchDropRef}
              id="qz-inline-search-list"
              role="listbox"
              aria-label="اقتراحات البحث"
              className="qz-inline-search-drop"
              dir="rtl"
              initial={
                reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97, filter: 'blur(8px)' }
              }
              animate={
                reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
              }
              exit={
                reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98, filter: 'blur(6px)' }
              }
              transition={SPRING}
            >
              <div className="qz-island-menu-glass">
                <div className="qz-inline-search-list">
                  {searchResults.length === 0 ? (
                    <p className="qz-inline-search-empty">
                      لا توجد نتائج مطابقة لـ «{searchQuery}»
                    </p>
                  ) : (
                    searchResults.map((item, idx) => {
                      const Icon = item.icon
                      const isSel = idx === searchCursor
                      return (
                        <button
                          key={`${item.group}-${item.title}-${idx}`}
                          type="button"
                          role="option"
                          aria-selected={isSel}
                          className="qz-inline-search-row"
                          data-active={isSel ? 'true' : undefined}
                          onMouseEnter={() => setSearchCursor(idx)}
                          onClick={() => pickSearchResult(item)}
                        >
                          {isSel && (
                            <motion.span
                              layoutId="qz-inline-search-hl"
                              className="qz-inline-search-hl"
                              transition={SPRING_NAV}
                            />
                          )}
                          <span className="qz-island-menu-icon">
                            {Icon && <Icon className="size-4" aria-hidden="true" />}
                          </span>
                          <span className="qz-inline-search-meta">
                            <span className="qz-inline-search-title">{item.title}</span>
                            <span className="qz-inline-search-sub">
                              {item.group} · {item.sub}
                            </span>
                          </span>
                          <ArrowUpLeft className="qz-inline-search-arrow" aria-hidden="true" />
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {openItem && !searchExpanded && (
          <NavDropdown
            key={openItem.key}
            ref={menuRef}
            item={openItem}
            anchor={anchor}
            navTheme={navTheme}
            navTone={navTone}
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

      <AnimatePresence>
        {mobileOpen && (
          <MobileGlassMenu
            active={active}
            navTheme={navTheme}
            navTone={navTone}
            onClose={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
