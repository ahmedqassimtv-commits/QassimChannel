import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ══ الفِردِكت — Cinema Reel ══════════════════════════════════════════════
   مبني على مواصفات "Cinema Reel" (cinema-reel.md) بنفس الأرقام، معكوس للعربي:
   - شاشة كاملة، كل حكم كادر 80dvh بصورة سينمائية وparallax (R = 1.2)
   - دخول "بكرة الفيلم": بتجري في كل الكادرات 3 لفّات في 3 ثواني (power3.out)
     مع motion blur رأسي وscanlines على قد السرعة، وبتفرمل على أول حكم
   - العجلة/السحب/النقط/الأسهم بينقلوا كادر كادر، وكله spring بيقف في النص
     (y += (target − y) · 0.11)، والكادر الجاي محتواه بيظهر بـsmoothstep
     واللي ماشي بيسبق بـparallax
   - "التفاصيل": الكادر بيتفتح كباب على حرفه (rotateY) ولوح بيدخل من الجنب
   اختلافين عن الأصل علشان الصفحة: في أول وآخر حكم العجلة بتكمّل تنزل الصفحة
   عادي (مش محبوس جوّه البكرة)، والصور من يوتيوب. */

/* ─── Layout (vh values; rendered as dvh) ─── */
const SLIDE_VH = 80
const GAP_VH = 5
const PITCH_VH = SLIDE_VH + GAP_VH
const MASK_VH = 10
const TOP_PAD_VH = (100 - SLIDE_VH) / 2
/* ─── Input ─── */
const WHEEL_PER_EVENT_CAP = 200
const WHEEL_PAUSE_MS = 100
const DRAG_THRESHOLD_VH = 14
/* ─── Spring ─── */
const EASE = 0.11
/* ─── Content motion ─── */
const FADE_THRESHOLD = 0.55
const PARALLAX_FACTOR = 0.42
const ENTRY_OFFSET_PX = 64
/* ─── Image parallax ─── */
const IMG_HEIGHT_RATIO = 1.2
/* ─── Loop / entrance ─── */
const LOOP_COPIES = 7
const AUTO_SCROLL_MS = 3000
const AUTO_FADE_MS = 1000
const BG = '#0a0908'

