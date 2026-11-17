import { motion, useScroll, useSpring } from 'framer-motion'

// شريط تقدّم القراءة أعلى الصفحة (للمقالات)
export default function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 34, mass: 0.4 })

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-right bg-linear-to-l from-[color:var(--qz-sage)] via-[color:var(--qz-mint)] to-[color:var(--qz-sage)]"
      style={{ scaleX }}
    />
  )
}
