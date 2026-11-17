import { motion } from 'framer-motion'

/*
 * أيقونات بروح (بدل الأيقونات الثابتة):
 * - MenuMorphIcon: التلات خطوط بيتحولوا لعلامة X بحركة سائلة والعكس
 * - CloseSpinIcon: علامة X بتترسم بخطين ولما تقف عليها بتلف وتكبر بسبرنج
 */

const lineSpring = { type: 'spring', stiffness: 520, damping: 30, mass: 0.7 }

export function MenuMorphIcon({ open, size = 16, className = '' }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      initial={false}
      animate={open ? 'open' : 'closed'}
    >
      <motion.line
        x1="4"
        x2="20"
        y1="6"
        y2="6"
        style={{ originX: '50%', originY: '50%' }}
        variants={{
          closed: { rotate: 0, y: 0 },
          open: { rotate: 45, y: 6 },
        }}
        transition={lineSpring}
      />
      <motion.line
        x1="4"
        x2="20"
        y1="12"
        y2="12"
        variants={{
          closed: { opacity: 1, scaleX: 1 },
          open: { opacity: 0, scaleX: 0.2 },
        }}
        style={{ originX: '50%' }}
        transition={{ duration: 0.16 }}
      />
      <motion.line
        x1="4"
        x2="20"
        y1="18"
        y2="18"
        style={{ originX: '50%', originY: '50%' }}
        variants={{
          closed: { rotate: 0, y: 0 },
          open: { rotate: -45, y: -6 },
        }}
        transition={lineSpring}
      />
    </motion.svg>
  )
}

export function CloseSpinIcon({ size = 12, className = '' }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
    >
      <motion.path
        d="M6 6 L18 18"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      />
      <motion.path
        d="M18 6 L6 18"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.22, delay: 0.08, ease: 'easeOut' }}
      />
    </motion.svg>
  )
}
