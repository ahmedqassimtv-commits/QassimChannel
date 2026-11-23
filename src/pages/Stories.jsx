import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpLeft } from 'lucide-react'
import { stories } from '../data/stories.js'
import structuredTokens from '../design-systems/structured/tokens.json'
import { assetUrl } from '../utils/assets.js'
import { playGlassTap } from '../utils/glassSound.js'

/* ══ قسم الحكايات — Structured: Renaissance Gallery on Putty Paper (DESIGN 8) ══
   معرض أرشيفي مستلهم بالكامل من نظام التصميم المرفق (src/design-systems/structured/):
   - قاعة افتتاحية بلون Putty (#c4c3b6) مع كلمة عرض ضخمة مقصوصة على حواف الشاشة (374px scale)
   - لوحة زيتية كلاسيكية بعرض الشاشة تتوسطها بطاقة داكنة مقصوصة الزوايا (Notched Showcase Card)
   - قاعة Ink Room سوداء (#000000) بشبكة ثلاثية من القصّات الدائرية والمؤشرات السداسية
   - غرفة القراءة الكاملة على بطاقات Bone (#e7e5e4) وحدود Vellum (#dfdcd5)
   - بطاقة عيّنة نظام التصميم وتذييل Chalk (#ebebeb) يربط بأقسام منصة قاسمز. */

const PAINTING_LANDSCAPE = assetUrl('/images/stories/renaissance-landscape.jpg')
const PAINTING_AMPHORA = assetUrl('/images/stories/still-life-amphora.jpg')
const PAINTING_HOURGLASS = assetUrl('/images/stories/still-life-hourglass.jpg')

const CURATORIAL_VIGNETTES = [
  {
    id: 'memory',
    title: 'ذاكرة المكان',
    latin: 'ARCHITECTURAL MEMORY',
    image: PAINTING_LANDSCAPE,
    objectPosition: '18% 45%',
    short: 'كل شارع قديم وواجهة حجرية يحفظ إيقاع المدينة قبل أن تغيّرها السرعة.',
    detail:
      'نوثّق في هذه القاعة تحوّلات المدن العربية منذ مطلع الثلاثينيات: الترام الأول، أرصفة الموانئ، والمقاهي التي صنعت ملامح الذاكرة اليومية.',
    linkedStoryIndex: 0,
  },
  {
    id: 'manuscript',
    title: 'مخطوطة الأرشيف',
    latin: 'ARCHIVAL FOLIO',
    image: PAINTING_AMPHORA,
    objectPosition: '50% 50%',
    short: 'الصورة المطبوعة على الورق المعتّق تمنح التفاصيل العابرة خلود اللوحة.',
    detail:
      'كل فصل هنا يجمع بين الكادر الفوتوغرافي الأصلي والنص الميداني المرافق له، ليُقرأ بتأنٍّ كما تُقرأ اللوحات التفسيرية على جدران المتاحف.',
    linkedStoryIndex: 2,
  },
  {
    id: 'tempo',
    title: 'إيقاع الزمن',
    latin: 'CADENCE OF TIME',
    image: PAINTING_HOURGLASS,
    objectPosition: '50% 50%',
    short: 'الضوء عند الفجر والغروب هو الخيط الذي يربط بين أربعين عاماً من الحكايات.',
    detail:
      'من ضباب الإسكندرية الشتوي إلى أشرعة الفلوكة في أسوان، نتابع كيف تحفظ العدسة لحظة واحدة فتتحول بعد عقود إلى شهادة تاريخية حيّة.',
    linkedStoryIndex: 3,
  },
]

const COLOR_LABELS_AR = {
  putty: 'أرضية المعرض',
  ink: 'الحبر والغرفة الداكنة',
  bone: 'بطاقات القراءة',
  chalk: 'تذييل المعرض',
  vellum: 'حافة الورق',
  graphite: 'النص الثانوي',
  ash: 'إطار الصور',
  paper: 'النص العكسي',
}

function HexIndicator({ active = false, light = false, size = 12 }) {
  const stroke = light ? '#ffffff' : '#000000'
  const fill = active ? stroke : 'transparent'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <polygon
        points="7,1 12.5,4 12.5,10 7,13 1.5,10 1.5,4"
        stroke={stroke}
        strokeWidth="1.2"
        fill={fill}
      />
    </svg>
  )
}

