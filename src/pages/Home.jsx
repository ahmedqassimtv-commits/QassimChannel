import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  ArrowUpLeft,
  BookOpen,
  Clapperboard,
  Compass,
  Lightbulb,
  Pause,
  Play,
  Scale,
  Sparkles,
  Star,
} from 'lucide-react'
import GlassCard from '../components/glass/GlassCard.jsx'
import WordReveal from '../components/motion/WordReveal.jsx'
import Reveal from '../components/motion/Reveal.jsx'
import { entrySprings, ORIGIN_EASE, revealStagger } from '../lib/motionTokens.js'
import VideoCard from '../components/cards/VideoCard.jsx'
import ReviewCard from '../components/cards/ReviewCard.jsx'
import StoriesSwipeDeck from '../components/home/StoriesSwipeDeck.jsx'
import ImageCompare from '../components/home/ImageCompare.jsx'
import { useCinema } from '../components/qz/CinemaPlayer.jsx'
import { videos } from '../data/videos.js'
import { reviews } from '../data/reviews.js'
import { articles } from '../data/articles.js'
import { stories } from '../data/stories.js'
import { assetUrl } from '../utils/assets.js'
import { playGlassTap } from '../utils/glassSound.js'

const AHMED_PORTRAIT_SRC = assetUrl('/images/ahmed/diffuse.webp')

function SectionHeading({ eyebrow, title, to }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-[color:var(--qz-accent)]">
          {eyebrow}
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white sm:text-3xl">
          <WordReveal text={title} />
        </h2>
      </div>
      {to && (
        <Link
          to={to}
          className="shrink-0 text-sm text-neutral-400 transition duration-200 hover:text-[color:var(--qz-accent)]"
        >
          عرض الكل ←
        </Link>
      )}
    </div>
  )
}

/* ── إكليل الجوائز المزدوج (Origin Award Laurel SVG — DESIGN 5) ── */
function AwardLaurelBadge({ label = 'صناعة بصرية وتحليل سينمائي', sub = 'QASSIMZ STUDIO' }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
      <svg width="16" height="24" viewBox="0 0 24 36" fill="none" aria-hidden="true">
        <path
          d="M19 33C11 29 6 21 6 11C6 7 8 4 11 2M6 21C9 19 12 19 14 21M7 14C10 12 13 12 15 14M9 8C12 7 14 7 16 9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="text-[color:var(--qz-accent)]"
        />
      </svg>
      <div className="text-center leading-tight">
        <span className="block text-[10px] font-bold tracking-wider text-white/90">{label}</span>
        <span className="qz-latin block text-[8.5px] tracking-[0.22em] text-white/55">{sub}</span>
      </div>
      <svg
        width="16"
        height="24"
        viewBox="0 0 24 36"
        fill="none"
        style={{ transform: 'scaleX(-1)' }}
        aria-hidden="true"
      >
        <path
          d="M19 33C11 29 6 21 6 11C6 7 8 4 11 2M6 21C9 19 12 19 14 21M7 14C10 12 13 12 15 14M9 8C12 7 14 7 16 9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="text-[color:var(--qz-accent)]"
        />
      </svg>
    </div>
  )
}

// ===== الواجهة الرئيسية (Hero) — بنفس الهيكل الأصلي + بورتريه أحمد وحركة Origin/Apple =====
const rise = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { ...entrySprings.editorial, delay },
})

function HeroStat({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition duration-200 hover:bg-white/[0.06]">
      <span className="grid size-9 place-items-center rounded-xl border border-[rgb(var(--qz-glow-rgb)/0.22)] bg-[rgb(var(--qz-glow-rgb)/0.08)] text-[color:var(--qz-accent)]">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="qz-num block font-sans text-lg font-bold leading-none text-white">
          {value}
        </span>
        <span className="mt-1 block text-[11px] text-neutral-400">{label}</span>
      </span>
    </div>
  )
}

// شريط عناوين متحرك في أسفل الواجهة (زي شريط سينما) — Obys.
const MARQUEE_DURATION = 38

