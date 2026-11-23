import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Play } from 'lucide-react'
import { reviews } from '../../data/reviews.js'
import { useCinema } from '../qz/CinemaPlayer.jsx'
import { playGlassTap } from '../../utils/glassSound.js'

/* ══ Cinema Reel — بكرة الفِردِكت السينمائية (cinema-reel.md) ═══════════
   عارض سينمائي رأسي بكامل الشاشة (100dvh) مع:
   - دخول ببكرة فيلم قديم سريعة (3 ثوانٍ power3.out + ضبابية حركة رأسية SVG + خطوط مسح Scanlines)
   - فيزياء التقاط نابضية (Snap Physics: y += (target - y) * 0.11) وتمرير لا نهائي (7 نسخ)
   - بارالاكس صور كسول (1.2x) وحركة محتوى غير متماثلة (Smoothstep للدخول + Parallax-Lead للخروج)
   - مؤشر دائري مخصّص 104px (SCROLL / يد السحب / أسهم المناطق العلوية والسفلية)
   - لوحة تفاصيل جانبية مع ميل الباب ثلاثي الأبعاد (rotateY(15deg)) وتشغيل فيديو المراجعة. */

/* ─── Layout (vh values; rendered as dvh) ────────────────────────── */
const SLIDE_VH = 80
const GAP_VH = 5
const PITCH_VH = SLIDE_VH + GAP_VH // 85
const PAD_X_VH = 7.5
const MASK_VH = 10
const TOP_PAD_VH = (100 - SLIDE_VH) / 2 // 10

/* ─── Input thresholds ────────────────────────────────────────────── */
const WHEEL_PER_EVENT_CAP = 200
const WHEEL_PAUSE_MS = 100
const DRAG_THRESHOLD_VH = 14

/* ─── Spring ──────────────────────────────────────────────────────── */
const EASE = 0.11

/* ─── Content motion ──────────────────────────────────────────────── */
const FADE_THRESHOLD = 0.55
const PARALLAX_FACTOR = 0.42
const ENTRY_OFFSET_PX = 64

/* ─── Image parallax ──────────────────────────────────────────────── */
const IMG_HEIGHT_RATIO = 1.2

/* ─── Loop ────────────────────────────────────────────────────────── */
const LOOP_COPIES = 7
const AUTO_SCROLL_MS = 2600
const AUTO_SCALE_FROM = 1
const AUTO_FADE_MS = 900

/* ─── Cursor ──────────────────────────────────────────────────────── */
const CURSOR_SIZE = 104

/* ─── Image bucket ────────────────────────────────────────────────── */
const IMG_BUCKET_PX = 50
const IMG_MIN_W = 600
const IMG_MIN_H = 500

function computeImgDims() {
  if (typeof window === 'undefined') return { w: 1800, h: 1400 }
  const w = Math.max(IMG_MIN_W, Math.round(window.innerWidth / IMG_BUCKET_PX) * IMG_BUCKET_PX)
  const h = Math.max(
    IMG_MIN_H,
    Math.round((window.innerHeight * IMG_HEIGHT_RATIO) / IMG_BUCKET_PX) * IMG_BUCKET_PX,
  )
  return { w, h }
}

function slideImageUrl(slide, w, h) {
  if (slide.imageId) {
    return `https://images.unsplash.com/photo-${slide.imageId}?w=${w}&h=${h}&fit=crop&q=75&auto=format`
  }
  return `https://i.ytimg.com/vi/${slide.youtubeId}/maxresdefault.jpg`
}

