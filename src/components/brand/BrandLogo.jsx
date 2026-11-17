import { useId } from 'react'

// شعار «قاسمز» الرسمي — مندمج بصرياً مع ألوان كل ثيم عبر متغيرات CSS
const LOGO_PATH =
  'M946,459 L945,456 L940,455 L784,490 L780,494 L781,505 L783,509 L791,510 L928,501 L932,498Z M6,496 L118,551 L124,551 L239,414 L248,418 L429,411 L434,407 L441,292 L443,283 L515,297 L509,327 L504,330 L463,326 L460,329 L458,409 L461,413 L657,420 L708,369 L734,425 L744,422 L814,381 L834,411 L837,413 L1036,400 L1038,396 L1008,255 L1000,207 L997,202 L991,203 L921,244 L921,253 L934,325 L933,330 L877,334 L875,332 L865,243 L861,241 L788,264 L783,267 L782,272 L794,337 L789,340 L762,346 L736,270 L732,270 L638,335 L573,335 L572,334 L601,256 L600,251 L522,223 L423,184 L414,182 L358,240 L357,328 L238,346 L217,298 L212,298 L182,311 L179,316 L166,384 L7,492Z M209,148 L198,153 L126,198 L120,204 L172,266 L179,264 L254,215 L252,207Z M1435,139 L1386,103 L1379,105 L1347,142 L1340,136 L1339,133 L1315,119 L1302,109 L1297,109 L1256,161 L1254,166 L1258,171 L1310,193 L1317,192 L1337,165 L1357,172 L1391,188 L1399,188 L1420,166 L1433,148Z M1064,86 L1063,125 L1069,416 L1072,419 L1473,427 L1476,425 L1448,202 L1444,200 L1257,210 L1191,289 L1187,297 L1263,350 L1227,351 L1136,349 L1135,344 L1167,67 L1165,63Z M1301,283 L1305,281 L1377,270 L1379,275 L1375,346 L1373,347 L1309,292Z M1412,8 L1410,6 L1406,6 L1254,80 L1253,86 L1259,92 L1264,94 L1405,45 L1409,42Z'

export default function BrandLogo({ className = '', title = 'قاسمز', variant = 'solid', ...props }) {
  const uid = useId().replace(/:/g, '')

  if (variant !== 'glass') {
    return (
      <svg
        viewBox="0 0 1483 558"
        fill="currentColor"
        role="img"
        aria-label={title}
        className={className}
        {...props}
      >
        <title>{title}</title>
        <path fillRule="evenodd" d={LOGO_PATH} />
      </svg>
    )
  }

  const ids = {
    body: `qz-glass-body-${uid}`,
    rim: `qz-glass-rim-${uid}`,
    sheen: `qz-glass-sheen-${uid}`,
    clip: `qz-glass-clip-${uid}`,
  }

  return (
    <svg
      viewBox="-20 -20 1523 598"
      role="img"
      aria-label={title}
      className={`qz-glass-logo overflow-visible ${className}`}
      {...props}
    >
      <title>{title}</title>
      <defs>
        {/* جسم اللوجو: يستمد ألوانه مباشرة من متغيرات الثيم الحالي ليندمج بصرياً مع الخلفية */}
        <linearGradient id={ids.body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--qz-x7)', stopOpacity: 0.96 }} />
          <stop offset="52%" style={{ stopColor: 'var(--qz-mint)', stopOpacity: 0.82 }} />
          <stop offset="100%" style={{ stopColor: 'var(--qz-sage)', stopOpacity: 0.68 }} />
        </linearGradient>

        {/* الحافة المضيئة المتوافقة مع الثيم */}
        <linearGradient id={ids.rim} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--qz-x7)', stopOpacity: 0.95 }} />
          <stop offset="55%" style={{ stopColor: 'var(--qz-mint)', stopOpacity: 0.45 }} />
          <stop offset="100%" style={{ stopColor: 'var(--qz-sage)', stopOpacity: 0.7 }} />
        </linearGradient>

        {/* بريق مائل يمر على الحروف */}
        <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <clipPath id={ids.clip}>
          <path fillRule="evenodd" clipRule="evenodd" d={LOGO_PATH} />
        </clipPath>
      </defs>

      {/* جسم الشعار */}
      <path fillRule="evenodd" d={LOGO_PATH} fill={`url(#${ids.body})`} />

      {/* تجسيم داخلي ناعم */}
      <g clipPath={`url(#${ids.clip})`} aria-hidden="true">
        <path
          fillRule="evenodd"
          d={LOGO_PATH}
          transform="translate(0 12)"
          fill="none"
          style={{ stroke: 'var(--qz-x7)' }}
          strokeOpacity="0.65"
          strokeWidth="9"
        />
        <path
          fillRule="evenodd"
          d={LOGO_PATH}
          transform="translate(0 -10)"
          fill="none"
          style={{ stroke: 'var(--qz-ink)' }}
          strokeOpacity="0.28"
          strokeWidth="10"
        />
      </g>

      {/* الحافة الخارجية */}
      <path
        fillRule="evenodd"
        d={LOGO_PATH}
        fill="none"
        stroke={`url(#${ids.rim})`}
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* البريق المتحرك */}
      <g clipPath={`url(#${ids.clip})`} aria-hidden="true">
        <rect
          className="qz-glass-sheen"
          x="-420"
          y="-40"
          width="380"
          height="640"
          fill={`url(#${ids.sheen})`}
          transform="skewX(-18)"
        />
      </g>
    </svg>
  )
}