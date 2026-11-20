import { useEffect, useRef, useState } from 'react'

/* ══ مقارنة الصورة (مبنية على Image compare من bencho.dev) ══════
   صورة واحدة بحالتين وخط تسحبه عليها: على الشمال نسخة الأرشيف
   (أبيض وأسود باهت)، وعلى اليمين الصورة بألوانها. اسحب ببطء
   فيقف مكان ما تسيبه، أو ارميه فينزلق للحافة اللي رميته ناحيتها.

   ── الخط جيلي ────────────────────────────────────────────
   المقبض تحت صباعك بالظبط، لكن طرفي الخط بيتبعوه على زنبرك، فالسحب
   السريع بيخلي الخط ينحني وبعدين يرجع مستقيم. طبقة الأرشيف بتتقص
   على نفس المنحنى (clip-path: path) فحافة الصورة بتنحني مع الخط.

   الاتجاه هنا LTR عن قصد: الهندسة (الشمال = قبل) لازم تفضل ثابتة
   حتى جوه صفحة RTL. */

const W = 270
const H = 360
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

const DEFAULT_SRC =
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=540&h=720&q=75'

export default function ImageCompare({
  src = DEFAULT_SRC,
  alt = '',
  beforeLabel = 'الأرشيف',
  afterLabel = 'اليوم',
  labels = true,
  corner = 24,
}) {
  const [p, setP] = useState(0.5)
  const [bend, setBend] = useState(0)
  const [held, setHeld] = useState(false)
  const cur = useRef(0.5)
  const target = useRef(null)
  const ends = useRef({ x: 0.5, v: 0 })
  const raf = useRef(0)
  const box = useRef(null)
  const drag = useRef(null)

  /* حلقة واحدة للحركتين: الانزلاق ناحية هدف، وطرفين الخط وهم بيلحقوا
     النص. بتقف لوحدها أول ما كله يهدى. */
  const loop = () => {
    if (raf.current) return
    let prev = performance.now()
    const step = (t) => {
      const dt = Math.min(0.033, (t - prev) / 1000)
      prev = t
      if (target.current !== null) {
        cur.current += (target.current - cur.current) * (1 - Math.pow(0.0004, dt))
        if (Math.abs(target.current - cur.current) < 0.0005) {
          cur.current = target.current
          target.current = null
        }
      }
      const e = ends.current
      e.v += ((cur.current - e.x) * 620 - e.v * 44) * dt
      e.x += e.v * dt
      setP(cur.current)
      setBend(clamp((cur.current - e.x) * W * 0.5, -9, 9))
      const still =
        target.current === null && Math.abs(cur.current - e.x) < 0.0006 && Math.abs(e.v) < 0.002
      if (still) {
        e.x = cur.current
        e.v = 0
        setBend(0)
        raf.current = 0
        return
      }
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }
  const glide = (to) => {
    target.current = to
    loop()
  }
  const place = (v) => {
    target.current = null
    cur.current = v
    setP(v)
    loop()
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const at = (cx) => {
    const r = box.current.getBoundingClientRect()
    return clamp((cx - r.left) / r.width, 0, 1)
  }

  const r = clamp(corner, 0, 28)
  const x = p * W
  const top = x - bend
  const curve = `M ${top.toFixed(2)} 0 Q ${(x + bend).toFixed(2)} ${H / 2} ${top.toFixed(2)} ${H}`
  const cut = `path("M 0 0 L ${top.toFixed(2)} 0 Q ${(x + bend).toFixed(2)} ${H / 2} ${top.toFixed(2)} ${H} L 0 ${H} Z")`

  return (
    <div
      ref={box}
      dir="ltr"
      className="cmp"
      data-held={held || undefined}
      data-qz-silent
      role="slider"
      tabIndex={0}
      aria-label={`مقارنة الصورة: ${beforeLabel} و${afterLabel}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      aria-valuetext={`${Math.round(p * 100)}٪ ${beforeLabel}`}
      style={{ width: W, height: H, borderRadius: r }}
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* pointer مبرمج */
        }
        const v = at(e.clientX)
        drag.current = { v: 0, t: performance.now(), last: v }
        setHeld(true)
        glide(v)
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        const v = at(e.clientX)
        const now = performance.now()
        d.v = (v - d.last) / Math.max(1, now - d.t)
        d.t = now
        d.last = v
        place(v)
      }}
      onPointerUp={(e) => {
        const d = drag.current
        drag.current = null
        setHeld(false)
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          /* ماكانش متمسوك */
        }
        // الرمية بتوديه للحافة اللي اترمى ناحيتها
        if (d && Math.abs(d.v) > 0.0025) glide(d.v > 0 ? 1 : 0)
      }}
      onPointerCancel={() => {
        drag.current = null
        setHeld(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          glide(clamp((target.current ?? cur.current) - 0.1, 0, 1))
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          glide(clamp((target.current ?? cur.current) + 0.1, 0, 1))
        }
      }}
    >
      {/* الصورة بألوانها تحت */}
      <img className="cmp-img" src={src} alt={alt} draggable={false} loading="lazy" decoding="async" />
      {/* نسخة الأرشيف فوق، مقصوصة عند الخط */}
      <div className="cmp-before" style={{ clipPath: cut }}>
        <img
          className="cmp-img cmp-archive"
          src={src}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
        />
      </div>
      {labels && (
        <>
          <span className="cmp-tag" style={{ opacity: clamp((p - 0.14) * 4, 0, 1) }}>
            {beforeLabel}
          </span>
          <span className="cmp-tag cmp-right" style={{ opacity: clamp((0.86 - p) * 4, 0, 1) }}>
            {afterLabel}
          </span>
        </>
      )}
      <svg className="cmp-line" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <path d={curve} />
      </svg>
      <span className="cmp-grip" style={{ left: x }}>
        <span className="cmp-knob">
          <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
            <path
              d="M5 1 1 5l4 4M11 1l4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </div>
  )
}
