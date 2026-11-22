import { useEffect, useRef } from 'react'
import { springs } from '../../lib/springs'

export default function PortraitLiquidReveal() {
  const canvas = useRef(null)
  useEffect(() => {
    const element = canvas.current
    const context = element.getContext('2d')
    if (!context) return undefined
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const base = new Image(); base.src = import.meta.env.BASE_URL + 'images/about-base.png'
    const reveal = new Image(); reveal.src = import.meta.env.BASE_URL + 'images/about-logo.png'
    let width = 0, height = 0, frame = 0, previous = 0
    const point = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, vx: 0, vy: 0 }
    const resize = () => { const rect = element.getBoundingClientRect(); width = rect.width; height = rect.height; const ratio = Math.min(devicePixelRatio || 1, 2); element.width = width * ratio; element.height = height * ratio; context.setTransform(ratio, 0, 0, ratio, 0, 0) }
    const image = (source, fallback) => {
      if (source.complete && source.naturalWidth) {
        const scale = Math.max(width / source.naturalWidth, height / source.naturalHeight)
        const imageWidth = source.naturalWidth * scale, imageHeight = source.naturalHeight * scale
        context.drawImage(source, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight)
      } else {
        context.fillStyle = fallback; context.fillRect(0, 0, width, height)
        context.strokeStyle = 'rgba(255,255,255,.06)'; context.lineWidth = 1
        for (let line = 0; line < 12; line++) { context.beginPath(); context.ellipse(width * .5, height * .45, width * (.15 + line * .055), height * (.15 + line * .045), -.25, 0, Math.PI * 2); context.stroke() }
        context.fillStyle = 'rgba(255,255,255,.12)'; context.beginPath(); context.arc(width / 2, height * .36, height * .15, 0, Math.PI * 2); context.fill()
        context.beginPath(); context.ellipse(width / 2, height * .87, width * .27, height * .35, 0, 0, Math.PI * 2); context.fill()
        context.fillStyle = 'rgba(255,255,255,.8)'; context.textAlign = 'center'; context.font = 'bold 30px sans-serif'; context.fillText('قاسمز', width / 2, height * .88)
      }
    }
    const render = time => {
      const dt = Math.min((time - (previous || time)) / 1000, 0.032); previous = time
      const { stiffness, damping } = springs.follow
      if (reduced.matches) { point.x = point.targetX; point.y = point.targetY }
      else {
        point.vx += ((point.targetX - point.x) * stiffness - point.vx * damping) * dt
        point.vy += ((point.targetY - point.y) * stiffness - point.vy * damping) * dt
        point.x += point.vx * dt; point.y += point.vy * dt
      }
      const styles = getComputedStyle(document.documentElement)
      context.clearRect(0, 0, width, height); image(base, styles.getPropertyValue('--qz-deep').trim())
      const radius = Math.min(width, height) * (reduced.matches ? .23 : .23 + .012 * Math.sin(time / 1300))
      context.save(); context.beginPath(); context.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2); context.clip(); image(reveal, styles.getPropertyValue('--qz-moss').trim()); context.restore()
      context.strokeStyle = 'rgba(255,255,255,.55)'; context.lineWidth = 1; context.beginPath(); context.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2); context.stroke()
      context.strokeStyle = 'rgba(255,255,255,.25)'; context.beginPath()
      for (let segment = 0; segment <= 24; segment++) {
        const angle = segment * Math.PI * 2 / 24
        const distance = radius * (segment % 2 ? .96 : 1.04)
        const edgeX = point.x * width + Math.cos(angle) * distance, edgeY = point.y * height + Math.sin(angle) * distance
        if (segment === 0) context.moveTo(edgeX, edgeY); else context.lineTo(edgeX, edgeY)
      }
      context.closePath(); context.stroke()
      if (!reduced.matches && !document.hidden) frame = requestAnimationFrame(render)
    }
    const restart = () => { cancelAnimationFrame(frame); previous = 0; if (!document.hidden) frame = requestAnimationFrame(render) }
    const pointer = event => { const rect = element.getBoundingClientRect(); point.targetX = (event.clientX - rect.left) / rect.width; point.targetY = (event.clientY - rect.top) / rect.height; if (reduced.matches) restart() }
    const reset = () => { point.targetX = .5; point.targetY = .5; if (reduced.matches) restart() }
    const onResize = () => { resize(); restart() }
    const observer = new MutationObserver(restart)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    base.addEventListener('load', restart); reveal.addEventListener('load', restart)
    reduced.addEventListener('change', restart); document.addEventListener('visibilitychange', restart)
    resize(); restart(); window.addEventListener('resize', onResize); element.addEventListener('pointermove', pointer); element.addEventListener('pointerleave', reset)
    return () => { cancelAnimationFrame(frame); observer.disconnect(); base.removeEventListener('load', restart); reveal.removeEventListener('load', restart); reduced.removeEventListener('change', restart); document.removeEventListener('visibilitychange', restart); window.removeEventListener('resize', onResize); element.removeEventListener('pointermove', pointer); element.removeEventListener('pointerleave', reset) }
  }, [])
  return <canvas ref={canvas} className="qz-portrait" aria-label="صورة قاسمز التفاعلية؛ أضف صورتي about-base.png وabout-logo.png لإظهار الصورة الشخصية" role="img" />
}
