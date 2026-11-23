import { motion, useReducedMotion } from 'framer-motion'
import { ORIGIN_EASE } from '../../lib/motionTokens.js'

/* ══ Reveal — ظهور العناصر بمنحنى Origin الجوّي (1.6s cubic-bezier) ═══ */
export default function Reveal({
  children,
  delay = 0,
  y = 22,
  duration = 1.5,
  className = '',
  as = 'div',
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as] || motion.div

  if (reduce) {
    const StaticTag = as
    return <StaticTag className={className}>{children}</StaticTag>
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration, delay, ease: ORIGIN_EASE }}
    >
      {children}
    </Tag>
  )
}
