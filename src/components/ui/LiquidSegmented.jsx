import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useSpring } from 'framer-motion'
import { springs } from '../../lib/springs'
import GlassLayer from '../glass/GlassLayer.jsx'
import GlassIcon from './GlassIcon.jsx'
import useLiquidElement from '../../hooks/useLiquidElement.js'
import { useTheme } from '../../utils/theme.js'

/*
 * أزرار تبديل بفقاعة Liquid Glass بتتزحلق بين الاختيارات
 * (الأفلام/المسلسلات، فلاتر الفيديوهات، الحقب في الحكايات...)
 *
 * طبقات الزجاج (تحسين تدريجي):
 * 1) دايماً: فقاعة زجاج CSS (.qz-glass-knob) + انكسار SVG في Chrome
 * 2) لو الجهاز يقدر: عدسة liquidGL حقيقية (WebGL) فوق الفقاعة وبتتحرك معاها فريم بفريم
 *
 * options: [{ value, label, icon? }]
 */

const LIQUID_Z = 2

export default function LiquidSegmented({
  id,
  options,
  value,
  onChange,
  ariaLabel,
  liquid = true,
  size = 'md',
  className = '',
}) {
  const containerRef = useRef(null)
  const itemRefs = useRef({})
  const [rect, setRect] = useState(null)
  const [moving, setMoving] = useState(false)
  // ✅ بوكس Liquid بيمشي مع الماوس فوق الخانات (زي الناڤبار)
  const [hover, setHover] = useState(null)
  const reduced = useReducedMotion()
  const lean = useSpring(0, springs.soft)

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') return
    const container = containerRef.current
    const item = event.target.closest?.('[data-qz-seg-item]')
    if (!container || !item) return
    const c = container.getBoundingClientRect()
    const r = item.getBoundingClientRect()
    const key = item.getAttribute('data-qz-seg-item')
    setHover((prev) => {
      const next = { key, x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }
      if (prev && prev.key === next.key && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.w - next.w) < 0.5) return prev
      return next
    })
    const rel = (event.clientX - (r.left + r.width / 2)) / (r.width / 2)
    lean.set(Math.max(-1, Math.min(1, rel)) * 6)
  }
  const theme = useTheme()

  const lens = useLiquidElement({
    enabled: liquid && Boolean(rect),
    target: `[data-qz-seg-lens="${id}"]`,
    snapshot: `[data-qz-seg="${id}"]`,
    zIndex: LIQUID_Z,
    refreshKey: theme,
  })

  // قياس مكان الاختيار الحالي جوه الحاوية (بيشتغل حتى لو الأزرار نازلة على أكتر من سطر)
  const measure = useCallback(() => {
    const container = containerRef.current
    const el = itemRefs.current[value]
    if (!container || !el) return
    const c = container.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    setRect((prev) => {
      const next = { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }
      if (prev && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5 && Math.abs(prev.w - next.w) < 0.5 && Math.abs(prev.h - next.h) < 0.5) return prev
      return next
    })
  }, [value])

  useLayoutEffect(() => {
    measure()
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    // الخطوط بتحمّل متأخر وبتغير عرض الأزرار
    document.fonts?.ready?.then(measure).catch(() => {})
    return () => ro.disconnect()
  }, [measure])

  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      data-qz-seg={id}
      data-liquid-active={lens.active || undefined}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        setHover(null)
        lean.set(0)
      }}
      className={`qz-seg qz-seg-glass qz-glass-rim sticky z-[2] inline-flex flex-wrap items-center gap-1 rounded-[22px] p-1 ${className}`}
    >
      {/* لوح زجاج الحاوية: قلب صافي وحواف بتكسر اللي وراها */}
      <GlassLayer radius={22} bevel={12} scale={30} magnify={0.015} after="blur(1px) saturate(170%) brightness(1.04)" />

      {/* بوكس الهوفر السائل: بيتزحلق ورا الماوس وبيتمط وهو بيتنقل */}
      <motion.span
        aria-hidden="true"
        data-liquid-ignore=""
        className="pointer-events-none absolute left-0 top-0 z-0"
        initial={false}
        animate={
          hover
            ? { x: hover.x, y: hover.y, width: hover.w, height: hover.h, opacity: hover.key === String(value) ? 0.35 : 1, scale: 1 }
            : { opacity: 0, scale: 0.92 }
        }
        transition={reduced ? { duration: 0 } : {
          type: 'spring',
          ...springs.fade,
          mass: 0.7,
          opacity: { duration: 0.22 },
        }}
      >
        <motion.span className="qz-liquid-lens absolute inset-0 rounded-full" style={{ x: lean }} />
      </motion.span>

      {/* الفقاعة */}
      {rect && (
        <motion.span
          aria-hidden="true"
          data-liquid-ignore=""
          className="qz-glass-knob qz-seg-bubble pointer-events-none absolute left-0 top-0 rounded-full"
          initial={false}
          animate={{
            x: rect.x,
            y: rect.y,
            width: rect.w,
            height: rect.h,
            scaleY: moving ? 1.14 : 1,
          }}
          transition={reduced ? { duration: 0 } : {
            type: 'spring',
            ...springs.settle,
            mass: 0.9,
            scaleY: { type: 'spring', ...springs.pop },
          }}
          onUpdate={lens.sync}
          onAnimationComplete={() => {
            setMoving(false)
            lens.sync()
          }}
        >
          <span data-qz-seg-lens={id} className="absolute inset-0 rounded-full" />
        </motion.span>
      )}

      {options.map((option) => {
        const selected = option.value === value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            ref={(el) => {
              itemRefs.current[option.value] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            data-qz-silent=""
            data-liquid-ignore=""
            data-qz-seg-item={String(option.value)}
            onClick={() => {
              if (selected) return
              setMoving(true)
              onChange(option.value)
            }}
            className={`relative z-[1] inline-flex items-center gap-1.5 whitespace-nowrap rounded-full transition-colors duration-300 ${pad} ${
              selected
                ? 'font-bold text-[color:var(--qz-mint)] [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]'
                : 'text-[color:var(--qz-mint)]/70 hover:text-[color:var(--qz-mint)]'
            }`}
          >
            {Icon && <GlassIcon icon={Icon} tile={false} size="sm" />}
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
