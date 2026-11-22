import { useEffect, useRef } from 'react'
import { LiquidGlassRenderer } from '../../vendor/webgl-liquid-glass/renderer'
import { createMotionTracker } from '../../vendor/webgl-liquid-glass/motion'
import { createSpring, updateSpring } from '../../vendor/webgl-liquid-glass/spring'

/* ══ طبقة الزجاج السائل (WebGL) فوق كبسولة النافبار ═════════════════════
   الـshader من webgl-liquid-glass (MIT — src/vendor/webgl-liquid-glass):
   لمعة specular بتتبع الماوس (وعلى الموبايل الجيروسكوب)، وانكسار ألوان
   (chromatic aberration) على حواف الحبّاية، ولمعة حركة (shimmer) لما
   الحبّاية تجري بين الأقسام، ووهج لما تضغط. الحبّاية نفسها (qz-nav-pill)
   بتاعتنا، والطبقة دي بتقرا مكانها كل فريم وبترسم عليها.
   لو WebGL مش موجود الطبقة بتستخبى والزجاج الـCSS بيكمّل لوحده. */

const STATIC_LIGHT = [0, 0]

function tintFromTheme() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--qz-glow-rgb').trim()
  const parts = v.split(/[\s,]+/).map(Number)
  return parts.length >= 3 && parts.every((n) => !Number.isNaN(n)) ? parts.slice(0, 3).map((n) => n / 255) : [0.56, 0.94, 0.82]
}

export default function NavGlassOverlay({ navRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const nav = navRef.current
    const canvas = canvasRef.current
    if (!nav || !canvas) return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    let renderer
    try {
      renderer = new LiquidGlassRenderer(canvas, () => (dirty = true))
    } catch {
      canvas.style.display = 'none'
      return undefined
    }

    let dirty = true
    let raf = 0
    let last = performance.now()
    let prevX = null
    let vel = 0
    let tint = tintFromTheme()
    const press = createSpring(0)
    const motion = createMotionTracker(nav, () => (dirty = true))

    const size = () => {
      renderer.resize(canvas.clientWidth, canvas.clientHeight)
      dirty = true
    }
    const ro = new ResizeObserver(size)
    ro.observe(canvas)
    size()

    // الثيم اتغيّر → لون الانكسار يتغيّر
    const mo = new MutationObserver(() => {
      tint = tintFromTheme()
      dirty = true
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })

    const onDown = () => {
      press.target = 1
      dirty = true
    }
    const onUp = () => {
      press.target = 0
      dirty = true
    }
    nav.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    let pillEl = null
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.064)
      last = now
      updateSpring(press, dt, 420, 30)

      if (!pillEl || !pillEl.isConnected) pillEl = nav.querySelector('.qz-nav-pill')
      const nr = nav.getBoundingClientRect()
      const scale = nr.width / (canvas.clientWidth || nr.width || 1)
      let pillX = 0
      let pillW = 0
      let pillH = 0
      if (pillEl) {
        const pr = pillEl.getBoundingClientRect()
        const op = parseFloat(getComputedStyle(pillEl).opacity || '1')
        if (pr.width > 0 && op > 0.05) {
          pillX = (pr.left - nr.left + pr.width / 2) / scale
          pillW = pr.width / scale
          pillH = pr.height / scale
        }
      }
      const v = prevX == null || dt <= 0 ? 0 : (pillX - prevX) / dt
      vel += (v - vel) * 0.25
      if (Math.abs(vel) < 1) vel = 0
      if (prevX !== pillX) dirty = true
      prevX = pillX
      if (press.current !== press.target || vel !== 0 || !motion.isSettled()) dirty = true

      if (dirty) {
        dirty = false
        const r = reduced.matches
        renderer.render({
          lightPos: r ? STATIC_LIGHT : motion.lightPos,
          pillX,
          pillWidth: pillW,
          pillHeight: pillH,
          navRadius: canvas.clientHeight / 2,
          transitionVel: r ? 0 : vel,
          pressAmt: r ? 0 : press.current,
          tintColor: tint,
        })
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      motion.destroy()
      nav.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      renderer.destroy()
    }
  }, [navRef])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[15] h-full w-full rounded-full"
    />
  )
}
