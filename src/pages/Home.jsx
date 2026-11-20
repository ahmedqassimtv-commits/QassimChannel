import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpLeft, Play, Radio } from 'lucide-react'
import { videos } from '../data/videos.js'
import { reviews } from '../data/reviews.js'
import { articles } from '../data/articles.js'
import { stories } from '../data/stories.js'
import ImageCompare from '../components/home/ImageCompare.jsx'
import { Reveal, SplitTitle, Stagger, StaggerItem, EASE } from '../components/motion/Motion.jsx'
import { ArticleRow, Marquee, SectionHead, VerdictTile, VideoTile, fmtDate } from '../components/qz/Kit.jsx'
import { CinemaThumb, useCinema } from '../components/qz/CinemaPlayer.jsx'

/* ══ الرئيسية ═════════════════════════════════════════════════════════
   فصول سينمائية: افتتاحية بعنوان ضخم والمشهد الحي وراه › شريط عناوين ›
   ٠١ أحدث الحلقات › ٠٢ الفِردِكت › ٠٣ من الأرشيف › ٠٤ دفتر الملاحظات ›
   ٠٥ أون إير. كل فصل له رقم ورأس بنفس الإيقاع. */

const longVideos = videos.filter((v) => v.type !== 'short')
const asVideo = (r) => ({
  youtubeId: r.youtubeId,
  title: r.titleAr || r.title,
  category: `الفِردِكت · ${r.mediaType}`,
  summary: r.verdict,
})

function Stat({ value, label }) {
  return (
    <div>
      <p className="qz-num font-[family-name:var(--font-quiver)] text-4xl font-light text-[color:var(--qz-text)] sm:text-5xl">{value}</p>
      <p className="mt-1 text-xs text-[color:var(--qz-text-3)]">{label}</p>
    </div>
  )
}

