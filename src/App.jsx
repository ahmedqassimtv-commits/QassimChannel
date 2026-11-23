import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import MacWallpaper from './components/mac/MacWallpaper.jsx'
import MenuBar from './components/mac/MenuBar.jsx'
import Dock from './components/mac/Dock.jsx'
import Footer from './components/layout/Footer.jsx'
import LiquidGlassFilters from './components/glass/LiquidGlassFilters.jsx'
import { playGlassTap } from './utils/glassSound.js'

// تحميل الصفحات بشكل كسول لتقليل حزمة الصفحة الأولى
const Home = lazy(() => import('./pages/Home.jsx'))
const Videos = lazy(() => import('./pages/Videos.jsx'))
const Reviews = lazy(() => import('./pages/Reviews.jsx'))
const Stories = lazy(() => import('./pages/Stories.jsx'))
const Articles = lazy(() => import('./pages/Articles.jsx'))
const ArticleView = lazy(() => import('./pages/ArticleView.jsx'))
const OnAir = lazy(() => import('./pages/OnAir.jsx'))
const About = lazy(() => import('./pages/About.jsx'))

function ScrollToTop({ lenisRef }) {
  const { pathname, hash, state } = useLocation()

  // تعطيل استعادة التمرير التلقائية للمتصفح لمنع تضاربها مع الانتقال بين الأقسام
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // مزامنة موضع التمرير قبل الرسم لمنع اهتزاز النوف بار عند الانتقال من منتصف/أسفل الصفحة
  useLayoutEffect(() => {
    if (hash) {
      const targetEl = document.getElementById(hash.slice(1))
      if (targetEl) {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(targetEl, { immediate: true, force: true })
        } else {
          targetEl.scrollIntoView({ behavior: 'auto', block: 'start' })
        }
        return
      }
    }

    const targetY = state?.resumeScroll ?? 0
    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetY, { immediate: true, force: true })
    }
    window.scrollTo(0, targetY)
  }, [pathname, hash, state, lenisRef])

  return null
}

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[65vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <span className="size-8 animate-spin rounded-full border-2 border-[color:var(--qz-sage)]/30 border-t-[color:var(--qz-mint)]" aria-hidden="true" />
          <span className="text-sm text-[color:var(--qz-sage)]">جارٍ تحميل الصفحة…</span>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/videos/shorts" element={<Videos shorts />} />
        <Route path="/verdict/movies" element={<Reviews defaultTab="فيلم" />} />
        <Route path="/verdict/series" element={<Reviews defaultTab="مسلسل" />} />
        <Route path="/reviews" element={<Navigate to="/verdict/movies" replace />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:slug" element={<ArticleView />} />
        <Route path="/on-air" element={<OnAir />} />
        <Route path="/about" element={<About />} />
        <Route path="/masaha/on-air" element={<Navigate to="/on-air" replace />} />
        <Route path="/masaha/about" element={<Navigate to="/about" replace />} />
        <Route path="/masaha/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  const lenisRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    })
    lenisRef.current = lenis

    let rafId
    function raf(time) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // تعميم المؤثر الصوتي الزجاجي الناعم على أزرار التصفية والتفاعل داخل الصفحات
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const btn = e.target.closest('main button, main [role="button"]')
      if (btn && !btn.closest('[data-qz-silent]')) {
        playGlassTap()
      }
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop lenisRef={lenisRef} />
      <div className="relative min-h-screen overflow-x-clip bg-[color:var(--qz-ink)] text-[color:var(--qz-mint)]">
        <LiquidGlassFilters />
        <MacWallpaper />
        <MenuBar />
        <main className="relative z-10 mx-auto min-h-[75vh] w-full max-w-7xl px-5 pb-28 pt-24 sm:px-8 sm:pt-28">
          <AppRoutes />
        </main>
        <Footer />
        <Dock />
      </div>
    </BrowserRouter>
  )
}