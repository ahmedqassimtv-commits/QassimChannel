import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { reviews } from '../data/reviews.js'
import { Filters, PageHero, RatingRing, VerdictTile, fmtDate } from '../components/qz/Kit.jsx'
import { Reveal, SPRING } from '../components/motion/Motion.jsx'
import { useCinema } from '../components/qz/CinemaPlayer.jsx'
import YouTubeThumb from '../components/ui/YouTubeThumb.jsx'

/* ══ الفِردِكت ═════════════════════════════════════════════════════════
   أحكام قاسم على الأفلام والمسلسلات. أعلى عمل تقييماً في القسم بيتعرض
   كـ«حُكم الأسبوع» بعرض الشاشة ورقم ضخم، والباقي شبكة. التبديل بين
   الأفلام والمسلسلات بيغيّر المسار (/verdict/movies ↔ /verdict/series)
   من غير انتقال صفحة كامل — الشبكة بس بتعيد ترتيب نفسها. */

const SECTIONS = [
  { value: 'فيلم', label: 'أفلام', to: '/verdict/movies' },
  { value: 'مسلسل', label: 'مسلسلات', to: '/verdict/series' },
]

const asVideo = (r) => ({ youtubeId: r.youtubeId, title: r.titleAr || r.title, category: `الفِردِكت · ${r.mediaType}`, summary: r.verdict })

export default function Reviews({ defaultTab = 'فيلم' }) {
  const navigate = useNavigate()
  const cinema = useCinema()
  const [tag, setTag] = useState('الكل')
  useEffect(() => setTag('الكل'), [defaultTab])

  const section = useMemo(() => reviews.filter((r) => r.mediaType === defaultTab), [defaultTab])
  const tags = useMemo(() => ['الكل', ...new Set(section.flatMap((r) => r.tags ?? []))], [section])
  const list = tag === 'الكل' ? section : section.filter((r) => r.tags?.includes(tag))
  const top = [...section].sort((a, b) => b.rating - a.rating)[0]
  const grid = tag === 'الكل' ? list.filter((r) => r !== top) : list

  return (
    <div>
      <PageHero
        index="—"
        eyebrow="THE VERDICT"
        title="الفِردِكت"
        lead="أحكام صادقة على السينما والمسلسلات: إيه اللي نجح، وإيه اللي وقع، وليه يستاهل وقتك أو لأ."
      >
        <Filters
          id="verdict-section"
          items={SECTIONS}
          value={defaultTab}
          onChange={(v) => navigate(SECTIONS.find((s) => s.value === v).to)}
          label="نوع العمل"
        />
      </PageHero>

      <AnimatePresence mode="wait">
        {top && tag === 'الكل' && (
          <motion.section
            key={top.id}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
            transition={SPRING}
            className="mt-14"
          >
            <button
              type="button"
              onClick={() => cinema.open(asVideo(top))}
              className="qz-panel group qz-hover-zoom grid w-full overflow-hidden text-start lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
              data-qz-silent
            >
              <div className="qz-media relative !rounded-none aspect-video lg:aspect-auto lg:min-h-[440px]">
                <YouTubeThumb youtubeId={top.youtubeId} alt="" loading="eager" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="qz-play !size-20">
                    <Play className="size-7 fill-current" aria-hidden="true" />
                  </span>
                </span>
              </div>
              <div className="flex flex-col justify-between gap-8 p-7 sm:p-10">
                <div>
                  <p className="qz-eyebrow">حُكم القسم الأعلى</p>
                  <p className="qz-latin mt-6 text-xs text-[color:var(--qz-text-3)]">{top.title}</p>
                  <h2 className="qz-h2 mt-2">{top.titleAr || top.title}</h2>
                  <p className="mt-6 border-s-2 border-[color:var(--qz-accent)] ps-5 font-[family-name:var(--font-quiver)] text-xl font-light leading-loose text-[color:var(--qz-text)]">
                    {top.verdict}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-6">
                  <div className="flex flex-wrap gap-2">
                    {(top.tags ?? []).map((t) => (
                      <span key={t} className="qz-chip">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-end gap-4">
                    <RatingRing value={top.rating} size={64} />
                    <p className="qz-num font-[family-name:var(--font-quiver)] text-7xl font-light leading-none text-[color:var(--qz-accent)]">
                      {top.rating}
                      <span className="text-2xl text-[color:var(--qz-text-3)]">/10</span>
                    </p>
                  </div>
                </div>
              </div>
            </button>
            {top.date && <p className="qz-num mt-3 text-xs text-[color:var(--qz-text-3)]">{fmtDate(top.date)}</p>}
          </motion.section>
        )}
      </AnimatePresence>

      {tags.length > 2 && (
        <Reveal className="mt-16">
          <Filters id="verdict-tags" items={tags} value={tag} onChange={setTag} label="التصنيف" />
        </Reveal>
      )}

      <motion.div layout className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {grid.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
              transition={SPRING}
            >
              <VerdictTile review={r} onPlay={() => cinema.open(asVideo(r))} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {section.length === 0 && <p className="qz-body mt-16 text-center">لسه مفيش أحكام هنا. قريب.</p>}
    </div>
  )
}
