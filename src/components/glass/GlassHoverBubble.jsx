import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/*
 * فقاعة Liquid Glass بتتزحلق ورا الماوس جوه القوائم المنسدلة.
 * - أي عنصر عليه data-qz-item بيبقى هدف للفقاعة
 * - لما الماوس يخرج، الفقاعة بترجع للعنصر النشط (aria-current="page") أو تختفي
 * - الفقاعة فوق النص (pointer-events: none) فبتكسر اللي تحتها زي العدسة
 */

// insetX/insetY: الفقاعة أصغر شوية من العنصر نفسه (كانت كبيرة وبتغطي حواف النص)
export default function GlassHoverBubble({ containerRef, radius = 14, insetX = 6, insetY = 4 }) {
  const [box, setBox] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const place = (el) => {
      const c = container.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      // القائمة بتفتح بـ scale، فبنقسم عليه عشان المقاس يبقى مظبوط
      const scale = container.offsetWidth ? c.width / container.offsetWidth : 1
      setBox({
        x: (r.left - c.left) / scale + insetX,
        y: (r.top - c.top) / scale + insetY,
        w: Math.max(0, r.width / scale - insetX * 2),
        h: Math.max(0, r.height / scale - insetY * 2),
      })
      setVisible(true)
    }

    const onOver = (event) => {
      const el = event.target.closest?.('[data-qz-item]')
      if (el && container.contains(el)) place(el)
    }

    const restore = () => {
      const active = container.querySelector('[data-qz-item][aria-current="page"]')
      if (active) place(active)
      else setVisible(false)
    }

    container.addEventListener('pointerover', onOver)
    container.addEventListener('focusin', onOver)
    container.addEventListener('pointerleave', restore)
    const timer = window.setTimeout(restore, 220)

    return () => {
      window.clearTimeout(timer)
      container.removeEventListener('pointerover', onOver)
      container.removeEventListener('focusin', onOver)
      container.removeEventListener('pointerleave', restore)
    }
  }, [containerRef, insetX, insetY])

  if (!box) return null

  return (
    <motion.span
      aria-hidden="true"
      data-liquid-ignore=""
      className="qz-menu-bubble pointer-events-none absolute left-0 top-0 z-0"
      style={{ borderRadius: radius }}
      initial={{ opacity: 0, x: box.x, y: box.y, width: box.w, height: box.h, scale: 0.92 }}
      animate={{ opacity: visible ? 1 : 0, x: box.x, y: box.y, width: box.w, height: box.h, scale: visible ? 1 : 0.92 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 32,
        mass: 0.8,
        opacity: { duration: 0.18 },
      }}
    />
  )
}