function HeroMarquee({ items }) {
  const reduce = useReducedMotion()
  const [userPaused, setUserPaused] = useState(false)
  const [hoverPaused, setHoverPaused] = useState(false)
  const paused = userPaused || hoverPaused || reduce
  const x = useMotionValue(0)
  const row = [...items, ...items]

  useEffect(() => {
    if (paused) return undefined
    let alive = true
    let controls
    const loop = async () => {
      while (alive) {
        const remaining = Math.max(0.5, ((50 - x.get()) / 50) * MARQUEE_DURATION)
        controls = animate(x, 50, { duration: remaining, ease: 'linear' })
        try {
          await controls
        } catch {
          return
        }
        if (!alive) return
        x.set(0)
      }
    }
    loop()
    return () => {
      alive = false
      controls?.stop()
    }
  }, [paused, x])

  return (
    <div
      className="relative overflow-hidden border-t border-white/[0.06] py-3 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setHoverPaused(true)}
      onBlur={() => setHoverPaused(false)}
    >
      <motion.div
        className="flex w-max gap-8 whitespace-nowrap text-xs text-neutral-400"
        style={{ x: useTransform(x, (v) => `${v}%`) }}
        aria-hidden="true"
      >
        {row.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-8">
            <span>{item}</span>
            <span className="size-1 rounded-full bg-[color:var(--qz-accent)]/70" />
          </span>
        ))}
      </motion.div>
      <button
        type="button"
        onClick={() => setUserPaused((p) => !p)}
        aria-pressed={userPaused}
        aria-label={userPaused ? 'تشغيل شريط العناوين' : 'إيقاف شريط العناوين مؤقتاً'}
        className="absolute left-3 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-neutral-300 backdrop-blur-sm transition hover:text-white"
      >
        {userPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
      </button>
      <span className="sr-only">شريط عناوين: {items.join('، ')}</span>
    </div>
  )
}

