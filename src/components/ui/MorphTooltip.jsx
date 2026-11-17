import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { springs } from '../../lib/springs'

export default function MorphTooltip({ label, children }) {
  const id = useId(), trigger = useRef(null)
  const [position, setPosition] = useState(null)
  const reduced = useReducedMotion()
  const show = () => { const rect = trigger.current.getBoundingClientRect(); const below = rect.top < 60; setPosition({ left: Math.max(100, Math.min(window.innerWidth - 100, rect.left + rect.width / 2)), top: below ? rect.bottom + 12 : rect.top - 12, translate: below ? '0 0' : '0 -100%' }) }
  return <span ref={trigger} className="qz-tooltip-trigger" tabIndex={0} aria-describedby={position ? id : undefined} onPointerEnter={show} onPointerLeave={() => setPosition(null)} onFocus={show} onBlur={() => setPosition(null)}>{children}{createPortal(<AnimatePresence>{position && <motion.span id={id} role="tooltip" dir="rtl" className="qz-tooltip" style={position} initial={reduced ? false : { opacity: 0, scale: .85, y: 4, x: '-50%' }} animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }} exit={{ opacity: 0 }} transition={reduced ? { duration: 0 } : { type: 'spring', ...springs.pop }}>{label}</motion.span>}</AnimatePresence>, document.body)}</span>
}
