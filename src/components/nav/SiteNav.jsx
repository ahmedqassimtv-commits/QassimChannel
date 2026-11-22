import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import LogoIntro from './LogoIntro.jsx'
import DaylightThemeSwitch from '../ui/DaylightThemeSwitch.jsx'
import NavGlyph from './NavGlyph.jsx'
import VerdictPlan from './VerdictPlan.jsx'
import SpringMenu from './SpringMenu.jsx'
import useLiquidCapsule from './useLiquidCapsule.js'
import useSiteSearch from './useSiteSearch.js'
import { MASAHA_ITEMS, NAV, sectionKey } from './navConfig.js'
import { prefetchRoute } from '../../utils/liquidGlassEngine.js'
import { setThemeWithWipe, useTheme } from '../../utils/theme.js'
import { assetUrl } from '../../utils/assets.js'
import { useCinema } from '../qz/CinemaPlayer.jsx'
import { SPRINGS, kick, register, spring, springGroup } from '../../motion/springs.js'

/* ══ النافبار — زجاج iOS أحادي اللون ═══════════════════════════════════
   جزيرة زجاج فروستد ولامعة (أسود ورمادي بس) فوق الصفحة:
   - كبسولة سائلة واحدة تحت العنصر (طرفين بـspringين: بتتمط ناحية الحركة)
   - كل أيقونة مرسومة ولها حركتها، والحركة بتكمل لآخرها من غير تقطيع
   - البحث جزء من الجزيرة: بيتمد مكان اللينكات والنتايج بتنزل تحتها
   - الفِردِكت: Plan switch · مساحة: Spring dropdown
   - مع السكرول بتصغر بـspring، وفي صفحة "عنّي" بتنزل تحت كـdock أيقونات
   - تحت 1024px: شريط فوق (لوجو/بحث/ثيم) والتنقل في التابات السفلية */

const AiHost = lazy(() => import('../ai/AiHost.jsx'))
const HOST_SEEN = 'qz-host-seen'

/* مع كل فتحة للموقع: لوجو قاسمز بيتكتب حرف حرف (LogoIntro)، وبعد ما
   يخلص قاسم الافتراضي بيطلع مكانه بحركة. فقاعة «أهلاً» مرة واحدة في الزيارة. */
function useHostArrival(delay = 2900) {
  const [arrived, setArrived] = useState(false)
  const [hello, setHello] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => {
      setArrived(true)
      let seen = false
      try {
        seen = sessionStorage.getItem(HOST_SEEN) === '1'
        sessionStorage.setItem(HOST_SEEN, '1')
      } catch {
        /* تصفح خاص */
      }
      if (!seen) setHello(true)
    }, delay)
    return () => window.clearTimeout(t)
  }, [delay])
  useEffect(() => {
    if (!hello) return undefined
    const t = window.setTimeout(() => setHello(false), 5200)
    return () => window.clearTimeout(t)
  }, [hello])
  return { arrived, hello, dismissHello: () => setHello(false) }
}

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

/** يشغّل حركة الأيقونة لآخرها (ومايقطعهاش لو الماوس خرج) */
function playGlyph(el) {
  if (!el || el.dataset.play) return
  el.dataset.play = 'true'
  window.setTimeout(() => delete el.dataset.play, 900)
}

