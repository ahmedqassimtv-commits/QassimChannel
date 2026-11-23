import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Lenis from 'lenis'
import LiquidScene from './components/scene/LiquidScene.jsx'
import SiteNav from './components/nav/SiteNav.jsx'
import Footer from './components/layout/Footer.jsx'
import BackToTop from './components/ui/BackToTop.jsx'
import LiquidGlassFilters from './components/glass/LiquidGlassFilters.jsx'
import { CinemaProvider } from './components/qz/CinemaPlayer.jsx'
import { pageVariants, pageVariantsReduced } from './components/motion/Motion.jsx'
import { setLenis } from './lib/scroll.js'
import { playGlassTap } from './utils/glassSound.js'

// استيراد مباشر للصفحات لإلغاء شاشة «جارٍ التحميل» عند الدخول لأي قسم
import Home from './pages/Home.jsx'
import Videos from './pages/Videos.jsx'
import Reviews from './pages/Reviews.jsx'
import Stories from './pages/Stories.jsx'
import Articles from './pages/Articles.jsx'
import ArticleView from './pages/ArticleView.jsx'
import OnAir from './pages/OnAir.jsx'
import AboutAhmed from './pages/AboutAhmed.jsx'
import Books from './pages/Books.jsx'
import IdeasCastle from './pages/IdeasCastle.jsx'

/* ══ الانتقال بين الصفحات ═════════════════════════════════════════════
   انتقال فوري وسلس بدون أي شاشة تحميل عند الدخول لقسم جديد:
   الصفحة القديمة تنسحب بخفة، التمرير يُضبط قبل ظهور الجديدة، والمشهد
   الحي في الخلفية يغيّر مزاجه في نفس اللحظة. */
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
  const pageKey = location.pathname.startsWith('/videos')
    ? '/videos'
    : location.pathname.startsWith('/verdict')
      ? '/verdict'
      : location.pathname

  const prevKey = useRef(pageKey)
  useEffect(() => {
    if (prevKey.current === pageKey && location.hash) requestAnimationFrame(settleScroll)
    prevKey.current = pageKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={settleScroll}>
      <motion.div key={pageKey} variants={variants} initial="initial" animate="enter" exit="exit">
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
          <Route path="/ideas" element={<IdeasCastle />} />
          <Route path="/masaha/ideas" element={<IdeasCastle />} />
          <Route path="/masaha/on-air" element={<OnAir />} />
          <Route path="/masaha/books" element={<Books />} />
          <Route path="/masaha/ahmed" element={<AboutAhmed />} />
          <Route path="/masaha/about" element={<Navigate to="/masaha/ahmed" replace />} />
          <Route path="/on-air" element={<Navigate to="/masaha/on-air" replace />} />
          <Route path="/about" element={<Navigate to="/masaha/ahmed" replace />} />
          <Route path="/ahmed" element={<Navigate to="/masaha/ahmed" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function AppShell({ lenisRef }) {
  const { pathname } = useLocation()
  const isImmersive =
    pathname === '/masaha/ahmed' ||
    pathname.startsWith('/verdict') ||
    pathname.startsWith('/stories')

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[color:var(--qz-ink)] text-[color:var(--qz-text)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[color:var(--qz-mint)] focus:px-5 focus:py-3 focus:text-[color:var(--qz-ink)]"
      >
        انتقل للمحتوى
      </a>
      <LiquidGlassFilters />
      <LiquidScene />
      <SiteNav />
      <main
        id="main"
        className={
          isImmersive
            ? 'qz-main qz-main-immersive relative z-10 min-h-dvh w-full'
            : 'qz-main relative z-10 mx-auto min-h-[80vh] w-full max-w-[1320px] px-[var(--qz-page-x)] pb-20 pt-28 lg:pt-32'
        }
      >
        <AnimatedRoutes />
      </main>
      {!isImmersive && <Footer />}
      {!isImmersive && (
        <div className="hidden lg:block">
          <BackToTop lenisRef={lenisRef} />
        </div>
      )}
    </div>
  )
}

export default function App() {
  const lenisRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
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

  // المؤثر الصوتي الزجاجي على أزرار المحتوى
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const btn = e.target.closest('main button, main [role="button"]')
      if (btn && !btn.closest('[data-qz-silent]')) playGlassTap()
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CinemaProvider>
        <AppShell lenisRef={lenisRef} />
      </CinemaProvider>
    </BrowserRouter>
  )
}