// عمق Igloo بالسكرول — مسار 280vh، لوحة لاصقة، مع بورتريه أحمد الشخصي وبوسترات «يُعرض الآن»
function HeroHome() {
  const featured = videos[0]
  const second = reviews[0]
  const ticker = [
    ...videos.map((v) => v.title),
    ...reviews.map((r) => r.titleAr || r.title),
    ...articles.slice(0, 4).map((a) => a.title),
  ]
  const reduce = useReducedMotion()
  const trackRef = useRef(null)
  const [isDesktop, setIsDesktop] = useState(false)

  // تفاعل ميل ثلاثي الأبعاد ناعم لبورتريه أحمد عند تحريك الماوس
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const smoothTiltX = useSpring(tiltX, { stiffness: 120, damping: 24 })
  const smoothTiltY = useSpring(tiltY, { stiffness: 120, damping: 24 })

  const handleStageMove = (e) => {
    if (reduce) return
    const rect = e.currentTarget.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5
    const ny = (e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5
    tiltY.set(nx * 10)
    tiltX.set(-ny * 8)
  }

  const handleStageLeave = () => {
    tiltX.set(0)
    tiltY.set(0)
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const depth = isDesktop && !reduce
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  const bgY = useTransform(smooth, [0, 1], [0, -40])
  const textY = useTransform(smooth, [0, 1], [0, 50])
  const posterY = useTransform(smooth, [0, 1], [0, 110])
  const posterScale = useTransform(smooth, [0, 1], [1, 1.07])

  return (
    <section ref={trackRef} className="relative" style={{ height: depth ? '280vh' : undefined }}>
      <div className={depth ? 'sticky top-24 flex h-[calc(100svh-6rem)] items-center' : 'relative'}>
        <div
          className="relative flex w-full flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-[rgb(var(--qz-moss-rgb)/0.18)] via-black/45 to-black/70 backdrop-blur-sm"
          style={{ height: depth ? '100%' : undefined }}
        >
          {/* الطبقة 1: إضاءة خلفية ناعمة (تتراجع ببطء) */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ y: depth ? bgY : 0 }}
          >
            <div className="absolute -left-24 -top-10 size-80 rounded-full bg-[rgb(var(--qz-glow-rgb)/0.12)] blur-[100px]" />
            <div className="absolute -bottom-24 right-1/3 size-72 rounded-full bg-[rgb(var(--qz-moss-rgb)/0.16)] blur-[110px]" />
          </motion.div>

          <div className="relative grid flex-1 items-center gap-10 px-7 pb-10 pt-12 sm:px-12 lg:grid-cols-[1.12fr_1fr] lg:gap-10 lg:pt-14">
            {/* النص — الطبقة 2 (وسط المشهد) */}
            <motion.div style={{ y: depth ? textY : 0 }}>
              <motion.div {...rise(0)} className="mb-6 flex flex-wrap items-center gap-3">
                <span className="qz-origin-eyebrow-pill text-xs text-[color:var(--qz-mint)]">
                  <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--qz-accent)]" />
                  <span>حكايات تُروى بالصورة والصوت</span>
                </span>
                <AwardLaurelBadge />
              </motion.div>

              <h1 className="font-[family-name:var(--font-display)] text-4xl font-black leading-[1.28] tracking-tight text-white sm:text-6xl">
                <WordReveal text="مساحة للصورة،" delay={0.08} />
                <br />
                <span className="text-[color:var(--qz-accent)]">
                  <WordReveal text="والحكاية التي وراءها." delay={0.2} />
                </span>
              </h1>

              <motion.p
                {...rise(0.16)}
                className="mt-6 max-w-xl font-[family-name:var(--font-text)] text-base leading-8 text-neutral-300 sm:text-lg"
              >
                أفلام ووثائقيات، مراجعات صادقة، ومقالات عن الأشياء التي تجعل المشاهدة تجربة لا تُنسى.
              </motion.p>

              <motion.div {...rise(0.24)} className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/videos"
                  className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--qz-mint)] px-6 py-3 text-sm font-bold text-[color:var(--qz-ink)] transition duration-200 hover:bg-white"
                >
                  <span>اكتشف الفيديوهات</span>
                  <ArrowUpLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  to="/articles"
                  className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm text-white transition duration-200 hover:bg-white/[0.1]"
                >
                  اقرأ المقالات
                </Link>
                <Link
                  to="/ideas"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm text-[color:var(--qz-accent)] transition duration-200 hover:bg-white/[0.1]"
                >
                  <Lightbulb className="size-4" aria-hidden="true" />
                  <span>قاع الأفكار</span>
                </Link>
              </motion.div>

              <motion.div {...rise(0.32)} className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                <HeroStat icon={Clapperboard} value={videos.length} label="فيديو" />
                <HeroStat icon={Star} value={reviews.length} label="مراجعة" />
                <HeroStat icon={BookOpen} value={articles.length} label="مقال" />
              </motion.div>
            </motion.div>

            {/* بورتريه أحمد الشخصي + بوسترات «يُعرض الآن» — الطبقة 3 (الأقرب) */}
            <motion.div
              style={{ y: depth ? posterY : 0, scale: depth ? posterScale : 1 }}
              onPointerMove={handleStageMove}
              onPointerLeave={handleStageLeave}
              className="relative mx-auto aspect-[4/3.55] w-full max-w-lg"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, rotate: -1.5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ ...entrySprings.atmospheric, delay: 0.18 }}
                style={{
                  rotateX: smoothTiltX,
                  rotateY: smoothTiltY,
                  transformPerspective: 1200,
                }}
                className="relative size-full"
              >
                {/* ١. بطاقة بورتريه أحمد الشخصي (Apple DESIGN 4 28px Exhibition Stage) */}
                <Link
                  to="/masaha/ahmed"
                  className="group absolute left-3 top-0 z-10 w-[64%] overflow-hidden rounded-[28px] border border-white/15 bg-black shadow-[0_28px_70px_rgba(0,0,0,0.65)] transition duration-500 hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/4.6] w-full overflow-hidden bg-gradient-to-b from-[rgb(var(--qz-moss-rgb)/0.32)] via-black to-black">
                    <img
                      src={AHMED_PORTRAIT_SRC}
                      alt="أحمد قاسم"
                      loading="eager"
                      fetchPriority="high"
                      className="size-full object-cover object-top transition duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                    <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-bold text-[color:var(--qz-accent)] backdrop-blur-md">
                      <Sparkles className="size-3" aria-hidden="true" />
                      <span>أحمد قاسم</span>
                    </span>
                    <span className="absolute inset-x-0 bottom-0 p-4">
                      <span className="block text-[10px] tracking-[0.2em] text-[color:var(--qz-accent)]">
                        PORTRAIT · وراء الكاميرا
                      </span>
                      <span className="mt-1 flex items-center justify-between text-sm font-bold text-white">
                        <span>رحلة الصورة والحكاية</span>
                        <ArrowUpLeft className="size-4 text-[color:var(--qz-accent)]" />
                      </span>
                    </span>
                  </div>
                </Link>

                {/* ٢. بطاقة المراجعة المائلة */}
                {second && (
                  <Link
                    to="/reviews"
                    className="absolute right-0 top-3 z-0 w-[48%] rotate-6 overflow-hidden rounded-[24px] border border-white/10 bg-[color:var(--qz-ink)] shadow-[0_24px_60px_rgba(0,0,0,0.5)] transition duration-500 hover:rotate-2"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${second.youtubeId}/hqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="aspect-[3/3.6] w-full object-cover opacity-80"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3.5 pt-8">
                      <span className="block text-[10px] tracking-[0.2em] text-[color:var(--qz-accent)]">
                        مراجعة · {second.rating}/10
                      </span>
                      <span className="mt-0.5 block font-[family-name:var(--font-display)] text-lg font-bold leading-[1.3] text-white">
                        {second.titleAr || second.title}
                      </span>
                    </span>
                  </Link>
                )}

                {/* ٣. بطاقة الفيديو الرئيسي «يُعرض الآن» */}
                {featured && (
                  <Link
                    to="/videos"
                    className="group absolute bottom-0 right-1 z-20 w-[74%] rotate-2 overflow-hidden rounded-[28px] border border-white/15 bg-[color:var(--qz-ink)] shadow-[0_30px_70px_rgba(0,0,0,0.65)] transition duration-500 hover:rotate-0"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${featured.youtubeId}/hqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-13 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition duration-300 group-hover:scale-110">
                        <Play className="size-5 translate-x-[-1px] fill-current" />
                      </span>
                    </span>
                    <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/90 to-transparent p-4 pt-10">
                      <span>
                        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-[color:var(--qz-accent)]">
                          <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--qz-accent)]" />
                          <span>يُعرض الآن</span>
                        </span>
                        <span className="mt-1 block font-[family-name:var(--font-display)] text-base font-bold text-white">
                          {featured.title}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] text-neutral-300">
                        {featured.category}
                      </span>
                    </span>
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </div>

          <HeroMarquee items={ticker} />
        </div>
      </div>
    </section>
  )
}