/* الشكل بيتصغر مع السكرول، وبينقل مكانه بحركة spring (FLIP) */
function useShellMotion(shellRef, dimRef, dock) {
  const st = useRef(null)
  if (!st.current) st.current = { c: spring(0, SPRINGS.soft), y: spring(0, SPRINGS.settle) }
  const lastTop = useRef(null)

  useEffect(() => {
    const { c, y } = st.current
    const unreg = register(
      springGroup(
        { c, y },
        () => {
          const el = shellRef.current
          if (!el) return
          const k = Math.max(0, Math.min(1.2, c.x))
          el.style.transform = `translate3d(0, ${(y.x - 6 * k).toFixed(2)}px, 0) scale(${(1 - 0.06 * k).toFixed(4)})`
          if (dimRef.current) dimRef.current.style.opacity = Math.min(1, k).toFixed(3)
        },
        0.002,
      ),
    )
    let raf = 0
    const read = () => {
      raf = 0
      const yy = window.scrollY
      const on = c.t > 0.5 ? yy > 20 : yy > 60
      if ((on ? 1 : 0) !== c.t) {
        c.t = on ? 1 : 0
        kick()
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      unreg()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [shellRef, dimRef])

  // نقل الجزيرة (فوق ⇄ تحت) من غير قفزة
  useLayoutEffect(() => {
    const header = shellRef.current?.parentElement
    if (!header) return
    const top = header.getBoundingClientRect().top
    if (lastTop.current != null && Math.abs(lastTop.current - top) > 2) {
      const { y } = st.current
      y.x += lastTop.current - top
      y.t = 0
      kick()
    }
    lastTop.current = top
  }, [dock, shellRef])
}

/* ── البحث جوّه الجزيرة ── */
function SearchPanel({ search, onPick, reduce }) {
  const listRef = useRef(null)
  let lastGroup = null
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [search.cursor])
  return (
    <motion.div
      className="qz-nav-results"
      role="listbox"
      id="qz-search-list"
      data-lenis-prevent
      ref={listRef}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.97, filter: 'blur(12px)' }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98, filter: 'blur(8px)' }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
    >
      {search.results.length === 0 ? (
        <p className="qz-nav-results-empty">مفيش نتايج لـ «{search.query}». جرّب كلمة تانية.</p>
      ) : (
        search.results.map((item, i) => {
          const header = item.group !== lastGroup ? item.group : null
          lastGroup = item.group
          const Icon = item.icon
          return (
            <div key={`${item.group}-${item.title}-${i}`}>
              {header && <p className="qz-nav-results-group">{header}</p>}
              <button
                type="button"
                id={`qz-sr-${i}`}
                role="option"
                aria-selected={i === search.cursor}
                data-active={i === search.cursor ? 'true' : undefined}
                className="qz-nav-result"
                onMouseMove={() => search.setCursor(i)}
                onClick={() => onPick(item)}
              >
                {item.thumb ? (
                  <img src={item.thumb} alt="" className="qz-nav-result-thumb" loading="lazy" />
                ) : (
                  <span className="qz-nav-result-thumb">
                    {Icon && <Icon aria-hidden="true" strokeWidth={1.7} />}
                  </span>
                )}
                <span className="qz-nav-result-text">
                  <span className="qz-nav-result-title">{item.title}</span>
                  {item.sub && <span className="qz-nav-result-sub">{item.sub}</span>}
                </span>
                <NavGlyph name="arrow" className="qz-nav-result-go" />
              </button>
            </div>
          )
        })
      )}
      <div className="qz-nav-results-foot">
        <span>
          <kbd className="qz-kbd">↵</kbd> فتح
        </span>
        <span>
          <kbd className="qz-kbd">↑↓</kbd> تنقّل
        </span>
        <span>
          <kbd className="qz-kbd">Esc</kbd> إغلاق
        </span>
      </div>
    </motion.div>
  )
}

