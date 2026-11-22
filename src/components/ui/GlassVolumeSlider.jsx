import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { playGlassDetent } from '../../utils/glassSound.js'

/*
 * شريط صوت بأسلوب iOS 26 (Liquid Glass):
 * - مجرى رفيع والتعبئة بيضا منورة
 * - المقبض كبسولة بيضا، ولما تمسكه بيكبر ويتحول لفقاعة زجاج شفافة بتكسر المجرى اللي تحتها
 *   (نفس فكرة الصور المرجعية)
 * - لو سحبت بعد الآخر بيتمط بمرونة (Rubber-band) ويرجع بسبرنج
 * - «درجات» صوتية خفيفة كل 10٪ وانت بتسحب (زي الـ haptic)
 * - RTL: الصفر على اليمين، والمليان ناحية الشمال
 * - كيبورد: الأسهم / Home / End / PageUp / PageDown
 */

const STEP = 0.05

function rubberBand(overflowPx) {
  const sign = Math.sign(overflowPx)
  return sign * Math.min(14, Math.sqrt(Math.abs(overflowPx)) * 1.5)
}

export default function GlassVolumeSlider({ value, onChange, label = 'مستوى الصوت', className = '' }) {
  const trackRef = useRef(null)
  const dragRef = useRef(null)
  const lastDetentRef = useRef(Math.round(value * 10))
  const [dragging, setDragging] = useState(false)

  const fill = useSpring(value, { stiffness: 700, damping: 48, mass: 0.6 })
  useEffect(() => {
    fill.set(value)
  }, [value, fill])
  const pct = useTransform(fill, (v) => `${Math.max(0, Math.min(1, v)) * 100}%`)

  const stretch = useMotionValue(0)
  const stretchSpring = useSpring(stretch, { stiffness: 520, damping: 26 })
  const scaleX = useTransform(stretchSpring, (s) => 1 + Math.abs(s) / 140)
  const originX = useTransform(stretchSpring, (s) => (s > 0 ? 1 : 0))

  const emit = (v) => {
    const next = Number(v.toFixed(3))
    const detent = Math.round(next * 10)
    if (detent !== lastDetentRef.current) {
      lastDetentRef.current = detent
      playGlassDetent(detent / 10)
    }
    onChange(next)
  }

  const valueFromPointer = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect()
    const raw = (rect.right - clientX) / rect.width
    const overflow = raw > 1 ? (raw - 1) * rect.width : raw < 0 ? raw * rect.width : 0
    return { v: Math.max(0, Math.min(1, raw)), overflow }
  }

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = { id: event.pointerId }
    setDragging(true)
    emit(valueFromPointer(event.clientX).v)
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current || dragRef.current.id !== event.pointerId) return
    const { v, overflow } = valueFromPointer(event.clientX)
    stretch.set(rubberBand(overflow))
    emit(v)
  }

  const endDrag = (event) => {
    if (!dragRef.current || dragRef.current.id !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
    stretch.set(0)
  }

  const handleKeyDown = (event) => {
    const keys = {
      ArrowLeft: value + STEP, // RTL: الشمال = أعلى
      ArrowUp: value + STEP,
      ArrowRight: value - STEP,
      ArrowDown: value - STEP,
      PageUp: value + STEP * 4,
      PageDown: value - STEP * 4,
      Home: 0,
      End: 1,
    }
    if (!(event.key in keys)) return
    event.preventDefault()
    emit(Math.max(0, Math.min(1, keys[event.key])))
  }

  const Icon = value === 0 ? VolumeX : value < 0.5 ? Volume1 : Volume2

  return (
    <div className={`flex items-center gap-2 ${className}`} data-qz-silent="">
      <Icon className="size-4 shrink-0 text-[color:var(--qz-mint)]/80" strokeWidth={2.3} aria-hidden="true" />

      <motion.div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-valuetext={`${Math.round(value * 100)}٪`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        style={{ scaleX, originX, touchAction: 'none' }}
        className="group relative h-9 w-32 cursor-pointer select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--qz-mint)]/60 sm:w-36"
      >
        {/* المجرى */}
        <motion.div
          className="qz-vol-track absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden rounded-full"
          animate={{ height: dragging ? 9 : 6 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <motion.div aria-hidden="true" className="qz-vol-fill absolute inset-y-0 right-0 rounded-full" style={{ width: pct }} />
        </motion.div>

        {/* المقبض */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2"
          style={{ right: pct, x: '50%', y: '-50%' }}
        >
          <motion.div
            className="relative"
            animate={dragging ? { width: 40, height: 28 } : { width: 26, height: 17 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 520, damping: 24, mass: 0.7 }}
          >
            {/* الحالة العادية: كبسولة بيضا */}
            <motion.span
              className="qz-vol-thumb-solid absolute inset-0 rounded-full"
              animate={{ opacity: dragging ? 0 : 1 }}
              transition={{ duration: 0.14 }}
            />
            {/* أثناء السحب: فقاعة زجاج */}
            <motion.span
              className="qz-glass-knob absolute inset-0 rounded-full"
              animate={{ opacity: dragging ? 1 : 0 }}
              transition={{ duration: 0.14 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
