import { useEffect, useRef } from 'react'
import { SPRINGS, STAGGER_MS, kick, register, spring, springGroup } from '../../motion/springs.js'

/* ══ Rolling number ═══════════════════════════════════════════════════════
   Each digit is a 0–9 column that rolls to its value on a spring
   (designbookmark "Rolling counter": count-roll 320/24, 45 ms stagger).
   Non-digits (the decimal point) stay still. Latin digits, LTR, tabular. */

function Digit({ value, delay }) {
  const colRef = useRef(null)
  const s = useRef(null)
  if (!s.current) s.current = spring(value, SPRINGS.countRoll)

  useEffect(() => {
    const sp = s.current
    return register(
      springGroup(
        { sp },
        () => {
          if (colRef.current)
            colRef.current.style.transform = `translate3d(0, ${(-sp.x * 10).toFixed(3)}%, 0)`
        },
        0.002,
      ),
    )
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      s.current.t = value
      kick()
    }, delay)
    return () => window.clearTimeout(t)
  }, [value, delay])

  return (
    <span className="qz-roll-digit" aria-hidden="true">
      <span ref={colRef} className="qz-roll-col">
        {'0123456789'.split('').map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    </span>
  )
}

export default function RollingNumber({ value, className = '' }) {
  const text = String(value)
  let di = 0
  return (
    <span className={`qz-rolling ${className}`} dir="ltr">
      <span className="sr-only">{text}</span>
      {text.split('').map((ch, i) =>
        /\d/.test(ch) ? (
          <Digit key={`d${i}`} value={Number(ch)} delay={di++ * STAGGER_MS} />
        ) : (
          <span key={`c${i}`} className="qz-roll-sep" aria-hidden="true">
            {ch}
          </span>
        ),
      )}
    </span>
  )
}
