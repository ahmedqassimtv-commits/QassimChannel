import { useRef, useState } from 'react'
import { THEMES, setTheme, useTheme } from '../../utils/theme.js'
import { playGlassToggle } from '../../utils/glassSound.js'

/* ══ زرار الثيم ═══════════════════════════════════════════════════════
   زرار واحد مدوّر بدل السويتش الكبير: كل ضغطة تنقل للثيم اللي بعده
   (الزمردي ← الجمري ← الذهبي). الكرة جواه بتلف نص لفّة، والثيم الجديد
   بيفرش على الصفحة كدايرة طالعة من الزرار (View Transitions API).
   المتصفحات اللي مابتدعمهاش بتبدّل على طول. */

const NAMES = { green: 'الزمردي', red: 'الجمري', gold: 'الذهبي' }

export default function ThemeOrb({ className = '' }) {
  const theme = useTheme()
  const ref = useRef(null)
  const [ping, setPing] = useState(0)
  const idx = Math.max(0, THEMES.indexOf(theme))
  const next = THEMES[(idx + 1) % THEMES.length]

  const cycle = () => {
    playGlassToggle(true)
    setPing((p) => p + 1)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce || !ref.current) {
      setTheme(next)
      return
    }
    const r = ref.current.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const root = document.documentElement
    root.classList.add('qz-vt-theme')
    const vt = document.startViewTransition(() => setTheme(next))
    vt.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
          {
            duration: 850,
            easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
      .catch(() => {})
    vt.finished.finally(() => root.classList.remove('qz-vt-theme'))
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`qz-orb ${className}`}
      data-ping={ping === 0 ? undefined : ping % 2 ? 'a' : 'b'}
      onClick={cycle}
      aria-label={`غيّر الثيم — الحالي ${NAMES[theme]}، التالي ${NAMES[next]}`}
      data-qz-silent
    >
      <span className="qz-orb-ball" style={{ '--i': ping }} aria-hidden="true" />
      <span className="qz-orb-tip" aria-hidden="true">
        <span className="qz-latin">{String(idx + 1).padStart(2, '0')}</span> · {NAMES[theme]}
      </span>
    </button>
  )
}
