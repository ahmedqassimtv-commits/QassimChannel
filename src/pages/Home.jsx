import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowUpLeft, BookOpen, Clapperboard, Pause, Play, Star } from 'lucide-react'
import GlassCard from '../components/glass/GlassCard.jsx'
import WordReveal from '../components/motion/WordReveal.jsx'
import Reveal from '../components/motion/Reveal.jsx'
import { entrySprings, revealStagger } from '../lib/motionTokens.js'
import VideoCard from '../components/cards/VideoCard.jsx'
import ReviewCard from '../components/cards/ReviewCard.jsx'
import StoriesSwipeDeck from '../components/home/StoriesSwipeDeck.jsx'
import ImageCompare from '../components/home/ImageCompare.jsx'
import { videos } from '../data/videos.js'
import { reviews } from '../data/reviews.js'
import { articles } from '../data/articles.js'

function SectionHeading({ eyebrow, title, to }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div><p className="mb-2 text-xs font-semibold tracking-[0.2em] text-emerald-300">{eyebrow}</p><h2 className="text-2xl font-bold text-white sm:text-3xl"><WordReveal text={title} /></h2></div>
      {to && <Link to={to} className="shrink-0 text-sm text-neutral-400 transition hover:text-emerald-200">عرض الكل ←</Link>}
    </div>
  )
}

// ===== الواجهة الرئيسية (Hero) — تصميم جديد بنفس الخط والألوان =====
// دخول الواجهة: ارتفاع + شفافية فقط (بلا blur — تحريك الفلتر ممنوع)،
// بنابض تحريري فيزيائي. التأخير يحافظ على تتابع العناصر.
const rise = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { ...entrySprings.editorial, delay },
})

function HeroStat({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
      <span className="grid size-9 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block font-sans text-lg font-bold leading-none text-white">{value}</span>
        <span className="mt-1 block text-[11px] text-neutral-400">{label}</span>
      </span>
    </div>
  )
}

// شريط عناوين متحرك في أسفل الواجهة (زي شريط سينما) — Obys.
// يتوقف عند التحويم/التركيز وعبر زر إيقاف/تشغيل (نمط APG Carousel).
// الحركة: حلقة خطية بسرعة ثابتة عبر MotionValue + animate() — عند الإيقاف
// يتجمد الشريط في موضعه، وعند الاستئناف يكمل من نفس الموضع إلى نهاية
// النسخة ثم يعاود من الصفر بلا قفزة (50% ≡ 0% لأن المحتوى مكرر).
// تقليل الحركة: الشريط ثابت تماماً (بلا حركة).
const MARQUEE_DURATION = 38 // ثوانٍ لنسخة واحدة (0% → 50%)

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
            <span className="size-1 rounded-full bg-emerald-300/60" />
          </span>
        ))}
      </motion.div>
      {/* زر إيقاف/تشغيل الشريط — ظاهر دائماً (لوحة مفاتيح وقارئ شاشة) */}
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

