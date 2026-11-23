import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { assetUrl } from '../../utils/assets.js'
import { playGlassDropdown } from '../../utils/glassSound.js'
import { SPRING } from '../motion/Motion.jsx'

const AiHost = lazy(() => import('./AiHost.jsx'))

/* ══ فقاعة قاسم الافتراضي المدمجة في النافبار ═══════════════════════════
   زر دائري أنيق بجانب الشعار يتقلّص ويتكيّف تلقائياً مع حالة النافبار
   ولغة تصميم كل قسم، ويفتح لوح قاسم الافتراضي ثلاثي الأبعاد تحته مباشرة. */

const HELLO_KEY = 'qz-host-greeted-v2'
const PANEL_W = 380

export default function NavHost({
  navTheme = 'glass',
  navTone = 'dark',
  compact = false,
  searchExpanded = false,
  onOpenChange,
}) {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const btnRef = useRef(null)
  const panelRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [hello, setHello] = useState(false)
  const [anchor, setAnchor] = useState(null)

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  // إغلاق اللوح تلقائياً عند الانتقال لقسم آخر أو فتح البحث
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (searchExpanded && open) setOpen(false)
  }, [searchExpanded, open])

  // ترحيب لطيف مرة واحدة في الجلسة
  useEffect(() => {
    if (reduce) return undefined
    try {
      if (sessionStorage.getItem(HELLO_KEY)) return undefined
    } catch {
      /* ignore */
    }
    const show = window.setTimeout(() => setHello(true), 2400)
    const hide = window.setTimeout(() => {
      setHello(false)
      try {
        sessionStorage.setItem(HELLO_KEY, '1')
      } catch {
        /* ignore */
      }
    }, 6400)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [reduce])

  const measure = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const w = Math.min(PANEL_W, vw - 24)
    const btnCenter = r.left + r.width / 2
    const left = Math.min(Math.max(btnCenter - w / 2, 12), vw - w - 12)
    setAnchor({
      top: r.bottom + 14,
      left,
      originX: Math.max(24, Math.min(w - 24, btnCenter - left)),
      btnLeft: btnCenter,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open && !hello) return undefined
    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('scroll', onResize, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize)
    }
  }, [open, hello, compact, measure])

  // إغلاق عند النقر خارج اللوح والفقاعة
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      const t = e.target
      if (!btnRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const toggle = () => {
    setHello(false)
    try {
      sessionStorage.setItem(HELLO_KEY, '1')
    } catch {
      /* ignore */
    }
    measure()
    setOpen((prev) => {
      playGlassDropdown(!prev)
      return !prev
    })
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="qz-host-bubble"
        data-open={open ? 'true' : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? 'إغلاق قاسم الافتراضي' : 'تحدث مع قاسم الافتراضي (AI)'}
        title="قاسم الافتراضي (AI)"
        onClick={toggle}
      >
        <span className="qz-host-bubble-ring" aria-hidden="true" />
        <img
          src={assetUrl('/avatar/anime/bubble.webp')}
          alt=""
          data-no-tint="true"
          draggable="false"
        />
        <img
          src={assetUrl('/avatar/anime/bubble-grin.webp')}
          alt=""
          data-no-tint="true"
          draggable="false"
          className="qz-host-bubble-grin"
        />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <>
            <AnimatePresence>
              {hello && !open && !searchExpanded && anchor && (
                <motion.span
                  key="qz-host-hello"
                  className="qz-host-hello"
                  data-nav-theme={navTheme}
                  data-nav-tone={navTone}
                  style={{
                    top: anchor.top,
                    left: Math.min(Math.max(anchor.btnLeft - 92, 12), window.innerWidth - 208),
                  }}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.92 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.95 }}
                  transition={SPRING}
                  aria-hidden="true"
                  dir="rtl"
                >
                  أهلاً! دوس عليّا نتكلم
                </motion.span>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {open && (
                <Suspense key="qz-ai-host" fallback={null}>
                  <AiHost
                    panelRef={panelRef}
                    anchor={anchor}
                    navTheme={navTheme}
                    navTone={navTone}
                    onClose={() => setOpen(false)}
                  />
                </Suspense>
              )}
            </AnimatePresence>
          </>,
          document.body,
        )}
    </>
  )
}
