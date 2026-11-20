import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpLeft, Play } from 'lucide-react'
import { Reveal, SplitTitle, SPRING } from '../motion/Motion.jsx'
import { CinemaThumb, useCinema } from './CinemaPlayer.jsx'
import YouTubeThumb from '../ui/YouTubeThumb.jsx'

/* ══ مكوّنات التصميم المشتركة ════════════════════════════════════════
   كل الصفحات مبنية من نفس القطع عشان الإيقاع يبقى واحد:
   PageHero › SectionHead › (VideoTile | ShortTile | VerdictTile | ArticleRow) */

const fmtDate = (d) => {
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d))
  } catch {
    return d
  }
}
export { fmtDate }

/* «دقيقة / دقيقتين / 3 دقائق / 11 دقيقة» — صيغة العدد العربي الصح */
export function fmtMinutes(n) {
  if (n <= 1) return 'دقيقة قراءة'
  if (n === 2) return 'دقيقتين قراءة'
  if (n <= 10) return `${n} دقائق قراءة`
  return `${n} دقيقة قراءة`
}

/* عنوان الصفحة: رقم القسم + عين + عنوان ضخم بيطلع كلمة كلمة + مقدمة */
export function PageHero({ index, eyebrow, title, lead, children, aside, className = '' }) {
  return (
    <header className={`relative grid gap-10 pb-6 pt-6 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end ${className}`}>
      <div className="min-w-0">
        <Reveal y={10} className="flex items-center gap-4">
          {index && <span className="qz-index qz-num">{index}</span>}
          {eyebrow && <span className="qz-eyebrow">{eyebrow}</span>}
        </Reveal>
        <SplitTitle text={title} className="qz-h1 mt-5" delay={0.05} />
        {lead && (
          <Reveal delay={0.25} className="qz-lead mt-6 max-w-2xl">
            {lead}
          </Reveal>
        )}
        {children && (
          <Reveal delay={0.35} className="mt-8">
            {children}
          </Reveal>
        )}
      </div>
      {aside && (
        <Reveal delay={0.3} className="min-w-0">
          {aside}
        </Reveal>
      )}
    </header>
  )
}

/* رأس قسم داخل صفحة: رقم + عنوان + رابط «الكل» */
export function SectionHead({ index, eyebrow, title, to, cta = 'عرض الكل' }) {
  return (
    <div className="qz-section-head">
      <div className="min-w-0">
        <Reveal y={8} className="flex items-center gap-4">
          {index && <span className="qz-index qz-num">{index}</span>}
          {eyebrow && <span className="qz-eyebrow">{eyebrow}</span>}
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="qz-h2 mt-3">{title}</h2>
        </Reveal>
      </div>
      {to && (
        <Reveal delay={0.15} className="shrink-0">
          <Link to={to} className="qz-link">
            <span>{cta}</span>
            <ArrowUpLeft className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
      )}
    </div>
  )
}

/* فلاتر بفقاعة بتتزحلق للمختار */
export function Filters({ items, value, onChange, id = 'f', label = 'تصفية' }) {
  return (
    <div className="qz-filters" role="group" aria-label={label}>
      {items.map((item) => {
        const key = typeof item === 'string' ? item : item.value
        const text = typeof item === 'string' ? item : item.label
        const on = key === value
        return (
          <button key={key} type="button" className="qz-filter" aria-pressed={on} onClick={() => onChange(key)} data-qz-silent>
            {on && <motion.span layoutId={`qz-filter-${id}`} className="qz-filter-pill" transition={SPRING} />}
            {text}
          </button>
        )
      })}
    </div>
  )
}

/* شريط بيلف لوحده (المحتوى متكرر مرتين عشان اللفة تبقى من غير قطع) */
export function Marquee({ items, className = '' }) {
  const row = (hidden) => (
    <div className="qz-marquee-track" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-12 whitespace-nowrap">
          <span>{t}</span>
          <span className="size-1.5 rounded-full bg-[color:var(--qz-accent)] opacity-60" />
        </span>
      ))}
    </div>
  )
  return (
    <div className={`qz-marquee ${className}`}>
      {row(false)}
      {row(true)}
    </div>
  )
}

