import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Lenis from 'lenis'
import NightScene from './components/scene/NightScene.jsx'
import SiteCursor from './components/cursor/SiteCursor.jsx'
import SiteNav from './components/nav/SiteNav.jsx'
import MobileTabBar from './components/nav/MobileTabBar.jsx'
import Footer from './components/layout/Footer.jsx'
import BackToTop from './components/ui/BackToTop.jsx'
import LiquidGlassFilters from './components/glass/LiquidGlassFilters.jsx'
import { CinemaProvider } from './components/qz/CinemaPlayer.jsx'
import { pageVariants, pageVariantsReduced } from './components/motion/Motion.jsx'
import { setLenis } from './lib/scroll.js'

// تحميل الصفحات بشكل كسول لتقليل حزمة الصفحة الأولى
const Home = lazy(() => import('./pages/Home.jsx'))
const Videos = lazy(() => import('./pages/Videos.jsx'))
const Reviews = lazy(() => import('./pages/Reviews.jsx'))
const Stories = lazy(() => import('./pages/Stories.jsx'))
const Articles = lazy(() => import('./pages/Articles.jsx'))
const ArticleView = lazy(() => import('./pages/ArticleView.jsx'))
const OnAir = lazy(() => import('./pages/OnAir.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Books = lazy(() => import('./pages/Books.jsx'))

function PageFallback() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center" role="status" aria-live="polite">
      <span className="sr-only">جارٍ تحميل الصفحة…</span>
      <span className="h-px w-24 overflow-hidden rounded-full bg-[rgb(var(--qz-mint-rgb)/0.12)]" aria-hidden="true">
        <span className="block h-full w-1/2 animate-[qz-load_1.1s_ease-in-out_infinite] rounded-full bg-[color:var(--qz-accent)]" />
      </span>
    </div>
  )
}

/* ══ الانتقال بين الصفحات ═════════════════════════════════════════════
   الصفحة القديمة بتنسحب لورا (blur + تصغير بسيط)، وبعد ما تخلص بنرجع
   لأول الصفحة، والجديدة بتتجسّد من تحت. التمرير لفوق بيحصل بين الاتنين
   (مش قبل الخروج) عشان القديمة ماتقفزش وهي بتختفي.
   الخلفية (NightScene) ثابتة تحت الاتنين. */
function AnimatedRoutes() {
  const location = useLocation()
  const reduce = useReducedMotion()
  const pendingHash = useRef(null)
  const pendingY = useRef(0)
  pendingHash.current = location.hash
  pendingY.current = location.state?.resumeScroll ?? 0

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  const settleScroll = useCallback(() => {
    const hash = pendingHash.current
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    const lenis = window.__qzLenis
    if (target) {
      if (lenis) lenis.scrollTo(target, { immediate: true, force: true, offset: -100 })
      else target.scrollIntoView()
      return
    }
    if (lenis) lenis.scrollTo(pendingY.current, { immediate: true, force: true })
    window.scrollTo(0, pendingY.current)
  }, [])

  const variants = reduce ? pageVariantsReduced : pageVariants
  // كل مقال صفحة لوحده، لكن /videos و /videos/shorts صفحة واحدة بفلتر، وكذلك أفلام/مسلسلات الفِردِكت
  const pageKey = location.pathname.startsWith('/videos')
    ? '/videos'
    : location.pathname.startsWith('/verdict')
      ? '/verdict'
      : location.pathname

  // نفس الصفحة (رابط # أو أول تحميل): مفيش خروج فبنظبط التمرير هنا
  const prevKey = useRef(pageKey)
  useEffect(() => {
    if (prevKey.current === pageKey && location.hash) requestAnimationFrame(settleScroll)
    prevKey.current = pageKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={settleScroll}>
      <motion.div key={pageKey} variants={variants} initial="initial" animate="enter" exit="exit">
        <Suspense fallback={<PageFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/videos/shorts" element={<Videos shorts />} />
            <Route path="/verdict/movies" element={<Reviews defaultTab="فيلم" />} />
            <Route path="/verdict/series" element={<Reviews defaultTab="مسلسل" />} />
            <Route path="/reviews" element={<Navigate to="/verdict/movies" replace />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleView />} />
            <Route path="/masaha/on-air" element={<OnAir />} />
            <Route path="/masaha/books" element={<Books />} />
            <Route path="/masaha/about" element={<About />} />
            <Route path="/on-air" element={<Navigate to="/masaha/on-air" replace />} />
            <Route path="/about" element={<Navigate to="/masaha/about" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const lenisRef = useRef(null)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    lenisRef.current = lenis
    window.__qzLenis = lenis
    setLenis(lenis)
    let rafId
    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
      window.__qzLenis = null
      setLenis(null)
    }
  }, [])

  // ⌘K / Ctrl+K أو «/» بيفتحوا البحث (إلا لو المستخدم بيكتب في حقل)
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((v) => !v)
      } else if (e.key === '/' && !typing) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])


  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CinemaProvider>
        <div className="relative min-h-screen overflow-x-clip bg-[color:var(--qz-ink)] text-[color:var(--qz-text)]">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[color:var(--qz-mint)] focus:px-5 focus:py-3 focus:text-[color:var(--qz-ink)]"
          >
            انتقل للمحتوى
          </a>
          <LiquidGlassFilters />
          <NightScene />
          <SiteCursor />
          <SiteNav searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
          <main id="main" className="qz-main relative z-10 mx-auto min-h-[80vh] w-full max-w-[1320px] px-[var(--qz-page-x)] pb-24 pt-28 lg:pt-32">
            <AnimatedRoutes />
          </main>
          <Footer />
          <MobileTabBar />
          <div className="hidden lg:block">
            <BackToTop lenisRef={lenisRef} />
          </div>
        </div>
      </CinemaProvider>
    </BrowserRouter>
  )
}
