import { motion, useReducedMotion } from 'framer-motion'
import { ORIGIN_EASE } from '../../lib/motionTokens.js'

/* ══ WordReveal — ظهور الكلمات بإيقاع Origin الجوّي الهادئ ══════════════ */
export default function WordReveal({ text = '', delay = 0, stagger = 0.06, className = '' }) {
  const reduce = useReducedMotion()
  const words = String(text).trim().split(/\s+/).filter(Boolean)

  if (reduce) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={`inline ${className}`}>
      {words.map((word, idx) => (
        <span key={`${word}-${idx}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: '38%' }}
            whileInView={{ opacity: 1, y: '0%' }}
            viewport={{ once: true, margin: '-8% 0px' }}
            transition={{
              duration: 1.25,
              delay: delay + idx * stagger,
              ease: ORIGIN_EASE,
            }}
          >
            {word}
          </motion.span>
          {idx < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  )
}
