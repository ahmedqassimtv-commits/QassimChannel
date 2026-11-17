/*
 * أيقونة زجاجية (زي صورة السندان المرجعية):
 * - بلاطة غامقة بزوايا ناعمة وحافة منورة رفيعة
 * - الأيقونة نفسها متلونة بتدرج زجاجي (أبيض ⇠ لون الثيم) + جسم شفاف + توهج خفيف
 * التدرجات معرّفة مرة واحدة في LiquidGlassFilters (#qz-icon-stroke / #qz-icon-fill)
 * وبتاخد ألوانها من متغيرات الثيم، فبتتغير لوحدها مع الوضع الجمري.
 */
export default function GlassIcon({ icon: Icon, size = 'md', active = false, tile = true, className = '' }) {
  const box = { sm: 'size-6 rounded-[9px]', md: 'size-7 rounded-[10px]', lg: 'size-9 rounded-xl', xl: 'size-12 rounded-2xl' }[size]
  const icon = { sm: 'size-3.5', md: 'size-[15px]', lg: 'size-[18px]', xl: 'size-6' }[size]

  const glyph = (
    <Icon
      className={`qz-glass-icon ${icon}`}
      color="url(#qz-icon-stroke)"
      fill="url(#qz-icon-fill)"
      strokeWidth={2.1}
      aria-hidden="true"
    />
  )

  if (!tile) return <span className={`inline-grid place-items-center ${className}`}>{glyph}</span>

  return (
    <span
      className={`qz-icon-tile relative grid shrink-0 place-items-center ${box} ${active ? 'is-active' : ''} ${className}`}
    >
      {glyph}
    </span>
  )
}