/* ══ Apple Close-Look + Origin Portrait Showcase (DESIGN 4 & DESIGN 5) ══ */
const CLOSE_LOOK_ITEMS = [
  {
    id: 'portrait',
    chip: '٠١ · بورتريه أحمد ورؤية القناة',
    badge: 'CLOSE-LOOK · STUDIO PORTRAIT',
    title: 'ما وراء الكادر: لماذا نصنع الحكاية بالصورة؟',
    body: 'كل حلقة في قاسمز تبدأ من سؤال بصري: كيف نعيد تقديم الحكايات الإنسانية والسينمائية بإيقاع يحترم عين المشاهد وعقله، بعيداً عن الضجيج السريع.',
    metricVal: '4K / 60fps',
    metricLabel: 'معالجة بصرية وسردية متأنية',
    image: AHMED_PORTRAIT_SRC,
    isPortrait: true,
    ctaLabel: 'استكشف قسم عن أحمد',
    ctaTo: '/masaha/ahmed',
    icon: Compass,
  },
  {
    id: 'verdict',
    chip: '٠٢ · الفِردِكت: أحكام السينما والمسلسلات',
    badge: 'THE VERDICT · CINEMA REEL',
    title: 'تشريح الكادر والسيناريو قبل إصدار الحُكم النهائي.',
    body: 'في الفِردِكت لا نكتفي بانطباع سريع؛ نضع الإخراج والمونتاج وبناء الشخصيات تحت العدسة لنصل إلى تقييم صادق يصمد مع الوقت.',
    metricVal: `${reviews.length} مراجعة`,
    metricLabel: 'في بكرة السينما التفاعلية',
    image: `https://i.ytimg.com/vi/${reviews[0]?.youtubeId || 'dQw4w9WgXcQ'}/hqdefault.jpg`,
    ctaLabel: 'افتح بكرة السينما والمسلسلات',
    ctaTo: '/verdict/movies',
    icon: Scale,
  },
  {
    id: 'ideas',
    chip: '٠٣ · قاع الأفكار: الدفاتر والمسودات',
    badge: 'SUPERR NOTEBOOK · IDEAS BOTTOM',
    title: 'المسودات المرقّمة والهوامش قبل أن تضيء الكاميرا.',
    body: 'دفاتر ورقية تفاعلية تجمع بذور الحلقات، اقتباسات الكتب، ورسوم المشاهد التي تتبلور منها مشاريع القناة القادمة.',
    metricVal: '٦ دفاتر حية',
    metricLabel: 'مفتوحة للقراءة وإضافة الأفكار',
    image: stories[0]?.image,
    ctaLabel: 'ادخل قاع الأفكار',
    ctaTo: '/ideas',
    icon: Lightbulb,
  },
]

