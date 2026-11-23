import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpLeft, BookOpen, MapPin } from 'lucide-react'
import { stories } from '../../data/stories.js'
import { ORIGIN_EASE } from '../../lib/motionTokens.js'
import { playGlassTap } from '../../utils/glassSound.js'

/* ══ StoriesSwipeDeck — بطاقات أرشيف الحكايات القابلة للسحب والتصفّح ══ */
export default function StoriesSwipeDeck() {
  const [index, setIndex] = useState(0)
  const reduce = useReducedMotion()
  const total = stories.length
  const current = stories[index] || stories[0]

  const next = () => {
    playGlassTap()
    setIndex((i) => (i + 1) % total)
  }
  const prev = () => {
    playGlassTap()
    setIndex((i) => (i - 1 + total) % total)
  }

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-black/45 p-6 backdrop-blur-md sm:p-8">
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
        {/* بطاقة الصورة المكدّسة القابلة للسحب */}
        <div className="relative mx-auto aspect-[16/10] w-full max-w-xl select-none">
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-y-3 scale-[0.95] rounded-[26px] border border-white/10 bg-white/[0.03]"
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              drag={reduce ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.22}
              onDragEnd={(_, info) => {
                if (info.offset.x < -55) next()
                else if (info.offset.x > 55) prev()
              }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, x: 24 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, x: -24 }}
              transition={{ duration: 0.75, ease: ORIGIN_EASE }}
              className="relative size-full cursor-grab overflow-hidden rounded-[26px] border border-white/15 bg-[color:var(--qz-ink)] shadow-[0_24px_60px_rgba(0,0,0,0.55)] active:cursor-grabbing"
            >
              <img
                src={current.image}
                alt={current.title}
                draggable={false}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs text-[color:var(--qz-accent)] backdrop-blur-sm">
                    <MapPin className="size-3" aria-hidden="true" />
                    <span>{current.location}</span>
                    <span>·</span>
                    <span className="qz-num">{current.year}</span>
                  </span>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                    {current.title}
                  </h3>
                </div>
                <span className="qz-num rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs font-bold text-white/85">
                  {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* تفاصيل الحكاية وأزرار التنقل */}
        <div className="flex flex-col justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-[color:var(--qz-accent)]">
              <BookOpen className="size-3.5" aria-hidden="true" />
              <span>حكاية من كتاب الأرشيف التفاعلي</span>
            </span>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-black text-white sm:text-3xl">
              {current.title}
            </h3>
            <p className="mt-3 font-[family-name:var(--font-text)] text-base leading-8 text-neutral-300">
              {current.caption}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="الحكاية السابقة"
                className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white transition duration-200 hover:bg-white/[0.12]"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="الحكاية التالية"
                className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white transition duration-200 hover:bg-white/[0.12]"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
              <div className="mr-2 flex items-center gap-1.5">
                {stories.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      playGlassTap()
                      setIndex(i)
                    }}
                    aria-label={`الانتقال إلى ${s.title}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index
                        ? 'w-6 bg-[color:var(--qz-accent)]'
                        : 'w-1.5 bg-white/25 hover:bg-white/45'
                    }`}
                  />
                ))}
              </div>
            </div>

            <Link
              to="/stories"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black transition duration-200 hover:bg-[color:var(--qz-mint)]"
            >
              <span>افتح كتاب الأرشيف</span>
              <ArrowUpLeft className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
