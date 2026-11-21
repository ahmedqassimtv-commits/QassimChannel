/* أيقونة التنقل: أيقونة lucide جوه غلاف بيتحرك لما الماوس يقف على العنصر.
   نوع الحركة جاي من navConfig (motion) والـ keyframes في styles/nav.css */

export default function NavIcon({ icon: Icon, motion = 'beat', className = '' }) {
  if (!Icon) return null
  return (
    <span className={`qz-nicon ${className}`} data-motion={motion} aria-hidden="true">
      <Icon strokeWidth={1.8} />
    </span>
  )
}
