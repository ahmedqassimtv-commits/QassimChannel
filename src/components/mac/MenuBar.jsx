import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { House, MessageCircle, Radio, Search, SlidersHorizontal, UserRound } from 'lucide-react'
import NavHost from '../ai/NavHost.jsx'
import { THEMES, setTheme, useTheme } from '../../utils/theme.js'
import MacMenu, { actionableItems } from './MacMenu.jsx'
import Spotlight from './Spotlight.jsx'
import ControlCenter from './ControlCenter.jsx'
import { SHORTCUT_ROUTES, THEME_META, buildMenus } from './navModel.js'
import './mac.css'

/*
 * شريط القوائم — من Figma: macOS 26 › Menu Bar (Dark).
 * • شريط شفاف فوق الخلفية، وراه حزمة blur(30px) + تغميق 12% بتتلاشى لتحت (mask).
 * • البداية (يمين في العربي): لوجو قاسمز ← قاسم الافتراضي، اسم «قاسمز» bold، ثم الأقسام.
 * • النهاية: أون إير، بحث، مركز التحكم، الساعة.
 * • العنصر المفتوح عليه كبسولة rgba(255,255,255,.08) بـplus-lighter بتتزحلق بين العناصر،
 *   ولما قائمة تكون مفتوحة المرور على عنصر تاني بيبدّل القائمة (زي ماك بالظبط).
 */

const SEL_SPRING = { type: 'spring', stiffness: 560, damping: 40, mass: 0.7 }

function useCompact() {
  const query = '(max-width: 900px)'
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setCompact(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return compact
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(id)
  }, [])
  const date = now.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = now.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
  return { date, time }
}