export default function CinemaReel({ filterType = 'الكل', onFilterChange }) {
  const cinema = useCinema()

  const slides = useMemo(() => {
    const filtered =
      filterType === 'الكل' ? reviews : reviews.filter((r) => r.mediaType === filterType)
    const base = filtered.length > 0 ? filtered : reviews
    // ضمان وجود 6 شرائح دائماً لدورة البكرة الكاملة
    const out = []
    while (out.length < 6) {
      for (const item of base) {
        if (out.length < 6) {
          out.push({
            ...item,
            slotKey: `${item.id}-${out.length}`,
          })
        }
      }
    }
    return out
  }, [filterType])

  const N_SLIDES = slides.length
  const INITIAL_IDX = Math.floor(LOOP_COPIES / 2) * N_SLIDES
  const AUTO_START_IDX = INITIAL_IDX + 1
  const AUTO_END_IDX = INITIAL_IDX + 3 * N_SLIDES

  const renderedSlides = useMemo(() => {
    const arr = []
    for (let c = 0; c < LOOP_COPIES; c++) {
      for (let s = 0; s < slides.length; s++) {
        arr.push(slides[s])
      }
    }
    return arr
  }, [slides])

  const [autoScrolling, setAutoScrolling] = useState(true)
  const [activeIdx, setActiveIdx] = useState(((AUTO_START_IDX % N_SLIDES) + N_SLIDES) % N_SLIDES)
  const [openSlideKey, setOpenSlideKey] = useState(null)
  const [imgDims, setImgDims] = useState(computeImgDims)

  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const slideRefs = useRef([])
  const cursorRef = useRef(null)
  const cursorScrollRef = useRef(null)
  const cursorDragRef = useRef(null)
  const cursorUpRef = useRef(null)
  const cursorDownRef = useRef(null)
  const cursorOnUiRef = useRef(false)
  const cursorZoneRef = useRef(null)

  const idxRef = useRef(AUTO_START_IDX)
  const prevIdxRef = useRef(AUTO_START_IDX)
  const yRef = useRef(0)
  const velRef = useRef(0)
  const targetYRef = useRef(0)
  const wheelLastTime = useRef(0)
  const autoScrollingRef = useRef(true)

  const blurFilterRef = useRef(null)
  const scanlinesRef = useRef(null)
  const lastBlurPRef = useRef(0)
  const lastBlurTsRef = useRef(0)

  const dragRef = useRef({
    active: false,
    startClientY: 0,
    startTrackY: 0,
    delta: 0,
    pointerId: 0,
  })
  const onSectionRef = useRef(false)
  const downRef = useRef(false)

  const cursorPos = useRef({ x: 0, y: 0 })
  const cursorRender = useRef({ x: 0, y: 0, scale: 0, opacity: 0 })
  const cursorInitRef = useRef(false)

  const navigateToModRef = useRef(() => {})

  useEffect(() => {
    const onResizeDims = () => setImgDims(computeImgDims())
    window.addEventListener('resize', onResizeDims)
    return () => window.removeEventListener('resize', onResizeDims)
  }, [])

  useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image()
      img.src = slideImageUrl(slide, imgDims.w, imgDims.h)
    })
  }, [slides, imgDims.w, imgDims.h])

  useEffect(() => {
    if (!openSlideKey) return undefined
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpenSlideKey(null)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [openSlideKey])

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return undefined

    setOpenSlideKey(null)
    autoScrollingRef.current = true
    setAutoScrolling(true)
    idxRef.current = AUTO_START_IDX
    prevIdxRef.current = AUTO_START_IDX

    const modN = (i) => ((i % N_SLIDES) + N_SLIDES) % N_SLIDES

    let viewportH = window.innerHeight
    let pitch = (viewportH * PITCH_VH) / 100
    let slideH = (viewportH * SLIDE_VH) / 100
    let dragThresh = (viewportH * DRAG_THRESHOLD_VH) / 100
    let topPad = (viewportH * TOP_PAD_VH) / 100

    const recomputeSizes = () => {
      viewportH = window.innerHeight
      pitch = (viewportH * PITCH_VH) / 100
      slideH = (viewportH * SLIDE_VH) / 100
      dragThresh = (viewportH * DRAG_THRESHOLD_VH) / 100
      topPad = (viewportH * TOP_PAD_VH) / 100
      if (!autoScrollingRef.current) {
        targetYRef.current = topPad - idxRef.current * pitch
        yRef.current = targetYRef.current
      }
    }
    recomputeSizes()

    {
      const initialVPitchVh = SLIDE_VH * AUTO_SCALE_FROM + GAP_VH
      yRef.current =
        ((TOP_PAD_VH - AUTO_START_IDX * initialVPitchVh) * window.innerHeight) / 100
      targetYRef.current = yRef.current
    }

    const maybeWrap = () => {
      while (idxRef.current < N_SLIDES) {
        idxRef.current += N_SLIDES
        prevIdxRef.current += N_SLIDES
        const shift = N_SLIDES * pitch
        yRef.current -= shift
        targetYRef.current -= shift
        if (dragRef.current.active) dragRef.current.startTrackY -= shift
      }
      while (idxRef.current >= (LOOP_COPIES - 1) * N_SLIDES) {
        idxRef.current -= N_SLIDES
        prevIdxRef.current -= N_SLIDES
        const shift = N_SLIDES * pitch
        yRef.current += shift
        targetYRef.current += shift
        if (dragRef.current.active) dragRef.current.startTrackY += shift
      }
    }

    const setIndex = (next) => {
      if (next === idxRef.current) return
      prevIdxRef.current = idxRef.current
      idxRef.current = next
      targetYRef.current = topPad - next * pitch
      setActiveIdx(modN(next))
      maybeWrap()
    }

    navigateToModRef.current = (targetMod) => {
      const currentMod = modN(idxRef.current)
      let diff = targetMod - currentMod
      if (diff > N_SLIDES / 2) diff -= N_SLIDES
      else if (diff < -N_SLIDES / 2) diff += N_SLIDES
      if (diff === 0) return
      setIndex(idxRef.current + diff)
    }

    const tweenObj = { p: 0 }
    const SCROLL_TOTAL_S = AUTO_SCROLL_MS / 1000
    const FADE_S = AUTO_FADE_MS / 1000
    const slideEls = slideRefs.current
    const vhToPx = window.innerHeight / 100

    const onScrollUpdate = () => {
      const p = tweenObj.p
      const scale = AUTO_SCALE_FROM + (1 - AUTO_SCALE_FROM) * p
      const idxF = AUTO_START_IDX + (AUTO_END_IDX - AUTO_START_IDX) * p
      const vpVh = SLIDE_VH * scale + GAP_VH

      yRef.current = (TOP_PAD_VH - idxF * vpVh) * vhToPx
      targetYRef.current = yRef.current

      const deltaVh = SLIDE_VH * (scale - 1)
      const visualPitchPx = vpVh * vhToPx
      for (let i = 0; i < slideEls.length; i++) {
        const el = slideEls[i]
        if (el) {
          el.style.transform = `translate3d(0, ${(i * deltaVh).toFixed(3)}dvh, 0) scale(${scale.toFixed(4)})`
          if (el.__wrap === undefined) {
            el.__wrap = el.querySelector('[data-slide-image]')
          }
          if (el.__wrap) {
            const visualDyPx = (i - idxF) * visualPitchPx
            const wrapY = -visualDyPx / (IMG_HEIGHT_RATIO * scale)
            el.__wrap.style.transform = `translate3d(0, ${wrapY.toFixed(2)}px, 0)`
          }
        }
      }

      const now = performance.now()
      let norm = 1
      if (lastBlurTsRef.current > 0) {
        const dt = Math.max(now - lastBlurTsRef.current, 1)
        const dp = Math.abs(p - lastBlurPRef.current)
        const idxRange = AUTO_END_IDX - AUTO_START_IDX
        const idxSpeed = (dp * idxRange) / dt
        const peakSpeed = (idxRange * 3) / (SCROLL_TOTAL_S * 1000)
        norm = Math.min(idxSpeed / peakSpeed, 1)
      }
      lastBlurPRef.current = p
      lastBlurTsRef.current = now

      if (blurFilterRef.current) {
        blurFilterRef.current.setAttribute('stdDeviation', `0 ${(norm * 18).toFixed(2)}`)
      }
      if (scanlinesRef.current) {
        scanlinesRef.current.style.opacity = norm.toFixed(3)
      }
    }

    let timelineCompletedOnce = false
    const mainTween = gsap.timeline({
      onUpdate: onScrollUpdate,
      onComplete: () => {
        if (timelineCompletedOnce) return
        timelineCompletedOnce = true
        for (let i = 0; i < slideEls.length; i++) {
          const el = slideEls[i]
          if (el) el.style.transform = ''
        }
        if (blurFilterRef.current) {
          blurFilterRef.current.setAttribute('stdDeviation', '0 0')
        }
        autoScrollingRef.current = false
        setAutoScrolling(false)
        idxRef.current = AUTO_END_IDX
        prevIdxRef.current = AUTO_END_IDX
        targetYRef.current = topPad - AUTO_END_IDX * pitch
        yRef.current = targetYRef.current
        setActiveIdx(modN(AUTO_END_IDX))
        maybeWrap()

        const landing = slideRefs.current[idxRef.current]
        if (landing) {
          const reveals = landing.querySelectorAll('[data-reveal]')
          if (reveals.length) {
            gsap.fromTo(
              reveals,
              { autoAlpha: 0, y: 32, filter: 'blur(10px)' },
              {
                autoAlpha: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 1.0,
                ease: 'power4.out',
                stagger: 0.07,
              },
            )
          }
        }
      },
    })

    mainTween.to(
      slideEls.filter(Boolean),
      { autoAlpha: 1, duration: FADE_S, ease: 'power2.out' },
      0,
    )
    mainTween.to(tweenObj, { p: 1, duration: SCROLL_TOTAL_S, ease: 'power3.out' }, 0)

    let raf = 0
    const tick = () => {
      const now = performance.now()
      const isDragging = dragRef.current.active
      const wheelActive = now - wheelLastTime.current < WHEEL_PAUSE_MS
      const isAutoScrolling = autoScrollingRef.current

      if (!isAutoScrolling && !isDragging && !wheelActive) {
        yRef.current += (targetYRef.current - yRef.current) * EASE
      }

      track.style.transform = `translate3d(0, ${yRef.current.toFixed(2)}px, 0)`

      const viewCenter = viewportH / 2
      for (let i = 0; i < slideEls.length; i++) {
        const ref = slideEls[i]
        if (!ref) continue
        const effectiveTop = yRef.current + i * pitch
        const slideCenter = effectiveTop + slideH / 2
        const dy = slideCenter - viewCenter
        const dn = Math.abs(dy) / slideH

        if (dn > 2) {
          const content = ref.querySelector('[data-slide-content]')
          if (content && content.style.opacity !== '0') {
            content.style.opacity = '0'
            content.style.filter = 'blur(16px)'
          }
          continue
        }

        let wrap = ref.__wrap
        if (wrap === undefined) {
          wrap = ref.querySelector('[data-slide-image]')
          ref.__wrap = wrap
        }
        const content = ref.querySelector('[data-slide-content]')
        if (!content) continue

        if (wrap && !isAutoScrolling) {
          const imgY = -dy / IMG_HEIGHT_RATIO
          wrap.style.transform = `translate3d(0, ${imgY.toFixed(2)}px, 0)`
        }

        if (isAutoScrolling) {
          if (content.style.opacity !== '0') {
            content.style.opacity = '0'
            content.style.filter = 'blur(16px)'
          }
          continue
        }

        const isActive = i === idxRef.current
        const isLeaving = i === prevIdxRef.current && prevIdxRef.current !== idxRef.current

        let opacity = 0
        let blur = 16
        let cy = 0

        if (isActive) {
          const t = Math.max(0, Math.min(1, 1 - dn / FADE_THRESHOLD))
          opacity = t * t * (3 - 2 * t)
          blur = (1 - opacity) * 14
          cy = (1 - opacity) * ENTRY_OFFSET_PX * Math.sign(dy || 1)
        } else if (isLeaving) {
          const fade = Math.max(0, 1 - Math.max(0, dn - 0.6) / 0.6)
          opacity = fade
          blur = (1 - fade) * 6
          cy = -dy * PARALLAX_FACTOR
        }

        content.style.transform = `translate3d(0, ${cy.toFixed(2)}px, 0)`
        content.style.opacity = opacity.toFixed(3)
        content.style.filter = `blur(${blur.toFixed(2)}px)`
      }

      const cur = cursorRef.current
      if (cur) {
        const px = cursorPos.current.x
        const py = cursorPos.current.y
        if (!cursorInitRef.current && (px !== 0 || py !== 0)) {
          cursorRender.current.x = px
          cursorRender.current.y = py
          cursorInitRef.current = true
        }
        cursorRender.current.x += (px - cursorRender.current.x) * 0.22
        cursorRender.current.y += (py - cursorRender.current.y) * 0.22
        const targetOpacity = onSectionRef.current && cursorInitRef.current ? 1 : 0
        cursorRender.current.opacity += (targetOpacity - cursorRender.current.opacity) * 0.18
        const targetScale = downRef.current ? 1.18 : 1
        cursorRender.current.scale += (targetScale - cursorRender.current.scale) * 0.22

        cur.style.transform =
          `translate3d(${cursorRender.current.x}px, ${cursorRender.current.y}px, 0) ` +
          `translate(-50%, -50%) ` +
          `scale(${cursorRender.current.scale.toFixed(3)})`
        cur.style.opacity = cursorRender.current.opacity.toFixed(3)

        const zone = cursorZoneRef.current
        const isDown = downRef.current
        const onUi = cursorOnUiRef.current
        if (cursorScrollRef.current)
          cursorScrollRef.current.style.opacity = zone === null && !isDown && !onUi ? '1' : '0'
        if (cursorDragRef.current)
          cursorDragRef.current.style.opacity = isDown && zone === null ? '1' : '0'
        if (cursorUpRef.current)
          cursorUpRef.current.style.opacity =
            zone === 'top' || (isDown && zone === null) ? '1' : '0'
        if (cursorDownRef.current)
          cursorDownRef.current.style.opacity =
            zone === 'bottom' || (isDown && zone === null) ? '1' : '0'
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onWheel = (e) => {
      if (!onSectionRef.current) return
      const target = e.target
      if (target?.closest?.('[data-no-drag]')) return

      e.preventDefault()
      const delta = Math.max(-WHEEL_PER_EVENT_CAP, Math.min(WHEEL_PER_EVENT_CAP, e.deltaY))
      yRef.current -= delta
      wheelLastTime.current = performance.now()

      const idealFloat = (topPad - yRef.current) / pitch
      const nearest = Math.round(idealFloat)
      if (nearest !== idxRef.current) {
        setIndex(nearest)
      }
    }

    const onPointerDown = (e) => {
      if (!onSectionRef.current) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const target = e.target
      if (target?.closest?.('[data-no-drag]')) return
      wheelLastTime.current = 0
      dragRef.current.active = true
      dragRef.current.startClientY = e.clientY
      dragRef.current.startTrackY = yRef.current
      dragRef.current.delta = 0
      dragRef.current.pointerId = e.pointerId
      downRef.current = true
      try {
        section.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }

    const onPointerMove = (e) => {
      cursorPos.current.x = e.clientX
      cursorPos.current.y = e.clientY
      const topThreshold = (window.innerHeight * MASK_VH) / 100
      const bottomThreshold = window.innerHeight - (window.innerHeight * MASK_VH) / 100
      if (e.clientY < topThreshold) cursorZoneRef.current = 'top'
      else if (e.clientY > bottomThreshold) cursorZoneRef.current = 'bottom'
      else cursorZoneRef.current = null
      cursorOnUiRef.current = Boolean(e.target?.closest?.('[data-no-drag]'))

      if (!dragRef.current.active) return
      const delta = e.clientY - dragRef.current.startClientY
      dragRef.current.delta = delta
      yRef.current = dragRef.current.startTrackY + delta
      velRef.current = 0
    }

    const endDrag = (committed) => {
      const delta = dragRef.current.delta
      const zone = cursorZoneRef.current
      dragRef.current.active = false
      downRef.current = false
      if (!committed) return

      if (zone && Math.abs(delta) < 8) {
        const next = idxRef.current + (zone === 'top' ? -1 : 1)
        setOpenSlideKey(null)
        setIndex(next)
        return
      }
      if (Math.abs(delta) > dragThresh) {
        const next = idxRef.current + (delta < 0 ? 1 : -1)
        setIndex(next)
      }
    }

    const onPointerUp = () => {
      if (!dragRef.current.active) return
      try {
        section.releasePointerCapture(dragRef.current.pointerId)
      } catch {
        // ignore
      }
      endDrag(true)
    }

    const onPointerCancel = () => {
      dragRef.current.delta = 0
      yRef.current = dragRef.current.startTrackY
      endDrag(false)
    }

    const onEnter = () => {
      onSectionRef.current = true
    }
    const onLeave = () => {
      onSectionRef.current = false
      if (dragRef.current.active) endDrag(true)
    }
    const onResize = () => recomputeSizes()
    const onKey = (e) => {
      if (!onSectionRef.current) return
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        setIndex(idxRef.current + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        setIndex(idxRef.current - 1)
      }
    }

    section.addEventListener('wheel', onWheel, { passive: false })
    section.addEventListener('pointerdown', onPointerDown)
    section.addEventListener('pointermove', onPointerMove)
    section.addEventListener('pointerup', onPointerUp)
    section.addEventListener('pointercancel', onPointerCancel)
    section.addEventListener('pointerenter', onEnter)
    section.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      mainTween.kill()
      section.removeEventListener('wheel', onWheel)
      section.removeEventListener('pointerdown', onPointerDown)
      section.removeEventListener('pointermove', onPointerMove)
      section.removeEventListener('pointerup', onPointerUp)
      section.removeEventListener('pointercancel', onPointerCancel)
      section.removeEventListener('pointerenter', onEnter)
      section.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
    }
  }, [N_SLIDES, AUTO_START_IDX, AUTO_END_IDX, filterType])

  const openSlide = useMemo(
    () => slides.find((s) => s.slotKey === openSlideKey) ?? slides[activeIdx] ?? slides[0],
    [slides, openSlideKey, activeIdx],
  )

  const handlePlayTrailer = (slide) => {
    if (!slide || !cinema) return
    playGlassTap()
    cinema.open({
      youtubeId: slide.youtubeId,
      title: slide.titleAr || slide.title,
      category: `الفِردِكت · ${slide.mediaType}`,
      summary: slide.verdict,
    })
  }

  return (
    <section
      ref={sectionRef}
      dir="ltr"
      className="relative h-[100dvh] w-full overflow-hidden select-none [--cinema-pad-x:7.5dvh] max-sm:[--cinema-pad-x:2dvh]"
      style={{ background: 'var(--qz-ink, #0a0908)', cursor: 'none' }}
    >
      {/* فلتر ضبابية الحركة الرأسية أثناء دخول البكرة */}
      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute"
        style={{ width: 0, height: 0, position: 'absolute' }}
      >
        <defs>
          <filter id="cinema-motion-blur" x="-5%" y="-25%" width="110%" height="150%">
            <feGaussianBlur ref={blurFilterRef} in="SourceGraphic" stdDeviation="0 0" />
          </filter>
        </defs>
      </svg>

      {/* شريط الفلترة العائم (أفلام / مسلسلات / الكل) */}
      <div
        data-no-drag
        dir="rtl"
        className="absolute bottom-[3.2dvh] left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-black/55 p-1.5 backdrop-blur-xl"
      >
        {[
          { value: 'الكل', label: 'كل البكرات' },
          { value: 'فيلم', label: 'حُكم السينما' },
          { value: 'مسلسل', label: 'حُكم المسلسلات' },
        ].map((tab) => {
          const isAct = filterType === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                playGlassTap()
                onFilterChange?.(tab.value)
              }}
              style={{ cursor: 'pointer' }}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition duration-200 ${
                isAct
                  ? 'bg-[#f6efe2] text-[#0a0908]'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* مسار الشرائح (42 إطاراً للتمرير اللانهائي) */}
      <div
        ref={trackRef}
        className="absolute inset-x-0 top-0 will-change-transform"
        style={{
          touchAction: 'none',
          paddingLeft: 'var(--cinema-pad-x)',
          paddingRight: 'var(--cinema-pad-x)',
          transform: `translate3d(0, ${
            TOP_PAD_VH - AUTO_START_IDX * (SLIDE_VH * AUTO_SCALE_FROM + GAP_VH)
          }dvh, 0)`,
          filter: autoScrolling ? 'url(#cinema-motion-blur)' : undefined,
        }}
      >
        {renderedSlides.map((slide, i) => (
          <SlideFrame
            key={`${slide.slotKey}-${i}`}
            slide={slide}
            isFirst={i === AUTO_END_IDX}
            imgDims={imgDims}
            slotIndex={i}
            autoScrolling={autoScrolling}
            isOpen={openSlideKey === slide.slotKey && i === idxRef.current}
            onExplore={() => {
              playGlassTap()
              setOpenSlideKey(slide.slotKey)
            }}
            onPlay={() => handlePlayTrailer(slide)}
            assignRef={(el) => {
              slideRefs.current[i] = el
            }}
          />
        ))}
      </div>

      {/* أقنعة التلاشي العلوية والسفلية (10dvh) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30"
        style={{
          height: `${MASK_VH}dvh`,
          background: 'linear-gradient(180deg, var(--qz-ink, #0a0908) 0%, rgba(10,9,8,0) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30"
        style={{
          height: `${MASK_VH}dvh`,
          background: 'linear-gradient(0deg, var(--qz-ink, #0a0908) 0%, rgba(10,9,8,0) 100%)',
        }}
      />

      {/* خطوط مسح جهاز العرض السينمائي أثناء الدخول السريع */}
      {autoScrolling && (
        <div
          ref={scanlinesRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'screen',
            opacity: 1,
          }}
        />
      )}

      {/* مؤشر البكرات على الحافة اليمنى */}
      <ReelIndicator
        activeIdx={activeIdx}
        total={N_SLIDES}
        onPipClick={(target) => navigateToModRef.current(target)}
        hidden={openSlideKey != null}
      />

      {/* لوحة تفاصيل المراجعة مع ميل الباب 15 درجة */}
      <DetailsPanel
        open={openSlideKey != null}
        slide={openSlide}
        imgDims={imgDims}
        onClose={() => setOpenSlideKey(null)}
        onPlay={() => handlePlayTrailer(openSlide)}
      />

      {/* المؤشر الدائري المخصّص 104px */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 z-50 max-sm:hidden"
        style={{
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      >
        <div className="relative h-full w-full">
          <div className="absolute inset-0 rounded-full border border-white/45" />
          <div
            ref={cursorScrollRef}
            className="absolute inset-0 flex flex-col items-center justify-center gap-0.5"
            style={{ transition: 'opacity 180ms ease' }}
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-white">
              SCROLL
            </span>
            <span className="text-[9px] font-bold text-white/70">اسحب</span>
          </div>
          <div
            ref={cursorDragRef}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: 0, transition: 'opacity 160ms ease' }}
          >
            <GrabHand />
          </div>
          <div
            ref={cursorUpRef}
            className="absolute"
            style={{
              bottom: 'calc(100% + 12px)',
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: 0,
              transition: 'opacity 160ms ease',
            }}
          >
            <ChevronGlyph />
          </div>
          <div
            ref={cursorDownRef}
            className="absolute"
            style={{
              top: 'calc(100% + 12px)',
              left: '50%',
              transform: 'translateX(-50%) rotate(180deg)',
              opacity: 0,
              transition: 'opacity 160ms ease',
            }}
          >
            <ChevronGlyph />
          </div>
        </div>
      </div>
    </section>
  )
}

function SlideFrame({
  slide,
  isFirst,
  imgDims,
  slotIndex,
  autoScrolling,
  isOpen,
  onExplore,
  onPlay,
  assignRef,
}) {
  const initialTranslate = slotIndex * SLIDE_VH * (AUTO_SCALE_FROM - 1)
  const initialStyle = autoScrolling
    ? {
        transform: `translate3d(0, ${initialTranslate}dvh, 0) scale(${AUTO_SCALE_FROM})`,
        transformOrigin: '50% 50%',
        opacity: 0,
      }
    : undefined

  return (
    <div
      ref={assignRef}
      className="relative w-full"
      style={{
        height: `${SLIDE_VH}dvh`,
        marginBottom: `${GAP_VH}dvh`,
        perspective: '2000px',
        ...initialStyle,
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden border border-white/10"
        style={{
          borderRadius: '48px',
          transformOrigin: '0% 50%',
          transformStyle: 'preserve-3d',
          transform: isOpen ? 'rotateY(15deg)' : undefined,
          transition:
            'transform 700ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: isOpen
            ? '0 30px 80px -20px rgba(0,0,0,0.55), 0 8px 30px -10px rgba(0,0,0,0.35)'
            : undefined,
        }}
      >
        <div
          data-slide-image
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: `${IMG_HEIGHT_RATIO * 100}dvh`,
            marginTop: `${-IMG_HEIGHT_RATIO * 50}dvh`,
            marginLeft: '-50vw',
            willChange: 'transform',
          }}
        >
          <img
            src={slideImageUrl(slide, imgDims.w, imgDims.h)}
            alt={slide.titleAr || slide.title}
            loading="eager"
            decoding="async"
            fetchPriority={isFirst ? 'high' : 'auto'}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.12) 26%, rgba(0,0,0,0.12) 66%, rgba(0,0,0,0.68) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(80% 70% at 50% 50%, transparent 38%, rgba(0,0,0,0.52) 100%)',
            }}
          />
        </div>

        <div
          data-slide-content
          className="absolute inset-0 will-change-[opacity,filter,transform]"
          style={{ opacity: 0, filter: 'blur(16px)' }}
        >
          <SlideContent slide={slide} onExplore={onExplore} onPlay={onPlay} />
        </div>
      </div>
    </div>
  )
}

