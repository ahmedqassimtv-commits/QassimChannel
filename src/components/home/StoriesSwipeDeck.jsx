import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import { ArrowUpLeft } from 'lucide-react'
import { stories } from '../../data/stories.js'

/* ══ أرشيف الحكايات: كوتشينة بتتسحب ════════════════════════════════════
   الكارت اللي فوق بيتسحب يمين أو شمال؛ لو اترمى بعيد أو بسرعة بيطير
   والي تحته بيطلع مكانه، ولو لأ بيرجع بنابض. الكروت اللي ورا متراصة
   ومايلة شوية. الأسهم في الكيبورد بتقلّب برضه. */

const THROW = 120

function TopCard({ story, onThrow, reduce }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 260], [-14, 14])
  const glare = useTransform(x, [-200, 0, 200], [0.18, 0, 0.18])
  return (
    <motion.article
      className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-[2rem] border border-white/10 bg-[color:var(--qz-ink)] shadow-[0_30px_70px_rgba(0,0,0,0.5)] active:cursor-grabbing"
      style={{ x, rotate }}
      drag={reduce ? false : 'x'}
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        const v = info.velocity.x
        const d = info.offset.x + v * 0.2
        if (Math.abs(d) > THROW) onThrow(d > 0 ? 1 : -1)
      }}
      initial={{ scale: 0.94, y: 18, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={(dir) => ({
        x: dir * 520,
        rotate: dir * 18,
        opacity: 0,
        transition: { duration: 0.35 },
      })}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <img
        src={story.image}
        alt=""
        draggable="false"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <motion.div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{ opacity: glare }}
      />
      <div className="absolute inset-x-0 bottom-0 p-7">
        <p className="text-xs text-emerald-200">
          {story.year} · {story.location}
        </p>
        <h3 className="mt-2 text-2xl font-bold leading-snug text-white">{story.title}</h3>
        <p className="mt-2 line-clamp-2 max-w-lg text-sm leading-7 text-neutral-300">
          {story.caption}
        </p>
        <Link
          to="/stories"
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md transition hover:bg-white/20"
        >
          اقرا الحكاية
          <ArrowUpLeft className="size-4" />
        </Link>
      </div>
    </motion.article>
  )
}

export default function StoriesSwipeDeck() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const n = stories.length
  const go = (d) => {
    setDir(d)
    setI((v) => (v + 1) % n)
  }
  const story = stories[i % n]
  const behind = [1, 2].map((k) => stories[(i + k) % n])

  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-md select-none sm:aspect-[16/11] sm:max-w-3xl"
      tabIndex={0}
      role="group"
      aria-roledescription="كروت"
      aria-label={`حكاية ${i + 1} من ${n}: ${story.title}. اسحب أو استخدم الأسهم`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1)
        else if (e.key === 'ArrowRight') go(1)
      }}
    >
      {behind
        .slice()
        .reverse()
        .map((s, k) => {
          const depth = 2 - k
          return (
            <div
              key={s.id + depth}
              aria-hidden="true"
              className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[color:var(--qz-ink)]"
              style={{
                transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.045}) rotate(${depth % 2 ? 2.5 : -2.5}deg)`,
                opacity: 1 - depth * 0.25,
              }}
            >
              <img src={s.image} alt="" className="size-full object-cover opacity-50" />
            </div>
          )
        })}
      <AnimatePresence custom={dir} initial={false}>
        <TopCard key={story.id + i} story={story} onThrow={go} reduce={reduce} />
      </AnimatePresence>
      <p className="absolute -bottom-9 inset-x-0 text-center text-xs text-neutral-400">
        اسحب الكارت يمين أو شمال · {i + 1} / {n}
      </p>
    </div>
  )
}