export default function MenuBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const theme = useTheme()
  const compact = useCompact()
  const clock = useClock()
  const [openId, setOpenId] = useState(null)
  const [active, setActive] = useState(-1)
  const [anchor, setAnchor] = useState(null)
  const [spotlight, setSpotlight] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const triggerRefs = useRef({})
  const barRef = useRef(null)
  const menuRef = useRef(null)

  const sectionMenus = useMemo(() => buildMenus(), [])

  const appMenu = useMemo(
    () => ({
      id: 'app',
      label: 'قاسمز',
      items: [
        { label: 'الرئيسية', icon: House, to: '/', shortcut: '0' },
        { label: 'عن أحمد', icon: UserRound, to: '/about', shortcut: '7' },
        ...(compact
          ? [
              { type: 'sep' },
              { type: 'header', label: 'الأقسام' },
              ...sectionMenus.map((m) => ({ label: m.label, icon: m.items[0].icon, to: m.items[0].to })),
            ]
          : []),
        { type: 'sep' },
        { type: 'header', label: 'المظهر' },
        ...THEMES.map((t) => ({ label: THEME_META[t].label, theme: t, checked: theme === t })),
        { type: 'sep' },
        { label: 'كلّم قاسم الافتراضي', icon: MessageCircle, action: 'host' },
        { label: 'بحث', icon: Search, action: 'spotlight', kbd: '⌘K' },
      ],
    }),
    [compact, sectionMenus, theme],
  )

  const menus = useMemo(() => (compact ? [appMenu] : [appMenu, ...sectionMenus]), [appMenu, compact, sectionMenus])
  const openMenu = menus.find((m) => m.id === openId) || null
  const isCC = openId === 'cc'

  const close = useCallback(() => {
    setOpenId(null)
    setActive(-1)
  }, [])

  const measure = useCallback((id) => {
    const el = triggerRefs.current[id]
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right - 4), left: r.left }
  }, [])

  const openAt = useCallback(
    (id, viaKeyboard = false) => {
      setAnchor(measure(id))
      setOpenId(id)
      setActive(viaKeyboard ? 0 : -1)
    },
    [measure],
  )

  const pick = useCallback(
    (item) => {
      close()
      if (item.theme) setTheme(item.theme)
      else if (item.action === 'spotlight') setSpotlight(true)
      else if (item.action === 'host') window.dispatchEvent(new CustomEvent('qz:open-host'))
      else if (item.href) window.open(item.href, '_blank', 'noopener')
      else if (item.to) navigate(item.to)
    },
    [close, navigate],
  )

  // اختصارات عامة: ⌘K / Ctrl+K للبحث، ⌥رقم للأقسام، Esc للقفل
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        close()
        setSpotlight((v) => !v)
        return
      }
      if (e.altKey && !e.metaKey && !e.ctrlKey && /^Digit\d$/.test(e.code)) {
        const route = SHORTCUT_ROUTES[e.code.slice(5)]
        if (route) {
          e.preventDefault()
          close()
          navigate(route)
        }
        return
      }
      if (!openId) return
      if (e.key === 'Escape') {
        e.preventDefault()
        const id = openId
        close()
        triggerRefs.current[id]?.focus()
        return
      }
      if (!openMenu) return
      const count = actionableItems(openMenu).length
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => (i + 1) % count)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => (i <= 0 ? count - 1 : i - 1))
      } else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault()
        pick(actionableItems(openMenu)[active])
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // في العربي «التالي» على الشمال
        e.preventDefault()
        const idx = menus.findIndex((m) => m.id === openId)
        const step = e.key === 'ArrowLeft' ? 1 : -1
        const next = menus[(idx + step + menus.length) % menus.length]
        openAt(next.id, true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, close, menus, navigate, openAt, openId, openMenu, pick])

  useEffect(() => {
    const openSpot = () => {
      close()
      setSpotlight(true)
    }
    window.addEventListener('qz:spotlight', openSpot)
    return () => window.removeEventListener('qz:spotlight', openSpot)
  }, [close])

  // ضغطة برّه = قفل
  useEffect(() => {
    if (!openId) return undefined
    const onDown = (e) => {
      if (barRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      close()
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', close)
    }
  }, [close, openId])

  useEffect(() => {
    close()
  }, [pathname, close])

  useLayoutEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // منيو الشريط: ضغطة تفتح/تقفل، ولو فيه قائمة مفتوحة المرور يبدّل
  const triggerProps = (id) => ({
    ref: (el) => {
      triggerRefs.current[id] = el
    },
    'aria-haspopup': id === 'cc' ? 'dialog' : 'menu',
    'aria-expanded': openId === id,
    onPointerDown: (e) => {
      if (e.button !== 0) return
      e.preventDefault()
      if (openId === id) close()
      else openAt(id)
    },
    onClick: (e) => {
      // Enter / Space / قارئ الشاشة (مفيش pointerdown)
      if (e.detail !== 0) return
      if (openId === id) close()
      else openAt(id, true)
    },
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        openAt(id, true)
      }
    },
    onPointerEnter: () => {
      if (openId && openId !== id) openAt(id)
    },
  })

  const sel = (id) =>
    openId === id ? (
      <motion.span layoutId="mac-mb-sel" className="mac-mb-sel" transition={SEL_SPRING} aria-hidden="true" />
    ) : null

  return (
    <>
      <header ref={barRef} className="mac-menubar" data-scrolled={scrolled ? 'true' : undefined} dir="rtl">
        <div className="mac-menubar-band" aria-hidden="true" />
        <nav className="mac-menubar-row" aria-label="القوائم">
          <div className="mac-mb-leading">
            <span className="mac-mb-host">
              <NavHost onHome={() => navigate('/')} />
            </span>
            <button type="button" className="mac-mb-item mac-mb-app" {...triggerProps('app')}>
              {sel('app')}
              <span>قاسمز</span>
            </button>
            {!compact &&
              sectionMenus.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="mac-mb-item"
                  data-current={m.match(pathname) ? 'true' : undefined}
                  {...triggerProps(m.id)}
                >
                  {sel(m.id)}
                  <span>{m.label}</span>
                </button>
              ))}
          </div>

          <div className="mac-mb-trailing">
            {!compact && (
              <button
                type="button"
                className="mac-mb-item mac-mb-icon mac-mb-live"
                aria-label="أون إير"
                data-current={pathname.startsWith('/on-air') ? 'true' : undefined}
                onClick={() => navigate('/on-air')}
              >
                <Radio strokeWidth={2.2} aria-hidden="true" />
                <span className="mac-mb-live-dot" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              className="mac-mb-item mac-mb-icon"
              aria-label="بحث"
              onClick={() => {
                close()
                setSpotlight(true)
              }}
            >
              <Search strokeWidth={2.3} aria-hidden="true" />
            </button>
            <button type="button" className="mac-mb-item mac-mb-icon" aria-label="مركز التحكم" {...triggerProps('cc')}>
              {sel('cc')}
              <SlidersHorizontal strokeWidth={2.3} aria-hidden="true" />
            </button>
            <span className="mac-mb-clock" aria-label={`${clock.date} ${clock.time}`}>
              {!compact && <span>{clock.date}</span>}
              <span>{clock.time}</span>
            </span>
          </div>
        </nav>
      </header>

      {createPortal(
        <div dir="rtl" className="mac-menu-layer">
          <AnimatePresence>
            {openMenu && anchor && (
              <MacMenu
                key={openMenu.id}
                ref={menuRef}
                menu={openMenu}
                active={active}
                onHover={setActive}
                onPick={pick}
                style={{ position: 'fixed', top: anchor.top, right: anchor.right, transformOrigin: 'top right' }}
              />
            )}
            {isCC && anchor && (
              <ControlCenter
                key="cc"
                panelRef={menuRef}
                style={{ position: 'fixed', top: anchor.top, left: Math.max(8, anchor.left - 8), transformOrigin: 'top left' }}
                onClose={close}
                onSpotlight={() => setSpotlight(true)}
                onHost={() => window.dispatchEvent(new CustomEvent('qz:open-host'))}
              />
            )}
          </AnimatePresence>
        </div>,
        document.body,
      )}

      <Spotlight open={spotlight} onClose={() => setSpotlight(false)} />
    </>
  )
}