function LaurelSvg({ flip = false }) {
  return (
    <svg
      width="28"
      height="44"
      viewBox="0 0 28 44"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        marginRight: flip ? 0 : -6,
        marginLeft: flip ? -6 : 0,
        opacity: 0.85,
      }}
    >
      <path
        d="M22 39C12 34 7 25 7 13C7 8 9 4 13 2M7 25C11 23 14 23 17 25M8 17C12 15 15 15 18 17M11 10C14 8 17 8 19 10"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SlideContent({ slide, onExplore, onPlay }) {
  const words = (slide.eyebrow || '').split(' ')
  const lines = slide.titleLines || [slide.titleAr || slide.title, slide.title]

  return (
    <div className="relative h-full w-full p-[5.5dvh_6dvh] text-white max-sm:p-[3dvh]">
      {/* A. TOP-LEFT — year + festival eyebrow + award badge */}
      <div
        className="absolute left-[6dvh] top-[5.5dvh] flex flex-col gap-3 max-sm:left-[3dvh] max-sm:top-[3dvh] max-sm:gap-2"
        data-reveal
      >
        <div className="flex items-center gap-3">
          <span
            className="font-[family-name:var(--font-display)] text-[clamp(1.2rem,2.2dvh,2.4rem)] leading-none text-white/90"
            style={{ fontStyle: 'italic' }}
          >
            {slide.year}
          </span>
          <span className="rounded-full border border-white/25 bg-black/45 px-3 py-1 text-xs font-bold text-[#f1e7d2] backdrop-blur-md">
            ★ {slide.rating} / 10 · {slide.mediaType}
          </span>
        </div>

        <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/65 max-sm:text-[8.5px] max-sm:tracking-[0.24em]">
          {words.map((word, i, arr) => (
            <span key={i}>
              {word}
              {i === Math.floor(arr.length / 2) - 1 ? <br /> : i < arr.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>

        <div className="mt-2 inline-flex items-center gap-1 max-sm:hidden">
          <LaurelSvg />
          <div className="flex flex-col items-center gap-1 px-2">
            <span className="font-[family-name:var(--font-display)] text-[10px] font-bold tracking-wide text-white/90">
              حُكم الفِردِكت · Award Reel
            </span>
            <div className="flex gap-[2px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="9" height="9" viewBox="0 0 24 24" aria-hidden="true">
                  <polygon
                    points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                    className="fill-white/75"
                  />
                </svg>
              ))}
            </div>
          </div>
          <LaurelSvg flip />
        </div>
      </div>

      {/* B. CENTER-LEFT — category eyebrow + title + dir/cat row */}
      <div
        className="absolute left-[6dvh] flex flex-col gap-4 max-sm:left-[3dvh] max-sm:gap-2.5"
        style={{ bottom: '9dvh' }}
        data-reveal
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65 max-sm:text-[9px]">
          {slide.category}
        </div>

        <h2
          dir="rtl"
          className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,7.2dvh,7.6rem)] font-black uppercase max-sm:text-[clamp(1.6rem,5dvh,2.5rem)]"
          style={{ lineHeight: '1.02', letterSpacing: '-0.02em', color: '#f6efe2' }}
        >
          {lines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h2>

        <p
          dir="rtl"
          className="max-w-lg font-[family-name:var(--font-text)] text-sm leading-7 text-white/85 max-sm:text-xs"
        >
          {slide.verdict}
        </p>

        <div className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.28em] text-white/70 max-sm:text-[8.5px]">
          <div className="flex items-baseline gap-3">
            <span className="text-white/45">DIRECTOR</span>
            <span className="text-white/90">{slide.director}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-white/45">VERDICT</span>
            <span className="text-[#f1e7d2]">{slide.rating} / 10</span>
          </div>
        </div>
      </div>

      {/* C. RIGHT — award stack (desktop) */}
      <div
        className="absolute right-[6dvh] top-1/2 flex flex-col max-sm:hidden"
        style={{ transform: 'translateY(-50%)' }}
      >
        <div className="flex flex-col gap-6" data-reveal>
          {(slide.awards ?? []).map((a, i) => (
            <div key={i} className="flex flex-col items-end gap-1.5 text-right" dir="rtl">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <span
                    key={s}
                    className="text-[12px]"
                    style={{ color: s < a.stars ? '#f1e7d2' : 'rgba(255,255,255,0.18)' }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="text-[10px] font-bold tracking-wider text-white/60">{a.label}</div>
              <div
                className="font-[family-name:var(--font-display)] text-[15px] font-bold leading-snug text-white/95"
                style={{ maxWidth: '20ch' }}
              >
                «{a.quote}»
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* D. EXPLORE + PLAY buttons (bottom-right) */}
      <div
        data-no-drag
        data-reveal
        className="absolute bottom-[5dvh] right-[6dvh] flex items-center gap-3 max-sm:bottom-[3dvh] max-sm:right-[3dvh]"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPlay()
          }}
          style={{ cursor: 'pointer' }}
          aria-label="تشغيل المراجعة"
          className="grid size-12 place-items-center rounded-full border border-white/35 bg-black/45 text-white backdrop-blur-md transition duration-300 hover:scale-105 hover:border-white/85 hover:bg-white/20"
        >
          <Play className="size-4 fill-current" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="group relative flex items-center gap-3.5 overflow-hidden rounded-full border border-white/35 bg-white/[0.06] px-7 py-3.5 text-[12px] font-bold tracking-[0.14em] text-white/95 backdrop-blur-md transition-[background-color,border-color,transform,box-shadow] duration-300 ease-out hover:scale-[1.04] hover:border-white/85 hover:bg-white/[0.16] hover:shadow-[0_10px_30px_rgba(0,0,0,0.45)] max-sm:px-5 max-sm:py-2.5 max-sm:text-[11px]"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            onExplore()
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full rounded-full bg-gradient-to-r from-white/[0.02] via-white/15 to-white/[0.02] transition-transform duration-500 ease-out group-hover:translate-x-0"
          />
          <span className="relative">استكشف الحُكم · EXPLORE</span>
          <span
            aria-hidden="true"
            className="relative text-[15px] leading-none transition-transform duration-300 ease-out group-hover:translate-x-1.5"
          >
            →
          </span>
        </button>
      </div>
    </div>
  )
}

