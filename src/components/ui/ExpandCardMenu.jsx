import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import GlassIcon from './GlassIcon.jsx'

const S = (x, k = 400, c = 30) => ({ x, v: 0, t: x, k, c })
const step = (s, dt) => {
  const a = -s.k * (s.x - s.t) - s.c * s.v
  s.v += a * dt
  s.x += s.v * dt
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export default function ExpandCardMenu({ items = [], activeKey, onSelect }) {
  const listRef = useRef(null)
  const openRef = useRef(-1)
  const rowsRef = useRef([])
  const timersRef = useRef([])

  useEffect(() => {
    const list = listRef.current
    if (!list) return undefined

    const ROW = 64
    const GAP = 8
    const PAD = 6
    const count = items.length
    const baseHeight = PAD * 2 + count * ROW + Math.max(0, count - 1) * GAP
    list.style.height = `${baseHeight}px`

    const els = [...list.querySelectorAll('.qz-ex-card')]
    const rows = els.map((el, i) => ({
      el,
      i,
      thumb: el.querySelector('.qz-ex-thumb'),
      head: el.querySelector('.qz-ex-head'),
      badge: el.querySelector('.qz-ex-badge'),
      more: el.querySelector('.qz-ex-more'),
      p: S(0, 240, 21),
      a: S(0, 260, 28),
      y: S(PAD + i * (ROW + GAP), 300, 26),
      o: S(1, 300, 30),
      s: S(1, 300, 26),
    }))
    rowsRef.current = rows

    const after = (sec, fn) => {
      const id = window.setTimeout(fn, sec * 1000)
      timersRef.current.push(id)
    }

    const show = (idx) => {
      openRef.current = idx
      rows.forEach((r) => {
        const home = PAD + r.i * (ROW + GAP)
        if (idx < 0) {
          r.p.t = 0
          r.a.t = 0
          r.y.t = home
          r.o.t = 1
          r.s.t = 1
          return
        }
        if (r.i === idx) {
          r.p.t = 1
          r.y.t = PAD
          r.o.t = 1
          r.s.t = 1
          r.el.style.zIndex = '2'
          after(0.16, () => {
            if (openRef.current === idx) r.a.t = 1
          })
        } else {
          r.a.t = 0
          r.p.t = 0
          r.o.t = 0
          r.s.t = 0.94
          r.y.t = home + (r.i < idx ? -22 : 22)
          r.el.style.zIndex = '1'
        }
      })
    }

    const cleanups = rows.map((r) => {
      const onClick = (e) => {
        if (e.target.closest('.qz-ex-go')) return
        show(openRef.current === r.i ? -1 : r.i)
      }
      r.el.addEventListener('click', onClick)
      return () => r.el.removeEventListener('click', onClick)
    })

    let raf = 0
    let last = performance.now()
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      const sub = 4
      for (let k = 0; k < sub; k++) {
        rows.forEach((r) => [r.p, r.a, r.y, r.o, r.s].forEach((st) => step(st, dt / sub)))
      }

      const W = list.offsetWidth
      let targetListH = baseHeight

      rows.forEach((r) => {
        const p = r.p.x
        const q = clamp(p, 0, 1)
        const moreH = r.more ? r.more.offsetHeight : 64
        const full = 136 + moreH + 14
        const curH = ROW + p * (full - ROW)
        if (openRef.current === r.i) {
          targetListH = Math.max(baseHeight, PAD * 2 + curH)
        }

        r.el.style.height = `${curH.toFixed(2)}px`
        r.el.style.transform = `translateY(${r.y.x.toFixed(2)}px) scale(${r.s.x.toFixed(4)})`
        r.el.style.opacity = clamp(r.o.x, 0, 1).toFixed(3)
        r.el.style.pointerEvents = r.o.t > 0.5 ? 'auto' : 'none'

        if (r.thumb) {
          r.thumb.style.width = `${(44 + q * (W - 24 - 44)).toFixed(2)}px`
          r.thumb.style.height = `${Math.max(44, 44 + p * 36).toFixed(2)}px`
          r.thumb.style.borderRadius = `${(12 + q * 4).toFixed(2)}px`
        }
        if (r.head) {
          r.head.style.transform = `translate(${(-64 + 48 * q).toFixed(2)}px, ${(12 + 78 * p).toFixed(2)}px)`
        }
        if (r.badge) {
          r.badge.style.transform = `translateY(${(20 + 74 * p).toFixed(2)}px)`
        }
        if (r.more) {
          const a = clamp(r.a.x, 0, 1)
          r.more.style.opacity = a.toFixed(3)
          r.more.style.transform = `translateY(${((1 - r.a.x) * 10).toFixed(2)}px)`
        }
      })

      list.style.height = `${targetListH.toFixed(1)}px`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
      cleanups.forEach((fn) => fn())
    }
  }, [items])

  return (
    <div ref={listRef} className="qz-ex-list relative w-full overflow-hidden">
      {items.map((item, idx) => {
        const isActive = activeKey === item.key || activeKey === item.to
        return (
          <motion.div
            key={item.to}
            data-i={idx}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 26,
              delay: idx * 0.04,
            }}
            className={`qz-ex-card absolute inset-x-0 top-0 cursor-pointer overflow-hidden rounded-2xl border transition-colors ${
              isActive
                ? 'border-white/28 bg-white/[0.12]'
                : 'border-white/14 bg-white/[0.06] hover:border-white/26 hover:bg-white/[0.09]'
            }`}
            style={{ height: 64 }}
          >
            {/* البلاطة الزجاجية للأيقونة تتمدد لتصبح رأس البطاقة */}
            <div
              data-av={(idx % 12) + 1}
              className="qz-ex-thumb absolute right-2.5 top-2.5 grid place-items-center overflow-hidden rounded-xl shadow-inner"
              style={{ width: 44, height: 44 }}
            >
              <GlassIcon icon={item.icon} size="md" active={isActive} />
            </div>

            {/* العنوان والوصف المختصر */}
            <div className="qz-ex-head absolute right-0 top-0 text-right">
              <p className="text-sm font-bold leading-5 text-white">{item.label}</p>
              <p className="text-[11.5px] leading-4 text-[color:var(--qz-mint)]/75">
                {item.sub}
              </p>
            </div>

            {/* شارة القسم */}
            {item.badge && (
              <span className="qz-ex-badge absolute left-3.5 top-0 rounded-full bg-emerald-400/20 px-2 py-0.5 font-sans text-[9px] font-semibold tracking-wider text-emerald-200">
                {item.badge}
              </span>
            )}

            {/* تفاصيل البطاقة عند التمدد + زر الانتقال */}
            <div className="qz-ex-more absolute inset-x-3.5 top-[134px] opacity-0">
              <p className="text-xs leading-5 text-white/85">{item.desc}</p>
              <div className="mt-2.5 flex items-center gap-1.5">
                {item.chips?.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/14 bg-white/8 px-2.5 py-0.5 text-[10.5px] font-medium text-[color:var(--qz-mint)]"
                  >
                    {chip}
                  </span>
                ))}
                <button
                  type="button"
                  onMouseEnter={(e) => {
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect?.(e, item.to, item.key || item.to)
                  }}
                  className="qz-ex-go mr-auto cursor-pointer rounded-full bg-white px-3.5 py-1 text-xs font-bold text-[#051F20] shadow-sm transition hover:scale-[1.03] active:scale-95"
                >
                  افتح القسم
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}