export default function SiteNav({ searchOpen, setSearchOpen }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const cinema = useCinema()
  const reduce = useReducedMotion()
  const active = sectionKey(pathname)
  const dock = pathname.startsWith('/masaha/about') ? 'bottom' : 'top'
  const theme = useTheme()
  const host = useHostArrival()
  const [hostOpen, setHostOpen] = useState(false)
  const [open, setOpen] = useState(null)
  const [anchor, setAnchor] = useState({ x: 0, y: 0, up: false })
  const shellRef = useRef(null)
  const dimRef = useRef(null)
  const trackRef = useRef(null)
  const capRef = useRef(null)
  const itemRefs = useRef({})
  const switchRef = useRef(null)
  const inputRef = useRef(null)
  const closeTimer = useRef(0)
  const openTimer = useRef(0)
  const hovered = useRef(null)
  const cap = useLiquidCapsule(trackRef, capRef)
  const search = useSiteSearch()

  useShellMotion(shellRef, dimRef, dock)

  // الكبسولة بترجع للقسم النشط
  const settle = useCallback(
    (instant = false) => {
      const key = open || hovered.current || active
      cap.moveTo(itemRefs.current[key], { instant })
    },
    [active, open, cap],
  )
  useLayoutEffect(() => settle(), [settle])
  useEffect(() => {
    const ro = new ResizeObserver(() => settle(true))
    if (trackRef.current) ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [settle])

  // أي تنقل بيقفل القوائم والبحث
  useEffect(() => {
    setOpen(null)
    hovered.current = null
    setSearchOpen(false)
  }, [pathname, setSearchOpen])

  // البحث: فوكس + تصفير
  useEffect(() => {
    if (!searchOpen) return undefined
    setOpen(null)
    search.setQuery('')
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen])

  // Escape يقفل
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(null)
      itemRefs.current[open]?.focus()
    }
    const y0 = window.scrollY
    const onScroll = () => Math.abs(window.scrollY - y0) > 60 && setOpen(null)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open])

  const placeMenu = (key) => {
    const el = itemRefs.current[key]
    const sh = shellRef.current
    if (!el || !sh) return
    const r = el.getBoundingClientRect()
    const s = sh.getBoundingClientRect()
    const up = dock === 'bottom'
    setAnchor({
      x: Math.min(Math.max(r.left + r.width / 2, 200), window.innerWidth - 200),
      y: up ? window.innerHeight - s.top + 10 : s.bottom + 10,
      up,
    })
  }
  const openMenu = (key, immediate = false) => {
    window.clearTimeout(closeTimer.current)
    window.clearTimeout(openTimer.current)
    const go = () => {
      placeMenu(key)
      setOpen(key)
    }
    if (immediate) go()
    else openTimer.current = window.setTimeout(go, 80)
  }
  const closeMenu = () => {
    window.clearTimeout(openTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(null), 180)
  }

  const pickResult = (item) => {
    if (!item) return
    setSearchOpen(false)
    if (item.video) cinema.open(item.video)
    else navigate(item.to)
  }
  const onSearchKey = (e) => {
    const n = search.results.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      search.setCursor((c) => Math.min(n - 1, c + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      search.setCursor((c) => Math.max(0, c - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pickResult(search.results[search.cursor])
    } else if (e.key === 'Escape') {
      setSearchOpen(false)
    }
  }

  const openItem = NAV.find((n) => n.key === open)

  return (
    <>
      <header
        className="qz-nav"
        data-dock={dock}
        data-search={searchOpen ? 'true' : undefined}
        dir="rtl"
      >
        <div ref={shellRef} className="qz-nav-shell">
          <span className="qz-nav-glass" aria-hidden="true">
            <span ref={dimRef} className="qz-nav-dim" />
          </span>
          <div className="qz-nav-row">
            <div className="qz-island-brand-slot">
              <AnimatePresence mode="popLayout" initial={false}>
                {!host.arrived ? (
                  <motion.div
                    key="logo"
                    exit={{ opacity: 0, scale: 0.6, y: -6, filter: 'blur(8px)' }}
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  >
                    <Link to="/" className="qz-nav-brand" aria-label="قاسمز — الرئيسية">
                      <LogoIntro className="qz-nav-logo" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.button
                    key="host"
                    type="button"
                    className="qz-host-bubble"
                    initial={{ opacity: 0, scale: 0.2, rotate: -30, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 17, delay: 0.12 }}
                    onClick={() => {
                      host.dismissHello()
                      setHostOpen((v) => !v)
                    }}
                    aria-expanded={hostOpen}
                    aria-label="كلّم قاسم الافتراضي"
                    data-open={hostOpen ? 'true' : undefined}
                  >
                    <img src={assetUrl('/avatar/anime/bubble.webp')} alt="" />
                    <img
                      className="qz-host-bubble-grin"
                      src={assetUrl('/avatar/anime/bubble-grin.webp')}
                      alt=""
                    />
                    <span className="qz-host-bubble-ring" aria-hidden="true" />
                  </motion.button>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {host.hello && !hostOpen && (
                  <motion.span
                    className="qz-host-hello"
                    initial={{ opacity: 0, y: -6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    aria-hidden="true"
                  >
                    أهلاً! دوس عليّا نتكلم
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="qz-nav-mid">
              <nav
                ref={trackRef}
                aria-label="التنقل الرئيسي"
                className="qz-nav-links"
                inert={searchOpen || undefined}
                onPointerLeave={() => {
                  hovered.current = null
                  settle()
                }}
              >
                <span ref={capRef} className="qz-nav-capsule" aria-hidden="true" />
                {NAV.map((item) => {
                  const isActive = active === item.key
                  const isOpen = open === item.key
                  const common = {
                    ref: (el) => {
                      itemRefs.current[item.key] = el
                    },
                    className: 'qz-nl',
                    'data-tip': item.label,
                    'data-active': isActive ? 'true' : undefined,
                    onPointerEnter: (e) => {
                      hovered.current = item.key
                      cap.moveTo(e.currentTarget)
                      playGlyph(e.currentTarget)
                      if (item.children) openMenu(item.key)
                      else {
                        closeMenu()
                        prefetchRoute(item.to)
                      }
                    },
                    onFocus: (e) => {
                      cap.moveTo(e.currentTarget)
                      playGlyph(e.currentTarget)
                    },
                    onPointerDown: () => cap.press(true),
                    onPointerUp: () => cap.press(false),
                    onPointerCancel: () => cap.press(false),
                  }
                  const inner = (
                    <>
                      <NavGlyph name={item.glyph} />
                      <span className="qz-nl-label">{item.label}</span>
                      {item.children && <NavGlyph name="chevron" className="qz-nl-chev" />}
                    </>
                  )
                  return item.children ? (
                    <button
                      key={item.key}
                      type="button"
                      {...common}
                      data-open={isOpen ? 'true' : undefined}
                      aria-expanded={isOpen}
                      aria-haspopup="menu"
                      onPointerLeave={closeMenu}
                      onClick={() => (isOpen ? setOpen(null) : openMenu(item.key, true))}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openMenu(item.key, true)
                          window.setTimeout(
                            () =>
                              document
                                .querySelector(
                                  '.qz-nav-menu [role="menuitem"], .qz-nav-menu [role="tab"]',
                                )
                                ?.focus(),
                            60,
                          )
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
                    >
                      {inner}
                    </Link>
                  )
                })}
              </nav>

              <div className="qz-nav-search" data-on={searchOpen ? 'true' : undefined}>
                <button
                  type="button"
                  className="qz-nav-search-pill"
                  onClick={() => setSearchOpen(true)}
                  onPointerEnter={(e) => playGlyph(e.currentTarget)}
                  aria-label={`بحث في الموقع (${IS_MAC ? '⌘K' : 'Ctrl K'})`}
                  tabIndex={searchOpen ? -1 : 0}
                >
                  <NavGlyph name="search" />
                  <span className="qz-nav-search-ph">ابحث</span>
                </button>
                <div className="qz-nav-search-field">
                  <NavGlyph name="search" />
                  <input
                    ref={inputRef}
                    value={search.query}
                    onChange={(e) => search.setQuery(e.target.value)}
                    onKeyDown={onSearchKey}
                    placeholder="دوّر على فيديو، فيلم، مقال، حكاية…"
                    aria-label="كلمة البحث"
                    role="combobox"
                    aria-expanded={searchOpen}
                    aria-controls="qz-search-list"
                    aria-activedescendant={
                      search.results[search.cursor] ? `qz-sr-${search.cursor}` : undefined
                    }
                    autoComplete="off"
                    spellCheck="false"
                    tabIndex={searchOpen ? 0 : -1}
                  />
                  <button
                    type="button"
                    className="qz-nav-search-close"
                    onClick={() => setSearchOpen(false)}
                    aria-label="إغلاق البحث"
                    tabIndex={searchOpen ? 0 : -1}
                  >
                    <NavGlyph name="close" />
                  </button>
                </div>
              </div>
            </div>

            <span ref={switchRef} className="qz-island-switch">
              <DaylightThemeSwitch
                theme={theme === 'gold' ? 'blue' : theme}
                onCycleTheme={(next) =>
                  setThemeWithWipe(next === 'blue' ? 'gold' : next, switchRef.current)
                }
                className="qz-theme-switch"
              />
            </span>
          </div>

          <AnimatePresence>
            {searchOpen && (
              <SearchPanel key="results" search={search} onPick={pickResult} reduce={reduce} />
            )}
          </AnimatePresence>
        </div>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            key="scrim"
            className="qz-nav-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSearchOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hostOpen && (
          <Suspense key="host" fallback={null}>
            <AiHost onClose={() => setHostOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openItem && (
          <motion.div
            key={openItem.key}
            role="menu"
            aria-label={openItem.label}
            className="qz-nav-menu"
            data-kind={openItem.key}
            style={{
              left: anchor.x,
              ...(anchor.up ? { bottom: anchor.y } : { top: anchor.y }),
              transformOrigin: anchor.up ? '50% 100%' : '50% 0%',
            }}
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.92, y: anchor.up ? 8 : -8, filter: 'blur(10px)' }
            }
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: anchor.up ? 4 : -4, filter: 'blur(6px)' }
            }
            transition={{
              type: 'spring',
              stiffness: SPRINGS.selectOpen[0],
              damping: SPRINGS.selectOpen[1] + 6,
            }}
            onPointerEnter={() => openMenu(openItem.key, true)}
            onPointerLeave={closeMenu}
          >
            {openItem.key === 'verdict' ? (
              <VerdictPlan onPick={() => setOpen(null)} />
            ) : (
              <SpringMenu items={MASAHA_ITEMS} label="مساحة" onPick={() => setOpen(null)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