function ReelIndicator({ activeIdx, total, onPipClick, hidden }) {
  return (
    <div
      className={`absolute right-[3.5dvh] top-1/2 z-40 flex flex-col items-end gap-3 transition-opacity duration-400 ease-out ${
        hidden ? 'pointer-events-none opacity-0' : 'pointer-events-none opacity-100'
      }`}
      style={{ transform: 'translateY(-50%)' }}
      aria-hidden={hidden}
    >
      <div className="qz-num text-[12px] italic text-white/60">
        {String(activeIdx + 1).padStart(2, '0')}
      </div>

      <div data-no-drag className="pointer-events-auto flex flex-col items-center">
        {Array.from({ length: total }).map((_, i) => {
          const active = i === activeIdx
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPipClick(i)
              }}
              aria-label={`الانتقال إلى الشريحة ${i + 1}`}
              className="flex h-5 w-5 items-center justify-center"
              style={{ cursor: 'pointer' }}
            >
              <span
                className="rounded-full"
                style={{
                  width: active ? 6 : 4,
                  height: active ? 6 : 4,
                  background: active ? 'rgba(241,231,210,0.95)' : 'rgba(255,255,255,0.22)',
                  transition: 'all 320ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </button>
          )
        })}
      </div>

      <div className="qz-num text-[12px] italic text-white/35">
        {String(total).padStart(2, '0')}
      </div>
    </div>
  )
}