const thumb = (id, q = 'maxresdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`
const year = (d) => (d ? String(d).slice(0, 4) : '')
const stars5 = (rating) => Math.round(Number(rating) / 2)
const smooth = (t) => t * t * (3 - 2 * t)

function Stars({ n, size = 12 }) {
  return (
    <span className="qz-reel-stars" aria-label={`${n} من 5`}>
      {Array.from({ length: 5 }).map((_, s) => (
        <span
          key={s}
          style={{ fontSize: size, color: s < n ? '#f1e7d2' : 'rgba(255,255,255,0.18)' }}
        >
          ★
        </span>
      ))}
    </span>
  )
}

function ReelImg({ id, eager }) {
  return (
    <img
      src={thumb(id)}
      alt=""
      loading="eager"
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      draggable={false}
      onError={(e) => {
        if (!e.currentTarget.dataset.fb) {
          e.currentTarget.dataset.fb = '1'
          e.currentTarget.src = thumb(id, 'hqdefault')
        }
      }}
    />
  )
}

function SlideContent({ r, onExplore, onWatch }) {
  return (
    <div className="qz-reel-content">
      <div className="qz-reel-tl" data-reveal>
        <div className="qz-reel-year">{year(r.date)}</div>
        <div className="qz-reel-eyebrow">
          الفِردِكت · {r.mediaType}
          <br />
          <span className="qz-latin">THE VERDICT</span>
        </div>
        <div className="qz-reel-badge">
          <span className="qz-reel-laurel" aria-hidden="true">
            ❦
          </span>
          <span className="qz-reel-badge-in">
            <span>حُكم قاسم</span>
            <Stars n={stars5(r.rating)} size={9} />
          </span>
          <span className="qz-reel-laurel qz-reel-laurel-b" aria-hidden="true">
            ❦
          </span>
        </div>
      </div>

      <div className="qz-reel-title" data-reveal>
        <div className="qz-reel-cat">{(r.tags ?? []).join(' · ')}</div>
        <h2>
          <span className="block">{r.titleAr || r.title}</span>
        </h2>
        <div className="qz-reel-meta">
          <div>
            <span className="qz-reel-k">العنوان</span>
            <span className="qz-latin">{r.title}</span>
          </div>
          <div>
            <span className="qz-reel-k">التقييم</span>
            <span>{r.rating} من 10</span>
          </div>
        </div>
      </div>

      <div className="qz-reel-awards-pos">
        <div className="qz-reel-awards" data-reveal>
          <div className="qz-reel-award">
            <Stars n={stars5(r.rating)} />
            <div className="qz-reel-k">الحُكم</div>
            <div className="qz-reel-quote">«{r.verdict}»</div>
          </div>
        </div>
      </div>

      <div className="qz-reel-actions" data-reveal>
        <button
          type="button"
          data-no-drag
          className="qz-reel-btn qz-reel-btn-ghost"
          onClick={onWatch}
        >
          شاهد الحلقة
        </button>
        <button type="button" data-no-drag className="qz-reel-btn" onClick={onExplore}>
          <span className="qz-reel-sweep" aria-hidden="true" />
          <span>التفاصيل</span>
          <span className="qz-reel-arrow" aria-hidden="true">
            ←
          </span>
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, suffix }) {
  return (
    <div className="qz-reel-stat">
      <div className="qz-reel-k">{label}</div>
      <div className="qz-reel-stat-v">
        {value}
        {suffix && <span>{suffix}</span>}
      </div>
    </div>
  )
}

function DetailsPanel({ open, r, onClose, onWatch }) {
  return (
    <>
      <div
        data-no-drag
        aria-hidden={!open}
        onClick={onClose}
        className="qz-reel-backdrop"
        data-open={open ? 'true' : undefined}
      />
      <aside
        data-no-drag
        aria-hidden={!open}
        className="qz-reel-panel"
        data-open={open ? 'true' : undefined}
        data-lenis-prevent
      >
        {r && (
          <>
            <div className="qz-reel-panel-scroll">
              <div className="qz-reel-panel-hero">
                <ReelImg id={r.youtubeId} />
                <i />
              </div>
              <div className="qz-reel-panel-body">
                <div className="qz-reel-eyebrow">الفِردِكت · {r.mediaType}</div>
                <h2>{r.titleAr || r.title}</h2>
                <div className="qz-reel-panel-row">
                  <span className="qz-latin">{r.title}</span>
                  <span className="qz-reel-dot">·</span>
                  <span>{year(r.date)}</span>
                  <span className="qz-reel-dot">·</span>
                  <span>{(r.tags ?? []).join(' · ')}</span>
                </div>
                <div className="qz-reel-rule" />
                <p className="qz-reel-synopsis">{r.verdict}</p>
                <div className="qz-reel-rule" />
                <div className="qz-reel-stats">
                  <Stat label="التقييم" value={r.rating} suffix="/10" />
                  <Stat label="النجوم" value={stars5(r.rating)} suffix="/5" />
                  <Stat label="النوع" value={r.mediaType} />
                  <Stat label="السنة" value={year(r.date)} />
                  <Stat label="التصنيف" value={(r.tags ?? [])[0] ?? '—'} />
                  <Stat label="المنصة" value="يوتيوب" />
                </div>
                <div className="qz-reel-rule" />
                <button type="button" className="qz-reel-btn qz-reel-watch" onClick={onWatch}>
                  <span className="qz-reel-sweep" aria-hidden="true" />
                  <span>شاهد الحلقة كاملة</span>
                  <span className="qz-reel-arrow" aria-hidden="true">
                    ←
                  </span>
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="اقفل التفاصيل"
              className="qz-reel-close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path
                  d="M1 1L13 13M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </>
        )}
      </aside>
    </>
  )
}

export default function CinemaReel({ items, startId, onWatch }) {
  const N = items.length
  const TOTAL = N * LOOP_COPIES
  const INITIAL_IDX = Math.floor(LOOP_COPIES / 2) * N
  const AUTO_START_IDX = INITIAL_IDX + 1
  const startOffset = Math.max(
    0,
    items.findIndex((r) => r.id === startId),
  )
  const AUTO_END_IDX = INITIAL_IDX + 3 * N + startOffset
  // بعد الدخول التنقل جوّه نسخة واحدة؛ برّاها العجلة بتنزل الصفحة
  const BASE = INITIAL_IDX + 3 * N

  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const slideRefs = useRef([])
  const blurRef = useRef(null)
  const scanRef = useRef(null)
  const api = useRef({})

  const reduce = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const hover = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
    [],
  )
  const [autoScrolling, setAutoScrolling] = useState(!reduce)
  const [activeIdx, setActiveIdx] = useState(
    (((reduce ? AUTO_END_IDX : AUTO_START_IDX) % N) + N) % N,
  )
  const [openKey, setOpenKey] = useState(null)
  const openRef = useRef(null)
  openRef.current = openKey

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track || !N) return undefined

    const modN = (i) => ((i % N) + N) % N
    let viewportH = window.innerHeight
    let pitch, slideH, dragThresh, topPad
    const recompute = () => {
      viewportH = window.innerHeight
      pitch = (viewportH * PITCH_VH) / 100
      slideH = (viewportH * SLIDE_VH) / 100
      dragThresh = (viewportH * DRAG_THRESHOLD_VH) / 100
      topPad = (viewportH * TOP_PAD_VH) / 100
      if (!st.auto) {
        st.target = topPad - st.idx * pitch
        st.y = st.target
      }
    }
    const st = {
      idx: reduce ? AUTO_END_IDX : AUTO_START_IDX,
      prev: reduce ? AUTO_END_IDX : AUTO_START_IDX,
      y: 0,
      target: 0,
      wheelT: 0,
      auto: !reduce,
      drag: { active: false, y0: 0, ty0: 0, delta: 0, id: 0 },
      on: false,
      down: false,
      zone: null,
      onUi: false,
      cur: { x: 0, y: 0 },
      cr: { x: 0, y: 0, s: 0, o: 0 },
      cInit: false,
    }
    recompute()
    st.y = ((TOP_PAD_VH - st.idx * PITCH_VH) * window.innerHeight) / 100
    st.target = st.y

    const setIndex = (next) => {
      const clamped = Math.max(BASE, Math.min(BASE + N - 1, next))
      if (clamped === st.idx) return
      st.prev = st.idx
      st.idx = clamped
      st.target = topPad - clamped * pitch
      setActiveIdx(modN(clamped))
    }
    api.current.goto = (mod) => {
      if (st.auto) return
      setIndex(BASE + modN(mod))
    }
    api.current.step = (d) => setIndex(st.idx + d)

    // ── entrance: the old reel ──
    let t0 = 0
    let lastP = 0
    let lastT = 0
    const slideEls = slideRefs.current
    const vh = window.innerHeight / 100
    const entrance = (now) => {
      if (!t0) t0 = now
      const t = Math.min(1, (now - t0) / AUTO_SCROLL_MS)
      const p = 1 - Math.pow(1 - t, 3) // power3.out
      const fade = 1 - Math.pow(1 - Math.min(1, (now - t0) / AUTO_FADE_MS), 2) // power2.out
      const idxF = AUTO_START_IDX + (AUTO_END_IDX - AUTO_START_IDX) * p
      st.y = (TOP_PAD_VH - idxF * PITCH_VH) * vh
      st.target = st.y
      for (let i = 0; i < slideEls.length; i++) {
        const el = slideEls[i]
        if (!el) continue
        el.style.opacity = fade.toFixed(3)
        const wrap = el.__wrap || (el.__wrap = el.querySelector('[data-slide-image]'))
        if (wrap)
          wrap.style.transform = `translate3d(0, ${(-((i - idxF) * PITCH_VH * vh) / IMG_HEIGHT_RATIO).toFixed(2)}px, 0)`
      }
      // blur + scanlines on velocity
      let norm = 1
      if (lastT) {
        const dt = Math.max(now - lastT, 1)
        const idxRange = AUTO_END_IDX - AUTO_START_IDX
        const speed = (Math.abs(p - lastP) * idxRange) / dt
        const peak = (idxRange * 3) / AUTO_SCROLL_MS
        norm = Math.min(speed / peak, 1)
      }
      lastP = p
      lastT = now
      blurRef.current?.setAttribute('stdDeviation', `0 ${(norm * 18).toFixed(2)}`)
      if (scanRef.current) scanRef.current.style.opacity = norm.toFixed(3)
      if (t >= 1) {
        st.auto = false
        blurRef.current?.setAttribute('stdDeviation', '0 0')
        st.idx = st.prev = AUTO_END_IDX
        st.target = topPad - AUTO_END_IDX * pitch
        st.y = st.target
        setActiveIdx(modN(AUTO_END_IDX))
        setAutoScrolling(false)
        // landing reveal: blur-in stagger (power4.out, 1s, 0.07s)
        const landing = slideRefs.current[st.idx]
        landing?.querySelectorAll('[data-reveal]').forEach((el, k) => {
          el.animate(
            [
              { opacity: 0, transform: 'translateY(32px)', filter: 'blur(10px)' },
              { opacity: 1, transform: 'none', filter: 'blur(0px)' },
            ],
            {
              duration: 1000,
              delay: k * 70,
              easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
              fill: 'backwards',
            },
          )
        })
      }
    }

    // ── per-frame loop ──
    let raf = 0
    const tick = (now) => {
      if (st.auto) entrance(now)
      const wheelActive = now - st.wheelT < WHEEL_PAUSE_MS
      if (!st.drag.active && !wheelActive && !st.auto) {
        const dy = st.target - st.y
        if (Math.abs(dy) < 0.5) st.y = st.target
        else st.y += dy * EASE
      }
      track.style.transform = `translate3d(0, ${st.y}px, 0)`
      if (!st.auto) {
        const viewCenter = viewportH / 2
        for (let i = 0; i < TOTAL; i++) {
          const ref = slideRefs.current[i]
          if (!ref) continue
          const dy = i * pitch + st.y + slideH / 2 - viewCenter
          const dn = Math.abs(dy) / slideH
          const content =
            ref.__content || (ref.__content = ref.querySelector('[data-slide-content]'))
          if (dn > 2) {
            if (content && content.style.opacity !== '0') {
              content.style.opacity = '0'
              content.style.filter = 'blur(16px)'
            }
            continue
          }
          const wrap = ref.__wrap || (ref.__wrap = ref.querySelector('[data-slide-image]'))
          if (wrap)
            wrap.style.transform = `translate3d(0, ${(-dy / IMG_HEIGHT_RATIO).toFixed(2)}px, 0)`
          if (!content) continue
          let o = 0
          let b = 16
          let cy = 0
          if (i === st.idx) {
            const t = Math.max(0, Math.min(1, 1 - dn / FADE_THRESHOLD))
            o = smooth(t)
            b = (1 - o) * 14
            cy = (1 - o) * ENTRY_OFFSET_PX * Math.sign(dy || 1)
          } else if (i === st.prev && st.prev !== st.idx) {
            const fade = Math.max(0, 1 - Math.max(0, dn - 0.6) / 0.6)
            o = fade
            b = (1 - fade) * 6
            cy = -dy * PARALLAX_FACTOR
          }
          content.style.transform = `translate3d(0, ${cy.toFixed(2)}px, 0)`
          content.style.opacity = o.toFixed(3)
          content.style.filter = b < 0.05 ? 'none' : `blur(${b.toFixed(2)}px)`
          content.style.pointerEvents = i === st.idx ? 'auto' : 'none'
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // ── wheel: live commit; at the ends the page scrolls on ──
    const onWheel = (e) => {
      if (e.target?.closest?.('[data-no-drag]')) return
      const r = section.getBoundingClientRect()
      const docked = Math.abs(r.top) < 4
      const down = e.deltaY > 0
      const atEnd = down ? st.idx >= BASE + N - 1 : st.idx <= BASE
      if (!docked || st.auto || (atEnd && Math.abs(st.target - st.y) < 2)) {
        delete section.dataset.lenisPrevent
        return
      }
      section.dataset.lenisPrevent = ''
      e.preventDefault()
      const delta = Math.max(-WHEEL_PER_EVENT_CAP, Math.min(WHEEL_PER_EVENT_CAP, e.deltaY))
      const lo = topPad - (BASE + N - 1) * pitch - pitch * 0.35
      const hi = topPad - BASE * pitch + pitch * 0.35
      st.y = Math.max(lo, Math.min(hi, st.y - delta))
      st.wheelT = performance.now()
      const nearest = Math.round((topPad - st.y) / pitch)
      if (nearest !== st.idx) setIndex(nearest)
    }

    // ── drag ──
    const onDown = (e) => {
      if (st.auto) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (e.target?.closest?.('[data-no-drag]')) return
      st.wheelT = 0
      st.drag = { active: true, y0: e.clientY, ty0: st.y, delta: 0, id: e.pointerId }
      st.down = true
      try {
        section.setPointerCapture(e.pointerId)
      } catch {
        /* detached */
      }
    }
    const onMove = (e) => {
      st.cur.x = e.clientX
      st.cur.y = e.clientY
      const top = (window.innerHeight * MASK_VH) / 100
      st.zone = e.clientY < top ? 'top' : e.clientY > window.innerHeight - top ? 'bottom' : null
      st.onUi = !!e.target?.closest?.('[data-no-drag]')
      if (!st.drag.active) return
      st.drag.delta = e.clientY - st.drag.y0
      st.y = st.drag.ty0 + st.drag.delta
    }
    const endDrag = (committed) => {
      const { delta } = st.drag
      const zone = st.zone
      st.drag.active = false
      st.down = false
      if (!committed) return
      if (zone && Math.abs(delta) < 8) {
        setOpenKey(null)
        setIndex(st.idx + (zone === 'top' ? -1 : 1))
        return
      }
      if (Math.abs(delta) > dragThresh) {
        const next = st.idx + (delta < 0 ? 1 : -1)
        // سحب لفوق بعد آخر حكم: كمّل الصفحة
        if (next > BASE + N - 1 && delta < 0) {
          const lenis = window.__qzLenis
          const to = section.offsetTop + section.offsetHeight
          if (lenis) lenis.scrollTo(to)
          else window.scrollTo({ top: to, behavior: 'smooth' })
        }
        setIndex(next)
      }
    }
    const onUp = () => {
      if (!st.drag.active) return
      try {
        section.releasePointerCapture(st.drag.id)
      } catch {
        /* */
      }
      endDrag(true)
    }
    const onCancel = () => {
      st.drag.delta = 0
      st.y = st.drag.ty0
      endDrag(false)
    }
    const onEnter = () => {
      st.on = true
    }
    const onLeave = () => {
      st.on = false
      if (st.drag.active) endDrag(true)
    }
    const onResize = () => recompute()
    const onKey = (e) => {
      if (!st.on || openRef.current) return
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        setIndex(st.idx + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        setIndex(st.idx - 1)
      }
    }

    section.addEventListener('wheel', onWheel, { passive: false })
    section.addEventListener('pointerdown', onDown)
    section.addEventListener('pointermove', onMove)
    section.addEventListener('pointerup', onUp)
    section.addEventListener('pointercancel', onCancel)
    section.addEventListener('pointerenter', onEnter)
    section.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      section.removeEventListener('wheel', onWheel)
      section.removeEventListener('pointerdown', onDown)
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerup', onUp)
      section.removeEventListener('pointercancel', onCancel)
      section.removeEventListener('pointerenter', onEnter)
      section.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N])

  // تغيير القسم من النافبار (أفلام ⇄ مسلسلات) بيروح لأول حكم فيه
  useEffect(() => {
    if (startOffset >= 0) api.current.goto?.(startOffset)
  }, [startOffset])

  // Escape يقفل اللوح
  useEffect(() => {
    if (!openKey) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpenKey(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openKey])

  const openR = items.find((r) => r.id === openKey) ?? null
  const slides = Array.from({ length: TOTAL }, (_, i) => items[i % N])

  return (
    <section
      ref={sectionRef}
      className="qz-reel"
      style={{ background: BG }}
      aria-roledescription="بكرة"
      aria-label="الفِردِكت"
    >
      <svg aria-hidden="true" focusable="false" className="qz-reel-defs">
        <defs>
          <filter id="qz-reel-blur" x="-5%" y="-25%" width="110%" height="150%">
            <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="0 0" />
          </filter>
        </defs>
      </svg>

      <div
        ref={trackRef}
        className="qz-reel-track"
        style={{
          transform: `translate3d(0, ${TOP_PAD_VH - (reduce ? AUTO_END_IDX : AUTO_START_IDX) * PITCH_VH}dvh, 0)`,
          filter: autoScrolling ? 'url(#qz-reel-blur)' : undefined,
        }}
      >
        {slides.map((r, i) => {
          const isOpen = openKey === r.id && i - BASE >= 0 && i - BASE < N
          return (
            <div
              key={i}
              ref={(el) => {
                slideRefs.current[i] = el
              }}
              className="qz-reel-slot"
              style={autoScrolling ? { opacity: 0 } : undefined}
              aria-hidden={!(i >= BASE && i < BASE + N && i - BASE === activeIdx)}
            >
              <div className="qz-reel-frame" data-open={isOpen ? 'true' : undefined}>
                <div data-slide-image className="qz-reel-img">
                  <ReelImg id={r.youtubeId} eager={i === AUTO_END_IDX} />
                  <i className="qz-reel-vig-a" />
                  <i className="qz-reel-vig-b" />
                </div>
                <div
                  data-slide-content
                  className="qz-reel-layer"
                  style={{ opacity: 0, filter: 'blur(16px)' }}
                >
                  <SlideContent
                    r={r}
                    onExplore={() => setOpenKey(r.id)}
                    onWatch={() => onWatch(r)}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="qz-reel-mask qz-reel-mask-top" />
      <div className="qz-reel-mask qz-reel-mask-bot" />
      {autoScrolling && <div ref={scanRef} aria-hidden="true" className="qz-reel-scan" />}

      <div
        className="qz-reel-ind"
        data-hidden={openKey ? 'true' : undefined}
        aria-hidden={!!openKey}
      >
        <div className="qz-reel-ind-n">{String(activeIdx + 1).padStart(2, '0')}</div>
        <div data-no-drag className="qz-reel-pips">
          {items.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                api.current.goto?.(i)
              }}
              aria-label={`روح لحكم ${r.titleAr || r.title}`}
              aria-current={i === activeIdx ? 'true' : undefined}
            >
              <span data-on={i === activeIdx ? 'true' : undefined} />
            </button>
          ))}
        </div>
        <div className="qz-reel-ind-n qz-reel-ind-total">{String(N).padStart(2, '0')}</div>
      </div>

      <DetailsPanel
        open={!!openKey}
        r={openR}
        onClose={() => setOpenKey(null)}
        onWatch={() => openR && onWatch(openR)}
      />
    </section>
  )
}
