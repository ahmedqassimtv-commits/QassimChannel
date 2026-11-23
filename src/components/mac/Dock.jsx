import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { DOCK_APPS } from './navModel.js'

/*
 * الـDock — زجاج سائل زي Dock macOS 26 / iPadOS (Figma: Home Screen Quick Actions).
 * • تكبير الأيقونات حسب قرب الماوس (نوابض)، ونقطة «شغال» تحت القسم الحالي.
 * • اسم التطبيق بيطلع فوق الأيقونة في كبسولة، والضغط بيعمل نطّة.
 * • بيستخبى لما تنزل وبيرجع لما تطلع أو تقرب من تحت الشاشة.
 * • الأيقونات تصميم أصلي (بلاطة squircle بتدرج + رمز lucide + لمعة زجاج).
 */

const BASE = 50
const MAX = 76
const RANGE = 150

function DockIcon({ app, mouseX, current, onOpen, magnify }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(false)
  const [bounce, setBounce] = useState(0)
  const distance = useTransform(mouseX, (x) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || !Number.isFinite(x)) return RANGE
    return x - (r.left + r.width / 2)
  })
  const target = useTransform(distance, [-RANGE, 0, RANGE], [BASE, MAX, BASE])
  const size = useSpring(target, { stiffness: 420, damping: 30, mass: 0.35 })
  const Icon = app.icon

  return (
    <li className="mac-dock-slot" data-id={app.id}>
      <AnimatePresence>
        {hover && (
          <motion.span
            className="mac-dock-tip"
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 32 }}
          >
            {app.label}
          </motion.span>
        )}
      </AnimatePresence>
      <motion.button
        ref={ref}
        type="button"
        className="mac-dock-icon"
        aria-label={app.label}
        aria-current={current ? 'page' : undefined}
        style={magnify ? { width: size, height: size } : undefined}
        whileTap={{ scale: 0.9 }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={() => {
          if (!current) setBounce((b) => b + 1)
          onOpen(app)
        }}
      >
        <motion.span
          key={bounce}
          className="mac-dock-tile"
          data-dark={app.dark ? 'true' : undefined}
          style={{ background: `linear-gradient(160deg, ${app.tile[0]} 0%, ${app.tile[1]} 100%)` }}
          animate={bounce ? { y: [0, -22, 0, -8, 0] } : undefined}
          transition={{ duration: 0.7, times: [0, 0.3, 0.6, 0.8, 1], ease: 'easeOut' }}
          aria-hidden="true"
        >
          <Icon className="mac-dock-glyph" strokeWidth={2.1} />
        </motion.span>
      </motion.button>
      <span className="mac-dock-run" data-on={current ? 'true' : undefined} aria-hidden="true" />
    </li>
  )
}

export default function Dock() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const mouseX = useMotionValue(Infinity)
  const [hidden, setHidden] = useState(false)
  const [magnify, setMagnify] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 700px)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => setMagnify(mq.matches && !reduce.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  // يستخبى مع النزول، يرجع مع الطلوع أو لما الماوس يقرب من تحت
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const nearEnd = window.innerHeight + y > document.documentElement.scrollHeight - 160
      if (nearEnd || y < 80) setHidden(false)
      else if (y > lastY + 6) setHidden(true)
      else if (y < lastY - 6) setHidden(false)
      lastY = y
    }
    const onMove = (e) => {
      if (e.clientY > window.innerHeight - 90) setHidden(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  const open = (app) => {
    if (app.action === 'spotlight') {
      window.dispatchEvent(new CustomEvent('qz:spotlight'))
      return
    }
    navigate(app.to)
  }

  return (
    <motion.nav
      className="mac-dock-wrap"
      aria-label="الأقسام"
      dir="rtl"
      initial={{ y: 120, opacity: 0 }}
      animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
    >
      <ul
        className="mac-dock"
        onPointerMove={(e) => magnify && mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(Infinity)}
      >
        {DOCK_APPS.map((app) =>
          app.divider ? (
            <li key={app.id} className="mac-dock-divider" aria-hidden="true" />
          ) : (
            <DockIcon
              key={app.id}
              app={app}
              mouseX={mouseX}
              magnify={magnify}
              current={app.match ? app.match(pathname) : false}
              onOpen={open}
            />
          ),
        )}
      </ul>
    </motion.nav>
  )
}