function Stat({ label, value, suffix }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[9.5px] font-medium uppercase tracking-[0.26em] text-white/45">
        {label}
      </div>
      <div className="qz-num font-[family-name:var(--font-display)] text-[19px] font-bold leading-none text-white/95">
        {value}
        {suffix && <span className="ml-0.5 text-[11px] text-white/55">{suffix}</span>}
      </div>
    </div>
  )
}

function DetailsPanel({ open, slide, imgDims, onClose, onPlay }) {
  const lines = slide?.titleLines || [slide?.titleAr || slide?.title]
  const stats = slide?.stats || {
    critics: 92,
    audience: 90,
    runtime: '2h 10m',
    format: 'DIGITAL 4K',
    country: 'USA',
    language: 'ENGLISH',
    aspect: '2.39:1',
  }

  return (
    <>
      <div
        data-no-drag
        aria-hidden={!open}
        onClick={onClose}
        className={`absolute z-40 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          top: `${TOP_PAD_VH}dvh`,
          height: `${SLIDE_VH}dvh`,
          left: 'var(--cinema-pad-x)',
          right: 'var(--cinema-pad-x)',
          borderRadius: '48px',
          overflow: 'hidden',
          backgroundColor: open ? 'rgba(10,9,8,0.38)' : 'rgba(10,9,8,0)',
          backdropFilter: open ? 'blur(14px) saturate(120%)' : 'blur(0px)',
          WebkitBackdropFilter: open ? 'blur(14px) saturate(120%)' : 'blur(0px)',
          transition:
            'background-color 600ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 600ms cubic-bezier(0.22, 1, 0.36, 1), -webkit-backdrop-filter 600ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />

      <aside
        data-no-drag
        aria-hidden={!open}
        dir="rtl"
        className="absolute z-50 flex w-[min(640px,52%)] flex-col text-white max-sm:w-[calc(100vw-2*var(--cinema-pad-x))]"
        style={{
          top: `${TOP_PAD_VH}dvh`,
          height: `${SLIDE_VH}dvh`,
          right: 'var(--cinema-pad-x)',
          borderRadius: '48px',
          overflow: 'hidden',
          transform: open
            ? 'translateX(0)'
            : 'translateX(calc(100% + var(--cinema-pad-x) + 2dvh))',
          transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          background:
            'linear-gradient(180deg, rgba(18,16,14,0.9) 0%, rgba(10,9,8,0.96) 100%)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: open ? '-30px 0 80px -20px rgba(0,0,0,0.65)' : 'none',
          willChange: 'transform',
        }}
      >
        {slide && (
          <>
            <div
              className="h-full w-full overflow-y-auto"
              style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
            >
              <div
                className="relative w-full overflow-hidden"
                style={{ height: '34dvh', flexShrink: 0 }}
              >
                <img
                  src={slideImageUrl(slide, imgDims.w, Math.round(imgDims.h * 0.6))}
                  alt={slide.titleAr || slide.title}
                  draggable={false}
                  className="absolute inset-0 h-full w-full"
                  style={{ objectFit: 'cover' }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(10,9,8,0.15) 0%, rgba(10,9,8,0.95) 100%)',
                  }}
                />
                <button
                  type="button"
                  onClick={onPlay}
                  style={{ cursor: 'pointer' }}
                  className="absolute bottom-4 right-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white hover:text-black"
                >
                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                  <span>شاهد فيديو المراجعة</span>
                </button>
              </div>

              <div className="px-[3.5dvh] pb-[4dvh] pt-[1.5dvh]">
                <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/55">
                  {slide.eyebrow}
                </div>

                <h2
                  className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,4.2dvh,3.6rem)] font-black"
                  style={{
                    lineHeight: 1.05,
                    letterSpacing: '-0.015em',
                    color: '#f6efe2',
                  }}
                >
                  {lines.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </h2>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/75">
                  <span>
                    <span className="text-white/45">المخرج</span>{' '}
                    <span className="text-white/95">{slide.director}</span>
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/95">{slide.year}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-[#f1e7d2]">الفِردِكت {slide.rating}/10</span>
                </div>

                <div className="my-5 h-px w-full bg-white/10" />

                <p className="font-[family-name:var(--font-text)] text-[15.5px] leading-[1.85] text-white/90">
                  {slide.description || slide.verdict}
                </p>

                <div className="my-5 h-px w-full bg-white/10" />

                <div className="grid grid-cols-3 gap-x-5 gap-y-5">
                  <Stat label="تقييم النقاد" value={`${stats.critics}`} suffix="%" />
                  <Stat label="الجمهور" value={`${stats.audience}`} suffix="%" />
                  <Stat label="المدة" value={stats.runtime} />
                  <Stat label="الخام / الصيغة" value={stats.format} />
                  <Stat label="أبعاد الكادر" value={stats.aspect} />
                  <Stat label="اللغة" value={stats.language} />
                </div>
                <div className="mt-5 grid grid-cols-1">
                  <Stat label="بلد الإنتاج" value={stats.country} />
                </div>

                <div className="my-5 h-px w-full bg-white/10" />

                <div className="flex flex-col gap-3">
                  {(slide.awards ?? []).map((a, i) => (
                    <div key={i} className="flex items-baseline gap-3">
                      <div className="flex shrink-0 items-center gap-[2px]">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <span
                            key={s}
                            className="text-[11px]"
                            style={{
                              color: s < a.stars ? '#f1e7d2' : 'rgba(255,255,255,0.18)',
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <div className="shrink-0 text-[10px] font-bold tracking-wider text-white/55">
                        {a.label}
                      </div>
                      <div className="flex-1 font-[family-name:var(--font-display)] text-[13.5px] font-bold leading-tight text-white/90">
                        «{a.quote}»
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق التفاصيل"
              className="absolute right-[3dvh] top-[3dvh] z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white/85 backdrop-blur-md transition-colors hover:bg-black/70"
              style={{ cursor: 'pointer' }}
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

function GrabHand() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 11V7.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M10 11V6.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M13 11V7a1.5 1.5 0 0 1 3 0v6" />
      <path d="M16 9.5a1.5 1.5 0 0 1 3 0V15c0 3-2.2 6-6 6-3.4 0-5.5-1.8-6.5-3.5l-2.7-4.7a1.4 1.4 0 0 1 2.4-1.4L8 13" />
    </svg>
  )
}

function ChevronGlyph() {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true">
      <path
        d="M2 12 C 7 4, 15 4, 20 12"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