function scrollToRef(ref) {
  const el = ref?.current
  if (!el) return
  const lenis = window.__qzLenis
  if (lenis && typeof lenis.scrollTo === 'function') {
    lenis.scrollTo(el, { offset: -20, duration: 1.1 })
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default function Stories() {
  const reduce = useReducedMotion()
  const paintingRef = useRef(null)
  const archiveRef = useRef(null)

  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [activeVignette, setActiveVignette] = useState(0)
  const [selectedStoryIdx, setSelectedStoryIdx] = useState(0)

  const featuredStory = stories[featuredIndex] || stories[0]
  const currentStory = stories[selectedStoryIdx] || stories[0]
  const currentVignette = CURATORIAL_VIGNETTES[activeVignette] || CURATORIAL_VIGNETTES[0]

  const paletteSwatches = useMemo(
    () =>
      Object.entries(structuredTokens.color || {}).map(([key, token]) => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: token.$value,
        roleAr: COLOR_LABELS_AR[key] || key,
      })),
    [],
  )

  const selectStoryAndScroll = (idx) => {
    playGlassTap()
    setSelectedStoryIdx(idx)
    setFeaturedIndex(idx)
    requestAnimationFrame(() => scrollToRef(archiveRef))
  }

  const cycleFeatured = (delta) => {
    playGlassTap()
    setFeaturedIndex((prev) => (prev + delta + stories.length) % stories.length)
  }

  const cycleSelected = (delta) => {
    playGlassTap()
    setSelectedStoryIdx((prev) => (prev + delta + stories.length) % stories.length)
  }

  return (
    <div className="qz-stories-structured" dir="rtl">
      {/* ═══════════════════════════════════════════════════════════════
          ١. القاعة الافتتاحية (Hero Wordmark Section — Putty #c4c3b6)
         ═══════════════════════════════════════════════════════════════ */}
      <section className="qz-st-hero" data-structured-surface="putty" aria-label="افتتاحية معرض الحكايات">
        {/* Minimal Gallery Header Bar (Logo Mark + Ghost Text Link) */}
        <div className="qz-st-minimal-bar">
          <div className="qz-st-monogram-wrap">
            <span className="qz-st-monogram" aria-hidden="true">
              S
            </span>
            <span className="qz-st-micro-meta qz-st-grotesk-latin">
              QASSIMZ ARCHIVE · FOLIO VIII
            </span>
          </div>

          <button
            type="button"
            className="qz-st-ghost-link"
            onClick={() => {
              playGlassTap()
              scrollToRef(archiveRef)
            }}
          >
            <span>فهرس الفصول الأربعة</span>
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Centered Editorial Cluster */}
        <motion.div
          className="qz-st-hero-cluster"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="qz-st-hero-subhead">حِكاياتٌ على وَرقِ الزَّمن</h1>
          <p className="qz-st-hero-subhead-latin qz-st-latin">
            REAL MEMORY <em>on</em> PUTTY PAPER
          </p>

          {/* Stat Pair — 16px weight 500, 28px gap, zero borders */}
          <div className="qz-st-stat-row" aria-label="إحصائيات المعرض">
            <div className="qz-st-stat-item">
              <span className="qz-st-stat-key">الفصول:</span>
              <span className="qz-num">0{stories.length} حكايات</span>
            </div>
            <div className="qz-st-stat-item">
              <span className="qz-st-stat-key">الحقبة:</span>
              <span className="qz-num">1932 — 1976</span>
            </div>
            <div className="qz-st-stat-item">
              <span className="qz-st-stat-key">النسخة:</span>
              <span className="qz-st-grotesk-latin text-xs">RENAISSANCE GALLERY</span>
            </div>
          </div>

          {/* Primary Pill Action Button — #000000, 9px 17px, 28.8px radius */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              className="qz-st-pill-btn"
              onClick={() => {
                playGlassTap()
                scrollToRef(paintingRef)
              }}
            >
              <span>ادخل المعرض</span>
              <ArrowDown className="size-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="qz-st-ghost-link"
              onClick={() => selectStoryAndScroll(0)}
            >
              <span>اقرأ الفصل الأول</span>
              <ArrowUpLeft className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        {/* Monumental Edge-Cropped Hero Wordmark (374px scale) */}
        <div className="qz-st-wordmark-stage">
          <div className="qz-st-wordmark-ar" aria-hidden="true">
            الحِكايات
          </div>
          <div className="qz-st-wordmark-edge">
            <span>قاعة المعرض الأولى · ذاكرة المدن والعدسة</span>
            <span className="qz-st-grotesk-latin">PUTTY CANVAS · #C4C3B6</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ٢. لوحة الزيت الكلاسيكية + البطاقة المقصوصة (Classical Painting Panel)
         ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={paintingRef}
        className="qz-st-painting-section"
        data-structured-surface="ink"
        aria-label="اللوحة الكلاسيكية والفصل المختار"
      >
        <img
          src={PAINTING_LANDSCAPE}
          alt="لوحة زيتية كلاسيكية لأقواس حجرية وجبال وسحب"
          data-no-tint="true"
          className="qz-st-painting-bg"
          loading="eager"
        />

        {/* Floating Notched Showcase Card — #000000 with hexagonal corner cuts */}
        <div className="qz-st-notched-card">
          <div className="qz-st-notched-top">
            <span className="qz-num">
              {String(featuredIndex + 1).padStart(2, '0')} / {String(stories.length).padStart(2, '0')}
            </span>
            <span>{featuredStory.location}</span>
            <span className="qz-num">{featuredStory.year}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={featuredStory.id}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="qz-st-grotesk-latin text-[10px] text-[#dfdcd5]/80">
                FEATURED ARCHIVAL PLATE · {featuredStory.era}
              </p>
              <h2 className="qz-st-notched-title mt-3">{featuredStory.title}</h2>
              <p className="qz-st-notched-excerpt">{featuredStory.caption}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="qz-st-pill-btn qz-st-pill-btn-inverted"
              onClick={() => selectStoryAndScroll(featuredIndex)}
            >
              <span>اقرأ الحكاية كاملة</span>
              <ArrowUpLeft className="size-3.5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="qz-st-ghost-link qz-st-ghost-link-light"
                aria-label="الفصل السابق"
                onClick={() => cycleFeatured(-1)}
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
              <div className="qz-st-hex-row" role="tablist" aria-label="تبديل اللوحة المعروضة">
                {stories.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === featuredIndex}
                    aria-label={s.title}
                    className="qz-st-hex-btn"
                    onClick={() => {
                      playGlassTap()
                      setFeaturedIndex(idx)
                    }}
                  >
                    <HexIndicator active={idx === featuredIndex} light size={12} />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="qz-st-ghost-link qz-st-ghost-link-light"
                aria-label="الفصل التالي"
                onClick={() => cycleFeatured(1)}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="qz-st-notched-foot">
            <span className="qz-st-scroll-micro">SCROLL · تصفّح للأسفل</span>
            <span className="qz-st-grotesk-latin text-[10px] text-[#dfdcd5]/70">
              INK MONOLITH · #000000
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ٣. القاعة الداكنة (Dark Feature Section — Ink Room #000000)
         ═══════════════════════════════════════════════════════════════ */}
      <section className="qz-st-ink-room" data-structured-surface="ink" aria-label="قاعة الدراسات الكلاسيكية">
        <div className="qz-st-corner-labels">
          <span>قاعة الدراسات الكلاسيكية · 03 محاور</span>
          <span className="qz-st-grotesk-latin">INK ROOM · CURATORIAL STUDIES</span>
        </div>

        <h2 className="qz-st-section-header">الحِكايةُ كما تُرى</h2>
        <p className="qz-st-section-sub">
          ثلاث عدسات متحفية لقراءة أرشيف الصور: عمارة المكان، مخطوطة الورق، وإيقاع الضوء عبر العقود.
        </p>

        {/* 3-Column Circular Feature Vignettes Grid */}
        <div className="qz-st-vignettes-grid">
          {CURATORIAL_VIGNETTES.map((item, idx) => {
            const isAct = activeVignette === idx
            return (
              <button
                key={item.id}
                type="button"
                className="qz-st-vignette"
                data-active={isAct ? 'true' : undefined}
                onClick={() => {
                  playGlassTap()
                  setActiveVignette(idx)
                }}
              >
                <div>
                  <span className="qz-st-grotesk-latin block text-[10px] text-[#dfdcd5]/70">
                    {item.latin}
                  </span>
                  <span className="qz-st-vignette-caption mt-1 block">{item.title}</span>
                </div>

                <div className="qz-st-vignette-circle">
                  <img
                    src={item.image}
                    alt={item.title}
                    data-no-tint="true"
                    style={{ objectPosition: item.objectPosition }}
                    loading="lazy"
                  />
                </div>

                <p className="qz-st-vignette-copy">{item.short}</p>

                <span className="qz-st-hex-row" aria-hidden="true">
                  {CURATORIAL_VIGNETTES.map((v, hi) => (
                    <HexIndicator key={v.id} active={hi === idx && isAct} light size={12} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>

        {/* Active Curatorial Wall Note */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVignette.id}
            className="qz-st-curatorial-note"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <p className="qz-st-grotesk-latin text-[11px] text-[#dfdcd5]/75">
              CURATORIAL NOTE · {currentVignette.latin}
            </p>
            <p className="font-[family-name:var(--st-font-reading)] text-base leading-8 text-[#e7e5e4]">
              {currentVignette.detail}
            </p>
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                className="qz-st-pill-btn qz-st-pill-btn-inverted"
                onClick={() => selectStoryAndScroll(currentVignette.linkedStoryIndex)}
              >
                <span>افتح الفصل المرتبط في الأرشيف</span>
                <ArrowUpLeft className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ٤. قاعة القراءة الكاملة (Putty #c4c3b6 + Bone Folio #e7e5e4)
         ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={archiveRef}
        className="qz-st-archive-room"
        data-structured-surface="putty"
        aria-label="فصول أرشيف الحكايات المصوّرة"
      >
        <div className="qz-st-archive-inner">
          <div className="qz-st-archive-top">
            <div>
              <span className="qz-st-grotesk-latin text-[11px] text-[#595855]">
                EXHIBITION FOLIO · COMPLETE ARCHIVE
              </span>
              <h2 className="mt-2 font-[family-name:var(--st-font-display)] text-[clamp(2.2rem,4.6vw,3.4rem)] font-medium leading-[1.04] text-black">
                فصولُ الأرشيف المصوّر
              </h2>
            </div>

            {/* Chapter Selector Tabs */}
            <div className="qz-st-archive-tabs" role="tablist" aria-label="اختر فصل الحكاية">
              {stories.map((story, idx) => {
                const isSel = idx === selectedStoryIdx
                return (
                  <button
                    key={story.id}
                    type="button"
                    role="tab"
                    aria-selected={isSel}
                    data-active={isSel ? 'true' : undefined}
                    className="qz-st-chapter-tab"
                    onClick={() => {
                      playGlassTap()
                      setSelectedStoryIdx(idx)
                      setFeaturedIndex(idx)
                    }}
                  >
                    <HexIndicator active={isSel} light={isSel} size={11} />
                    <span>{story.city}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Elevated Bone Reading Folio Card — #e7e5e4, 9px radius, 1px Vellum hairline */}
          <AnimatePresence mode="wait">
            <motion.article
              key={currentStory.id}
              className="qz-st-folio-card"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="qz-st-folio-media">
                <img
                  src={currentStory.image}
                  alt={currentStory.title}
                  data-no-tint="true"
                  loading="lazy"
                />
                <span className="qz-st-folio-plate-tag qz-num">
                  لوحة {String(selectedStoryIdx + 1).padStart(2, '0')} · {currentStory.year}
                </span>
              </div>

              <div className="qz-st-folio-body">
                <div>
                  <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[14px] font-medium text-black">
                    <span>
                      <span className="text-[#595855]">المكان: </span>
                      {currentStory.location}
                    </span>
                    <span>
                      <span className="text-[#595855]">الحقبة: </span>
                      {currentStory.era}
                    </span>
                  </div>

                  <h3 className="qz-st-folio-title">{currentStory.title}</h3>
                  <p className="qz-st-folio-lead">{currentStory.caption}</p>
                  <p className="qz-st-folio-text">{currentStory.story}</p>
                  {currentStory.continued && (
                    <p className="qz-st-folio-text">{currentStory.continued}</p>
                  )}
                </div>

                <div>
                  <p className="qz-st-folio-note">
                    <strong className="font-medium text-black">بطاقة التوثيق المتحفية: </strong>
                    {currentStory.note}
                  </p>

                  <div className="qz-st-folio-nav mt-5">
                    <button
                      type="button"
                      className="qz-st-ghost-link"
                      onClick={() => cycleSelected(-1)}
                    >
                      <ArrowRight className="size-4" aria-hidden="true" />
                      <span>الفصل السابق</span>
                    </button>

                    <div className="qz-st-hex-row" aria-label="ترتيب الفصل">
                      {stories.map((s, idx) => (
                        <button
                          key={s.id}
                          type="button"
                          className="qz-st-hex-btn"
                          aria-label={`الانتقال إلى ${s.title}`}
                          onClick={() => {
                            playGlassTap()
                            setSelectedStoryIdx(idx)
                          }}
                        >
                          <HexIndicator active={idx === selectedStoryIdx} size={12} />
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="qz-st-ghost-link"
                      onClick={() => cycleSelected(1)}
                    >
                      <span>الفصل التالي</span>
                      <ArrowLeft className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>

          {/* All 4 Archival Chapters Index (Bone Cards with Circular Crops) */}
          <div className="qz-st-chapters-grid" aria-label="قائمة فصول الحكايات">
            {stories.map((story, idx) => {
              const isAct = idx === selectedStoryIdx
              return (
                <button
                  key={story.id}
                  type="button"
                  className="qz-st-chapter-card"
                  data-active={isAct ? 'true' : undefined}
                  onClick={() => {
                    playGlassTap()
                    setSelectedStoryIdx(idx)
                    setFeaturedIndex(idx)
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="qz-st-chapter-thumb">
                      <img src={story.image} alt={story.city} data-no-tint="true" loading="lazy" />
                    </div>
                    <HexIndicator active={isAct} light={isAct} size={13} />
                  </div>
                  <div>
                    <span
                      className={`qz-num block text-xs ${isAct ? 'text-[#dfdcd5]' : 'text-[#595855]'}`}
                    >
                      {story.year} · {story.era}
                    </span>
                    <span className="mt-1 block font-[family-name:var(--st-font-display)] text-lg font-medium leading-snug">
                      {story.title}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ٥. بطاقة نظام المعرض (Structured Design System Specimen — Chalk #ebebeb)
         ═══════════════════════════════════════════════════════════════ */}
      <section
        className="qz-st-specimen-room"
        data-structured-surface="chalk"
        aria-label="لوحة ألوان ونظام المعرض"
      >
        <div className="qz-st-archive-inner">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="qz-st-grotesk-latin text-[11px] text-[#595855]">
                EXHIBITION COLOPHON · STRUCTURED SYSTEM SPECIMEN
              </span>
              <h2 className="mt-1 font-[family-name:var(--st-font-display)] text-2xl font-medium text-black sm:text-3xl">
                لوحة ألوان المعرض والمواد
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#595855]">
              <span>بطاقات: {structuredTokens.radius?.lg?.$value || '9px'}</span>
              <span>أزرار: {structuredTokens.radius?.['3xl']?.$value || '28.8px'}</span>
              <span>روابط: {structuredTokens.radius?.sm?.$value || '2px'}</span>
            </div>
          </div>

          <div className="qz-st-swatch-grid">
            {paletteSwatches.map((swatch) => (
              <div key={swatch.key} className="qz-st-swatch-card">
                <div
                  className="qz-st-swatch-chip"
                  style={{ backgroundColor: swatch.value }}
                  aria-hidden="true"
                />
                <div className="qz-st-swatch-info">
                  <span className="qz-st-grotesk-latin text-[11px] font-medium text-black">
                    {swatch.name}
                  </span>
                  <span className="qz-num text-[11px] text-[#595855]">{swatch.value}</span>
                  <span className="text-[11px] text-[#595855]">{swatch.roleAr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ٦. تذييل المعرض (Chalk Footer #ebebeb)
         ═══════════════════════════════════════════════════════════════ */}
      <footer className="qz-st-footer" data-structured-surface="chalk">
        <div className="qz-st-footer-inner">
          <div className="qz-st-footer-top">
            <div className="qz-st-monogram-wrap">
              <span className="qz-st-monogram" aria-hidden="true">
                ق
              </span>
              <div>
                <p className="font-[family-name:var(--st-font-display)] text-base font-medium text-black">
                  أرشيف الحكايات — منصة قاسمز
                </p>
                <p className="text-xs text-[#595855]">
                  ذاكرة الصورة والزمن في قاعة عرض كلاسيكية مسطّحة
                </p>
              </div>
            </div>

            <nav className="qz-st-footer-links" aria-label="أقسام منصة قاسمز">
              <Link to="/" className="qz-st-ghost-link" onClick={() => playGlassTap()}>
                الرئيسية
              </Link>
              <Link to="/verdict/movies" className="qz-st-ghost-link" onClick={() => playGlassTap()}>
                الفِردِكت
              </Link>
              <Link to="/articles" className="qz-st-ghost-link" onClick={() => playGlassTap()}>
                المقالات
              </Link>
              <Link to="/ideas" className="qz-st-ghost-link" onClick={() => playGlassTap()}>
                قاع الأفكار
              </Link>
              <Link to="/masaha/ahmed" className="qz-st-ghost-link" onClick={() => playGlassTap()}>
                عن أحمد
              </Link>
              <Link to="/masaha/books" className="qz-st-pill-btn" onClick={() => playGlassTap()}>
                <span>مكتبة الكتب</span>
                <ArrowUpLeft className="size-3.5" aria-hidden="true" />
              </Link>
            </nav>
          </div>

          <div className="qz-st-footer-bottom">
            <span>طُبع وعُرض وفق دليل Structured · Renaissance Gallery on Putty Paper</span>
            <span className="qz-num">© {new Date().getFullYear()} قاسمز — جميع الحقوق محفوظة</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
