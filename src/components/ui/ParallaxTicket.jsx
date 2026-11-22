import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { springs } from '../../lib/springs'

export default function ParallaxTicket() {
  const reduced = useReducedMotion()
  const x = useMotionValue(0), y = useMotionValue(0)
  const rotateY = useSpring(x, springs.ticket), rotateX = useSpring(y, springs.ticket)
  const move = event => {
    if (reduced || event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set(((event.clientX - rect.left) / rect.width - .5) * 14)
    y.set((.5 - (event.clientY - rect.top) / rect.height) * 14)
  }
  return <motion.div className="qz-ticket" style={{ rotateX, rotateY }} onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0) }}><span>قاسمز · الحلقات</span><h2>مواعيد حلقات قاسمز</h2><p>تابع أحدث الحلقات والمواعيد عند إعلانها في قسم الفيديوهات.</p><a href={import.meta.env.BASE_URL + "videos"}>اكتشف الحلقات ←</a></motion.div>
}