/* كارت فيديو طويل: الصورة بتتمدد لمشغّل السينما */
export function VideoTile({ video, size = 'md', priority = false }) {
  const cinema = useCinema()
  const big = size === 'lg'
  return (
    <button type="button" onClick={() => cinema.open(video)} className="group qz-hover-zoom block w-full text-start" data-qz-silent>
      <div className="relative">
        <CinemaThumb video={video} priority={priority} className={`aspect-video ${big ? 'rounded-[28px]' : ''}`} />
        <div className="qz-scrim rounded-[22px]" />
        <span className="absolute inset-0 grid place-items-center">
          <span className={`qz-play ${big ? '!size-20' : ''}`}>
            <Play className={big ? 'size-7 fill-current' : 'size-5 fill-current'} aria-hidden="true" />
          </span>
        </span>
        {video.category && (
          <span className="qz-chip absolute right-4 top-4 !border-white/15 !bg-black/30 !text-white/85 backdrop-blur-md">{video.category}</span>
        )}
      </div>
      <div className={big ? 'mt-6' : 'mt-4'}>
        <h3 className={big ? 'qz-h2' : 'qz-h3'}>{video.title}</h3>
        {video.summary && <p className={`mt-2 line-clamp-2 ${big ? 'qz-lead max-w-2xl' : 'qz-body text-sm'}`}>{video.summary}</p>}
        {video.date && <p className="qz-num mt-3 text-xs text-[color:var(--qz-text-3)]">{fmtDate(video.date)}</p>}
      </div>
    </button>
  )
}

/* كارت شورت عمودي */
export function ShortTile({ video }) {
  const cinema = useCinema()
  return (
    <button type="button" onClick={() => cinema.open(video)} className="group qz-hover-zoom relative block w-full text-start" data-qz-silent>
      <CinemaThumb video={video} className="aspect-[9/16]" />
      <div className="qz-scrim rounded-[22px]" />
      <span className="absolute inset-x-0 bottom-0 p-4">
        <span className="qz-chip !h-6 !border-white/15 !bg-black/30 !text-[11px] !text-white/85">شورت</span>
        <span className="mt-2 block text-base font-semibold leading-snug text-white">{video.title}</span>
      </span>
    </button>
  )
}

/* حلقة التقييم (من 10) */
export function RatingRing({ value, size = 56 }) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / 10))
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }} aria-label={`التقييم ${value} من 10`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--qz-mint-rgb) / 0.14)" strokeWidth="3" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--qz-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <span className="qz-num absolute text-sm font-semibold text-[color:var(--qz-text)]">{value}</span>
    </span>
  )
}

/* كارت حُكم (فيلم/مسلسل) */
export function VerdictTile({ review, onPlay }) {
  return (
    <article className="group qz-hover-zoom relative">
      <button type="button" className="block w-full text-start" onClick={onPlay} data-qz-silent aria-label={`شاهد مراجعة ${review.titleAr || review.title}`}>
        <div className="qz-media aspect-[4/5]">
          <YouTubeThumb youtubeId={review.youtubeId} alt="" cropLetterboxOnFallback />
          <div className="qz-scrim" />
          <span className="absolute left-4 top-4">
            <RatingRing value={review.rating} />
          </span>
          <span className="absolute inset-x-0 bottom-0 p-5">
            <span className="qz-latin block text-[10px] text-white/60">{review.title}</span>
            <span className="mt-1 block font-[family-name:var(--font-quiver)] text-2xl font-normal leading-snug text-white">
              {review.titleAr || review.title}
            </span>
          </span>
        </div>
      </button>
      <p className="qz-body mt-4 line-clamp-3 text-[0.95rem]">{review.verdict}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="qz-chip">{review.mediaType}</span>
        {(review.tags ?? []).map((t) => (
          <span key={t} className="qz-chip">
            {t}
          </span>
        ))}
      </div>
    </article>
  )
}

/* سطر مقال (فهرس تحريري) */
export function ArticleRow({ article, index }) {
  return (
    <Link to={`/articles/${article.slug}`} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-5 gap-y-2 border-t border-[color:var(--qz-line)] py-7 sm:gap-x-8">
      <span className="qz-index qz-num w-8">{String(index).padStart(2, '0')}</span>
      <span className="min-w-0">
        <span className="block font-[family-name:var(--font-quiver)] text-[clamp(1.35rem,2.4vw,2rem)] font-normal leading-snug text-[color:var(--qz-text)] transition-colors duration-300 group-hover:text-[color:var(--qz-accent)]">
          {article.title}
        </span>
        {article.excerpt && <span className="qz-body mt-2 block line-clamp-2 max-w-2xl text-[0.95rem]">{article.excerpt}</span>}
        <span className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[color:var(--qz-text-3)]">
          <span>{article.category}</span>
          <span aria-hidden="true">·</span>
          <span className="qz-num">{fmtDate(article.date)}</span>
          {article.minutes ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="qz-num">{fmtMinutes(article.minutes)}</span>
            </>
          ) : null}
        </span>
      </span>
      <ArrowUpLeft className="size-5 text-[color:var(--qz-text-3)] transition-transform duration-500 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:text-[color:var(--qz-accent)]" aria-hidden="true" />
    </Link>
  )
}
