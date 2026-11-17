import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

// زرار «لأعلى» زجاجي بيظهر بعد ما تنزل شوية، وبيستخدم Lenis للرجوع الناعم
export default function BackToTop({ lenisRef, threshold = 700 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let ticking = false
    const update = () => {
      ticking = false
      setVisible(window.scrollY > threshold)
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  const scrollUp = () => {
    const lenis = lenisRef?.current
    if (lenis) lenis.scrollTo(0, { duration: 1.2 })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollUp}
          initial={{ opacity: 0, y: 14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          aria-label="الرجوع لأعلى الصفحة"
          className="qassimz-dropdown-shell fixed bottom-5 left-5 z-40 grid size-11 place-items-center rounded-full border border-white/20 bg-[color:var(--qz-ink)]/70 text-[color:var(--qz-mint)] shadow-[0_12px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] transition-colors hover:bg-[color:var(--qz-deep)]/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--qz-sage)] sm:bottom-7 sm:left-7"
        >
          <ArrowUp className="size-4" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