function CloseLookShowcase() {
  const [activeId, setActiveId] = useState('portrait')
  const active = CLOSE_LOOK_ITEMS.find((item) => item.id === activeId) || CLOSE_LOOK_ITEMS[0]

  return (
    <Reveal className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-black/60 p-6 backdrop-blur-md sm:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="qz-origin-eyebrow-pill text-xs text-[color:var(--qz-accent)]">
            <span>نظرة عن قُرب · APPLE & ORIGIN EXHIBITION</span>
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-black text-white sm:text-4xl">
            عالم قاسمز في ثلاث زوايا
          </h2>
        </div>
        <AwardLaurelBadge label="تصميم سينمائي تفاعلي" sub="MIDNIGHT INSTRUMENT" />
      </div>

      <div className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.18fr]">
        {/* قائمة أزرار الـ 36px-radius من Apple DESIGN (4).md + البطاقة العكسية من Origin DESIGN (5).md */}
        <div className="flex flex-col gap-3">
          {CLOSE_LOOK_ITEMS.map((item) => {
            const Icon = item.icon
            const isSel = item.id === active.id
            return (
              <button
                key={item.id}
                type="button"
                data-active={isSel ? 'true' : undefined}
                className="qz-apple-chip"
                onClick={() => {
                  playGlassTap()
                  setActiveId(item.id)
                }}
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-white/10 text-[color:var(--qz-accent)]">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span>{item.chip}</span>
                </span>
                <span
                  className={`size-2 rounded-full transition ${
                    isSel ? 'bg-[color:var(--qz-accent)] shadow-[0_0_10px_var(--qz-accent)]' : 'bg-white/20'
                  }`}
                />
              </button>
            )
          })}

          {/* بطاقة الإحصائية الفاتحة العكسية (Origin 30px-Radius Light Inverted Stat Card) */}
          <div className="qz-origin-light-card mt-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#051f20]/70">
                مؤشر الإشارة · {active.badge}
              </span>
              <span className="size-2 rounded-full bg-[#051f20]" />
            </div>
            <p className="qz-num mt-2 font-[family-name:var(--font-display)] text-3xl font-black text-[#051f20]">
              {active.metricVal}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#051f20]/80">{active.metricLabel}</p>
          </div>
        </div>

        {/* منصة العرض السينمائية (28px Apple Media Tile) */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-black p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.75, ease: ORIGIN_EASE }}
              className="grid items-center gap-6 sm:grid-cols-[0.85fr_1.15fr]"
            >
              <div className="relative mx-auto aspect-[4/4.6] w-full max-w-[260px] overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-b from-[rgb(var(--qz-moss-rgb)/0.3)] to-black">
                <img
                  src={active.image}
                  alt={active.title}
                  className={`size-full object-cover ${active.isPortrait ? 'object-top' : 'object-center'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              </div>

              <div>
                <span className="qz-latin text-[11px] font-semibold tracking-[0.22em] text-[color:var(--qz-accent)]">
                  {active.badge}
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-black leading-snug text-white sm:text-3xl">
                  {active.title}
                </h3>
                <p className="mt-3 font-[family-name:var(--font-text)] text-sm leading-7 text-neutral-300 sm:text-base">
                  {active.body}
                </p>
                <div className="mt-6">
                  <Link
                    to={active.ctaTo}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black transition duration-200 hover:bg-[color:var(--qz-mint)]"
                  >
                    <span>{active.ctaLabel}</span>
                    <ArrowUpLeft className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Reveal>
  )
}

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: ORIGIN_EASE }}
      className="space-y-20"
    >
      <HeroHome />

      <section>
        <CloseLookShowcase />
      </section>

      <section>
        <SectionHeading eyebrow="أرشيف الحكايات" title="اسحب لتتصفّح الحكايات" to="/stories" />
        <StoriesSwipeDeck />
      </section>

      <section>
        <SectionHeading eyebrow="قبل / بعد" title="نفس الصورة، قبل وبعد التدرّج" />
        <ImageCompare />
      </section>

      <section>
        <SectionHeading
          eyebrow="مختارات من القناة"
          title="فيديوهات تستحق المشاهدة"
          to="/videos"
        />
        <div className="grid gap-5 md:grid-cols-2">
          {videos.slice(0, 2).map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="على طاولة النقد" title="أحدث المراجعات" to="/reviews" />
        <div className="grid gap-5 md:grid-cols-2">
          {reviews.slice(0, 2).map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="دفتر الملاحظات" title="من المقالات" to="/articles" />
        <div className="grid gap-5 md:grid-cols-2">
          {articles.slice(0, 2).map((article, i) => (
            <Reveal key={article.slug} delay={i * revealStagger} className="h-full">
              <GlassCard className="liquid-glass-hover h-full rounded-[28px] p-7">
                <p className="text-xs text-[color:var(--qz-accent)]">
                  {article.category} · {article.date}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-white">
                  {article.title}
                </h3>
                <p className="mt-3 font-[family-name:var(--font-text)] leading-7 text-neutral-300">
                  {article.excerpt}
                </p>
                <Link
                  to={`/articles/${article.slug}`}
                  className="mt-5 inline-block text-sm font-semibold text-[color:var(--qz-accent)] transition duration-200 hover:underline"
                >
                  متابعة القراءة ←
                </Link>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>
    </motion.div>
  )
}
