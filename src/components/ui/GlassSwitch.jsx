import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { playGlassToggle } from '../../utils/glassSound.js'

/*
 * سويتش زجاجي (Liquid Glass) زي الصور المرجعية:
 * - كبسولة غامقة فيها النص، وفقاعة زجاج أكبر منها بتتحرك من طرف للتاني
 * - الفقاعة بتكسر اللي تحتها (فلتر qz-refract في Chrome) وجواها أيقونة منورة
 * - وهي بتتحرك بتتمط وترجع (squash & stretch) زي السائل
 *
 * checked = الفقاعة ناحية اليمين (زي صورة Dark)، والنص على الشمال — والعكس
 */

const SIZES = {
  // nav: مقاس مظبوط على ارتفاع عناصر الناڤبار (من غير ما الفقاعة تطلع بره الحواف وتتقص)
  // overhang بالسالب = الفقاعة جوه المجرى (نفس ارتفاع كبسولة البحث بالظبط)
  nav: { trackW: 60, trackH: 30, knobW: 34, knobH: 24, overhang: -3, icon: 'size-3.5', text: 'text-[10px]' },
  sm: { trackW: 50, trackH: 22, knobW: 30, knobH: 30, overhang: 3, icon: 'size-3.5', text: 'text-[10px]' },
  md: { trackW: 132, trackH: 38, knobW: 50, knobH: 56, overhang: 5, icon: 'size-[18px]', text: 'text-xs' },
  lg: { trackW: 168, trackH: 50, knobW: 66, knobH: 76, overhang: 7, icon: 'size-6', text: 'text-sm' },
}

export default function GlassSwitch({
  checked,
  onChange,
  labelOn,
  labelOff,
  iconOn: IconOn,
  iconOff: IconOff,
  ariaLabel,
  size = 'md',
  silent = false,
  className = '',
}) {
  const s = SIZES[size] ?? SIZES.md
  const mountedRef = useRef(false)
  useEffect(() => {
    mountedRef.current = true
  }, [])

  const xOff = -s.overhang
  const xOn = s.trackW - s.knobW + s.overhang
  const label = checked ? labelOn : labelOff
  const Icon = checked ? IconOn : IconOff

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      data-qz-silent=""
      dir="ltr"
      onClick={() => {
        if (!silent) playGlassToggle(!checked)
        onChange(!checked)
      }}
      className={`qz-switch group relative inline-flex shrink-0 items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--qz-mint)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
      style={{ width: s.trackW, height: Math.max(s.trackH, s.knobH) }}
    >
      {/* المجرى */}
      <span
        aria-hidden="true"
        className="qz-switch-track absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full"
        style={{ height: s.trackH }}
      />

      {/* النص (على عكس جهة الفقاعة) */}
      {label && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 font-semibold ${s.text} text-[color:var(--qz-sage)]`}
          style={
            checked
              ? { left: 0, right: s.knobW - s.overhang, textAlign: 'center' }
              : { right: 0, left: s.knobW - s.overhang, textAlign: 'center' }
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={label}
              className="block whitespace-nowrap"
              initial={{ opacity: 0, y: 4, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(3px)' }}
              transition={{ duration: 0.18 }}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </span>
      )}

      {/* الفقاعة الزجاجية */}
      <motion.span
        aria-hidden="true"
        className="absolute left-0 top-1/2"
        style={{ width: s.knobW, height: s.knobH, marginTop: -s.knobH / 2 }}
        initial={false}
        animate={{ x: checked ? xOn : xOff }}
        transition={{ type: 'spring', stiffness: 430, damping: 30, mass: 0.9 }}
        whileTap={{ scale: 1.07 }}
      >
        <motion.span
          key={checked ? 'on' : 'off'}
          className="qz-glass-knob absolute inset-0 grid place-items-center rounded-[999px]"
          initial={mountedRef.current ? { scaleX: 1.22, scaleY: 0.88 } : false}
          animate={{ scaleX: 1, scaleY: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 14, mass: 0.7 }}
        >
          {Icon && (
            <motion.span
              initial={mountedRef.current ? { opacity: 0, scale: 0.6, rotate: -40 } : false}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="qz-switch-icon relative z-[1]"
            >
              <Icon className={s.icon} strokeWidth={2.4} />
            </motion.span>
          )}
        </motion.span>
      </motion.span>
    </button>
  )
}
