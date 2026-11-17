import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { springs } from '../../lib/springs'

export default function WeightWave({ text }) {
  const [active, setActive] = useState(-1)
  const reduced = useReducedMotion()
  return <span className="qz-weight-wave" dir="rtl" aria-label={text} onPointerLeave={() => setActive(-1)}>{text.split(' ').map((word, index) => <span key={`${word}-${index}`} aria-hidden="true"><motion.span onPointerEnter={() => setActive(index)} animate={{ fontWeight: reduced ? 700 : active === index ? 850 : Math.abs(active - index) === 1 && active !== -1 ? 650 : 450 }} transition={reduced ? { duration: 0 } : { type: 'spring', ...springs.soft }} style={{ display: 'inline-block', unicodeBidi: 'isolate' }}>{word}</motion.span>{' '}</span>)}</span>
}
