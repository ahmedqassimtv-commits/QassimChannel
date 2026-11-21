import { useEffect, useState } from 'react'

/* true بعد ما الصفحة تنزل شوية — النافبار بيتقلص.
   فيه hysteresis (نص المسافة) عشان مايرعشش عند الحد. */
export default function useCompact(threshold = 40) {
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
