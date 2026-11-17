/*
 * فلتر الانكسار المشترك (Liquid Glass) — بيتركب مرة واحدة في App.
 */

const LENS_MAP = '/images/qz-lens-map.png'

export default function LiquidGlassFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <defs>
        {/* تدرجات الأيقونات الزجاجية (userSpaceOnUse عشان الخطوط المستقيمة ماتختفيش) */}
        <linearGradient id="qz-icon-stroke" gradientUnits="userSpaceOnUse" x1="3" y1="3" x2="21" y2="21">
          <stop offset="0" style={{ stopColor: '#ffffff' }} />
          <stop offset="0.38" style={{ stopColor: 'var(--qz-mint)' }} />
          <stop offset="0.72" style={{ stopColor: 'var(--qz-sage)' }} />
          <stop offset="1" style={{ stopColor: 'rgb(var(--qz-glow-rgb))' }} />
        </linearGradient>
        <linearGradient id="qz-icon-fill" gradientUnits="userSpaceOnUse" x1="3" y1="3" x2="21" y2="21">
          <stop offset="0" style={{ stopColor: '#ffffff', stopOpacity: 0.32 }} />
          <stop offset="0.5" style={{ stopColor: 'var(--qz-sage)', stopOpacity: 0.12 }} />
          <stop offset="1" style={{ stopColor: 'rgb(var(--qz-glow-rgb))', stopOpacity: 0.3 }} />
        </linearGradient>
        <filter
          id="qz-refract"
          x="0"
          y="0"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={LENS_MAP}
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="20" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.35" />
        </filter>
        <filter
          id="qz-refract-soft"
          x="0"
          y="0"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={LENS_MAP}
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="9" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.25" />
        </filter>
      </defs>
    </svg>
  )
}