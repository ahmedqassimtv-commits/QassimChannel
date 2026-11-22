import { useId } from 'react'
import { LOGO_PATH } from '../brand/BrandLogo.jsx'

/* ══ لوجو قاسمز حرف حرف ═════════════════════════════════════════════════
   الشعار مرسوم كقطعة واحدة متصلة، فبنقسمه بالعرض على حروفه (ق ا س م ز)
   بـclipPath لكل حرف، وكل حرف بيطلع من تحت بالترتيب من اليمين للشمال
   (blur → واضح)، وبعدين بيلمع لمعة واحدة. لما الحركة تخلص قاسم الافتراضي
   بيطلع مكانه (SiteNav). */

// حدود الحروف على محور x في viewBox الشعار (1483 عرض) — من اليمين للشمال
const LETTERS = [
  [1045, 1500], // ق
  [890, 1045], // ا
  [560, 890], // س
  [255, 560], // م
  [-20, 255], // ز
]

export default function LogoIntro({ className = '' }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg
      viewBox="-20 -20 1523 598"
      className={`qz-logo-intro ${className}`}
      role="img"
      aria-label="قاسمز"
    >
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--qz-mint-rgb))" />
          <stop offset="1" stopColor="rgb(var(--qz-glow-rgb))" />
        </linearGradient>
        {LETTERS.map(([a, b], i) => (
          <clipPath key={i} id={`${uid}c${i}`}>
            <rect x={a} y="-40" width={b - a} height="640" />
          </clipPath>
        ))}
      </defs>
      {LETTERS.map((_, i) => (
        <g key={i} className="qz-li-letter" style={{ '--i': i }} clipPath={`url(#${uid}c${i})`}>
          <path fillRule="evenodd" d={LOGO_PATH} fill={`url(#${uid}g)`} />
        </g>
      ))}
    </svg>
  )
}
