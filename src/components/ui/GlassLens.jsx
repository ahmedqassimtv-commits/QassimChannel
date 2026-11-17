import { motion, useReducedMotion } from 'framer-motion'
import { springs } from '../../lib/springs'

export default function GlassLens({ layoutId = 'glass-lens' }) {
  const reduce = useReducedMotion()
  return <motion.span layoutId={layoutId} aria-hidden="true" className="qz-nav-lens" transition={reduce ? { duration: 0 } : { type: 'spring', ...springs.lead }} />
}