function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const cinema = useCinema()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const titleY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const cardY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -220])
  const latest = longVideos[0]

  return (
    <section ref={ref} className="relative flex flex-col pb-10 pt-4 lg:-mt-6 lg:min-h-[calc(100svh-8rem)] lg:justify-between">
      <motion.div style={{ y: titleY, opacity: fade }} className="relative z-10">
        <Reveal y={8} className="flex flex-wrap items-center gap-4">
          <span className="qz-eyebrow">قاسمز · منصة الصورة والحكاية</span>
          <span className="qz-chip qz-chip-live">حلقة جديدة كل أسبوع</span>
        </Reveal>
        <SplitTitle as="h1" text={'حكايات\nتستحق أن تُروى'} className="qz-display mt-6 lg:mt-10" delay={0.1} stagger={0.09} />
        <Reveal delay={0.45} className="qz-lead mt-7 max-w-xl">
          أفلام ووثائقيات، أحكام صادقة على السينما والمسلسلات، ومقالات عن التفاصيل اللي بتخلّي المشاهدة تجربة ماتتنسيش.
        </Reveal>
        <Reveal delay={0.55} className="mt-9 flex flex-wrap gap-3">
          {latest && (
            <button type="button" className="qz-btn" onClick={() => cinema.open(latest)} data-qz-silent>
              <Play className="size-4 fill-current" aria-hidden="true" />
              شاهد أحدث حلقة
            </button>
          )}
          <Link to="/articles" className="qz-btn qz-btn-ghost">
            اقرأ المقالات
            <ArrowUpLeft className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </motion.div>

      {/* «يُعرض الآن» — بيطفو على جنب ويطلع أسرع من العنوان مع التمرير (عمق) */}
      {latest && (
        <motion.div
          style={{ y: cardY }}
          initial={{ opacity: 0, scale: 0.92, rotate: 2, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, rotate: -2, filter: 'blur(0px)' }}
          transition={{ duration: 1.3, delay: 0.5, ease: EASE }}
          className="absolute left-0 top-[14%] z-0 hidden w-[min(30vw,440px)] 2xl:block min-[1360px]:block"
        >
          <button type="button" onClick={() => cinema.open(latest)} className="group qz-hover-zoom block w-full text-start" data-qz-silent aria-label={`شغّل ${latest.title}`}>
            <div className="relative">
              <CinemaThumb video={latest} priority className="aspect-[4/5] rounded-[30px] shadow-[0_50px_120px_-30px_rgb(0_0_0/0.8)]" />
              <div className="qz-scrim rounded-[30px]" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="qz-play !size-20">
                  <Play className="size-7 fill-current" aria-hidden="true" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 p-6">
                <span className="qz-chip qz-chip-live !border-white/15 !bg-black/30 !text-white/85">يُعرض الآن</span>
                <span className="mt-3 block font-[family-name:var(--font-quiver)] text-2xl leading-snug text-white">{latest.title}</span>
              </span>
            </div>
          </button>
        </motion.div>
      )}

      <Reveal delay={0.7} className="relative z-10 mt-16 flex flex-wrap items-end justify-between gap-8">
        <div className="flex gap-10 sm:gap-14">
          <Stat value={longVideos.length} label="حلقة ووثائقي" />
          <Stat value={reviews.length} label="حُكم في الفِردِكت" />
          <Stat value={articles.length} label="مقال" />
          <Stat value={stories.length} label="حكاية مصوّرة" />
        </div>
        <span className="hidden items-center gap-3 text-xs text-[color:var(--qz-text-3)] sm:flex" aria-hidden="true">
          انزل للحكاية
          <span className="relative h-10 w-px overflow-hidden bg-[rgb(var(--qz-mint-rgb)/0.15)]">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-[color:var(--qz-accent)]"
              animate={reduce ? undefined : { y: ['-100%', '200%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </span>
      </Reveal>
    </section>
  )
}

export default function Home() {
  const cinema = useCinema()
  const [lead, ...rest] = longVideos
  const ticker = [...longVideos.map((v) => v.title), ...reviews.map((r) => r.titleAr || r.title), ...articles.map((a) => a.title)]
  const story = stories.find((s) => s.id === 'story-3') ?? stories[0]

  return (
    <div>
      <Hero />

      <Marquee
        items={ticker}
        className="-mx-[var(--qz-page-x)] border-y border-[color:var(--qz-line)] py-6 font-[family-name:var(--font-quiver)] text-2xl font-light text-[color:var(--qz-text-2)] sm:text-3xl"
      />

      {/* ٠١ أحدث الحلقات */}
      <section className="qz-section">
        <SectionHead index="01" eyebrow="من القناة" title="أحدث الحلقات" to="/videos" cta="كل الفيديوهات" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-12">
          {lead && (
            <Reveal>
              <VideoTile video={lead} size="lg" />
            </Reveal>
          )}
          <Stagger className="grid content-start gap-10">
            {rest.slice(0, 2).map((v) => (
              <StaggerItem key={v.id}>
                <VideoTile video={v} />
              </StaggerItem>
            ))}
            {videos.some((v) => v.type === 'short') && (
              <StaggerItem>
                <Link to="/videos/shorts" className="qz-panel group flex items-center justify-between gap-4 p-5">
                  <span>
                    <span className="block text-sm font-semibold text-[color:var(--qz-text)]">اللقطات القصيرة</span>
                    <span className="mt-1 block text-xs text-[color:var(--qz-text-3)]">لحظات من الكواليس في أقل من دقيقة</span>
                  </span>
                  <ArrowUpLeft className="size-5 text-[color:var(--qz-accent)] transition-transform duration-500 group-hover:-translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
                </Link>
              </StaggerItem>
            )}
          </Stagger>
        </div>
      </section>

      {/* ٠٢ الفِردِكت */}
      <section className="qz-section pt-0">
        <SectionHead index="02" eyebrow="THE VERDICT" title="الفِردِكت: أحكام على الشاشة" to="/verdict/movies" cta="كل الأحكام" />
        <Stagger className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 3).map((r) => (
            <StaggerItem key={r.id}>
              <VerdictTile review={r} onPlay={() => cinema.open(asVideo(r))} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ٠٣ من الأرشيف إلى الصورة */}
      <section className="qz-section pt-0">
        <SectionHead index="03" eyebrow="أرشيف الحكايات" title="من الأرشيف إلى الصورة" to="/stories" cta="كل الحكايات" />
        <div className="qz-panel grid items-center gap-10 p-6 sm:p-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-14">
          <Reveal className="mx-auto md:mx-0">
            <ImageCompare
              src={story.image.replace('w=1400', 'w=720&h=960&fit=crop')}
              alt={story.title}
              beforeLabel="الأرشيف"
              afterLabel="اليوم"
            />
          </Reveal>
          <Reveal delay={0.1} className="text-center md:text-start">
            <p className="qz-eyebrow qz-num">
              {story.year} · {story.location}
            </p>
            <h3 className="qz-h2 mt-4">{story.title}</h3>
            <p className="qz-lead mt-4 max-w-lg">{story.caption}</p>
            <p className="mt-4 text-sm text-[color:var(--qz-text-3)]">اسحب الخط يمين وشمال، أو ارميه بسرعة يكمّل لوحده للحافة.</p>
          </Reveal>
        </div>
      </section>

      {/* ٠٤ دفتر الملاحظات */}
      {articles.length > 0 && (
        <section className="qz-section pt-0">
          <SectionHead index="04" eyebrow="دفتر الملاحظات" title="قراءات متأنية" to="/articles" cta="كل المقالات" />
          <Stagger>
            {articles.slice(0, 4).map((a, i) => (
              <StaggerItem key={a.slug}>
                <ArticleRow article={a} index={i + 1} />
              </StaggerItem>
            ))}
          </Stagger>
          <div className="qz-rule" />
        </section>
      )}

      {/* ٠٥ أون إير */}
      <section className="qz-section pt-0">
        <Reveal>
          <Link to="/masaha/on-air" className="qz-panel group relative block overflow-hidden p-8 sm:p-14">
            <div className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full bg-[rgb(var(--qz-glow-rgb)/0.12)] blur-[90px]" aria-hidden="true" />
            <div className="relative flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-2xl">
                <span className="qz-index qz-num">05</span>
                <p className="qz-eyebrow mt-3">
                  <Radio className="size-4" aria-hidden="true" /> مساحة
                </p>
                <p className="qz-h1 mt-4">أون إير</p>
                <p className="qz-lead mt-4">منشورات قاسم اليومية ومقتطفاته السريعة في مكان واحد، على موسيقى هادية.</p>
              </div>
              <span className="qz-btn shrink-0">
                ادخل البث
                <ArrowUpLeft className="size-4" aria-hidden="true" />
              </span>
            </div>
          </Link>
        </Reveal>
      </section>

      {lead?.date && <p className="sr-only">آخر تحديث {fmtDate(lead.date)}</p>}
    </div>
  )
}
