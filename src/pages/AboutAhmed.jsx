import { useEffect, useMemo, useRef, useState } from 'react'
import { assetUrl } from '../utils/assets.js'
import { getTheme, useTheme } from '../utils/theme.js'

/* ══ عن أحمد ═══════════════════════════════════════════════════════════
   يعرض تجربة «عن أحمد» التفاعلية الكاملة (WebGL + Rive + GSAP) في إطار
   معزول بكامل الشاشة، مع مزامنة حية لثيمات قاسمز الثلاثة (green / red / gold)
   بدون إعادة تحميل الصفحة عند التبديل. */
export default function AboutAhmed() {
  const theme = useTheme()
  const frameRef = useRef(null)
  const initialThemeRef = useRef(getTheme())
  const [loaded, setLoaded] = useState(false)

  const frameSrc = useMemo(() => {
    const base = assetUrl('/about-ahmed/index.html')
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}theme=${encodeURIComponent(initialThemeRef.current)}`
  }, [])

  // مزامنة الثيم الحي مع الـ iframe بدون إعادة تحميل
  useEffect(() => {
    const win = frameRef.current?.contentWindow
    if (!win) return
    try {
      win.postMessage({ type: 'qz-theme', theme }, window.location.origin)
    } catch {
      /* تجاهل أخطاء المراسلة قبل اكتمال التحميل */
    }
  }, [theme])

  // إيقاف تمرير صفحة الأب أثناء التفاعل مع التجربة ذات التمرير المستقل
  useEffect(() => {
    const lenis = window.__qzLenis
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    lenis?.stop?.()
    return () => {
      document.documentElement.style.overflow = prevOverflow
      lenis?.start?.()
    }
  }, [])

  const handleLoad = () => {
    setLoaded(true)
    const win = frameRef.current?.contentWindow
    if (!win) return
    try {
      win.postMessage({ type: 'qz-theme', theme: getTheme() }, window.location.origin)
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="qz-ahmed-stage" aria-label="عن أحمد">
      <iframe
        ref={frameRef}
        src={frameSrc}
        title="عن أحمد — قاسمز"
        data-no-tint="true"
        data-loaded={loaded ? 'true' : undefined}
        onLoad={handleLoad}
        className="qz-ahmed-frame"
        allow="autoplay; fullscreen"
      />
    </section>
  )
}