// عمق Igloo بالسكرول — الواجهة توقيع الموقع: مسار 280vh، لوحة لاصقة،
// 4 طبقات على نابض سكرول واحد مشترك (100/30/0.001 — مثال Motion الرسمي).
// الطبقات: تدرّج البطاقة (ثابت، الأعمق) → توهجات الخلفية (تتراجع) →
// النص (وسط المشهد) → بوسترات «يُعرض الآن» (الأقرب — تتقدم وتكبر).
// العمق يعمل على الشاشات الكبيرة فقط (lg+) وبلا تقليل حركة؛
// على الجوال وتحت تقليل الحركة تظهر الواجهة كبطاقة عادية ثابتة.
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
        <div className="relative flex w-full flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-emerald-400/[0.07] via-white/[0.015] to-transparent" style={{ height: depth ? '100%' : undefined }}>
          {/* الطبقة 1: إضاءة خلفية ناعمة (تتراجع ببطء) */}
          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ y: depth ? bgY : 0 }}>
            <div className="absolute -left-24 -top-10 size-80 rounded-full bg-emerald-400/[0.09] blur-[100px]" />
            <div className="absolute -bottom-24 right-1/3 size-72 rounded-full bg-emerald-300/[0.06] blur-[110px]" />
          </motion.div>

          <div className="relative grid flex-1 items-center gap-12 px-7 pb-10 pt-14 sm:px-12 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:pt-16">
        {/* النص — الطبقة 2 (وسط المشهد) */}
        <motion.div style={{ y: depth ? textY : 0 }}>
          <motion.span
            {...rise(0)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-2 text-xs text-emerald-200"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" /> حكايات تُروى بالصورة والصوت
          </motion.span>

          {/* ثمانية Display بالـswash وتدريج الثيم (.qz-gtitle) — التدريج متصل على الكلمات الخمسة */}
          <h1 className="qz-gtitle qz-split text-4xl leading-[1.35] sm:text-6xl" aria-label="مساحة للصورة، والحكاية التي وراءها.">
            <WordReveal text="مساحة للصورة،" delay={0.08} start={0} total={5} />
            <br />
            <WordReveal text="والحكاية التي وراءها." delay={0.2} start={2} total={5} />
          </h1>

          <motion.p {...rise(0.16)} className="mt-6 max-w-xl text-base leading-8 text-neutral-300 sm:text-lg">
            أفلام ووثائقيات، مراجعات صادقة، ومقالات عن الأشياء التي تجعل المشاهدة تجربة لا تُنسى.
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/videos"
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold text-[color:var(--qz-x6)] transition hover:bg-emerald-200"
            >
              اكتشف الفيديوهات
              <ArrowUpLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              to="/articles"
              className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm text-white transition hover:bg-white/[0.08]"
            >
              اقرأ المقالات
            </Link>
          </motion.div>

          <motion.div {...rise(0.32)} className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            <HeroStat icon={Clapperboard} value={videos.length} label="فيديو" />
            <HeroStat icon={Star} value={reviews.length} label="مراجعة" />
            <HeroStat icon={BookOpen} value={articles.length} label="مقال" />
          </motion.div>
        </motion.div>

        {/* «يُعرض الآن» — بطاقات متراصة زي بوسترات — الطبقة 3 (الأقرب) */}
        <motion.div
          style={{ y: depth ? posterY : 0, scale: depth ? posterScale : 1 }}
          className="relative mx-auto hidden aspect-[4/3.4] w-full max-w-md lg:block"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ ...entrySprings.editorial, delay: 0.2 }}
            className="relative size-full"
          >
          {second && (
            <Link
              to="/reviews"
              className="absolute left-0 top-0 w-[62%] -rotate-6 overflow-hidden rounded-3xl border border-white/10 bg-[color:var(--qz-ink)] shadow-[0_24px_60px_rgba(0,0,0,0.5)] transition duration-500 hover:-rotate-3"
            >
              <img
                src={`https://i.ytimg.com/vi/${second.youtubeId}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                className="aspect-[3/4] w-full object-cover opacity-80"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-10">
                <span className="block text-[10px] tracking-[0.2em] text-emerald-200">مراجعة</span>
                <span className="font-cinema mt-1 block text-2xl leading-[1.4]">{second.titleAr || second.title}</span>
              </span>
            </Link>
          )}

          {featured && (
            <Link
              to="/videos"
              className="group absolute bottom-0 right-0 w-[78%] rotate-3 overflow-hidden rounded-3xl border border-white/15 bg-[color:var(--qz-ink)] shadow-[0_30px_70px_rgba(0,0,0,0.55)] transition duration-500 hover:rotate-1"
            >
              <img
                src={`https://i.ytimg.com/vi/${featured.youtubeId}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                className="aspect-video w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-14 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition duration-300 group-hover:scale-110">
                  <Play className="size-5 translate-x-[-1px] fill-current" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/85 to-transparent p-4 pt-12">
                <span>
                  <span className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-emerald-200">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" /> يُعرض الآن
                  </span>
                  <span className="mt-1 block text-base font-bold text-white">{featured.title}</span>
                </span>
                <span className="shrink-0 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] text-neutral-300">
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

export default function Home() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-20">
      <HeroHome />

      <section><SectionHeading eyebrow="أرشيف الحكايات" title="اسحب لتتصفّح الحكايات" to="/stories" /><StoriesSwipeDeck /></section>
      <section><SectionHeading eyebrow="قبل / بعد" title="نفس الصورة، قبل وبعد التدرّج" /><ImageCompare /></section>
      <section><SectionHeading eyebrow="مختارات من القناة" title="فيديوهات تستحق المشاهدة" to="/videos" /><div className="grid gap-5 md:grid-cols-2">{videos.slice(0, 2).map((video) => <VideoCard key={video.id} video={video} />)}</div></section>
      <section><SectionHeading eyebrow="على طاولة النقد" title="أحدث المراجعات" to="/reviews" /><div className="grid gap-5 md:grid-cols-2">{reviews.slice(0, 2).map((review, i) => <ReviewCard key={review.id} review={review} index={i} />)}</div></section>
      <section><SectionHeading eyebrow="دفتر الملاحظات" title="من المقالات" to="/articles" /><div className="grid gap-5 md:grid-cols-2">{articles.slice(0, 2).map((article, i) => <Reveal key={article.slug} delay={i * revealStagger} className="h-full"><GlassCard className="liquid-glass-hover h-full p-7"><p className="text-xs text-emerald-200">{article.category} · {article.date}</p><h3 className="mt-3 text-xl font-bold text-white">{article.title}</h3><p className="mt-3 leading-7 text-neutral-400">{article.excerpt}</p><Link to={`/articles/${article.slug}`} className="mt-5 inline-block text-sm text-emerald-200">متابعة القراءة ←</Link></GlassCard></Reveal>)}</div></section>
    </motion.div>
  )
}
