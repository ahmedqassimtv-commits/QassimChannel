import { motion, useReducedMotion } from 'framer-motion'

export default function MarkerText({ children }) {
  const reduced = useReducedMotion()
  return <motion.blockquote className="qz-marker" initial={reduced ? false : { backgroundSize: '0% 100%' }} whileInView={{ backgroundSize: '100% 100%' }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: reduced ? 0 : 0.8 }}>{children}</motion.blockquote>
}
