import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight, MapPin, Maximize2, X } from 'lucide-react'
import { stories } from '../data/stories.js'
import { Filters, PageHero } from '../components/qz/Kit.jsx'
import { Reveal, SPRING_SOFT } from '../components/motion/Motion.jsx'
import { lockScroll, unlockScroll } from '../lib/scroll.js'

/* ══ أرشيف الحكايات ═══════════════════════════════════════════════════
   خط زمني: كل حكاية فصل لوحده، السنة بخط ضخم بتفضل ثابتة (sticky) وانت
   بتقرا، والصورة بتتحرك أبطأ من الصفحة (parallax) فبتحس بعمق. الضغط
   على الصورة بيكبّرها لعارض كامل من نفس مكانها (layoutId)، والأسهم
   بتقلّب بين الحكايات. */

const big = (url) => url.replace(/w=\d+/, 'w=2000')

function Chapter({ story, index, onOpen, hidden }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-40, 40])

  return (
    <section ref={ref} className="grid gap-8 border-t border-[color:var(--qz-line)] py-16 sm:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      <div className="lg:sticky lg:top-32 lg:self-start">
        <Reveal y={10}>
          <p className="qz-index qz-num">{String(index + 1).padStart(2, '0')}</p>
          <p className="qz-num mt-3 font-[family-name:var(--font-quiver)] text-[clamp(4.5rem,11vw,10rem)] font-light leading-none text-[color:var(--qz-text)]">
            {story.year}
          </p>
          <p className="qz-eyebrow mt-5">{story.era}</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-[color:var(--qz-text-3)]">
            <MapPin className="size-4" aria-hidden="true" /> {story.location}
          </p>
        </Reveal>
      </div>
      <div>
        <button
          type="button"
          onClick={onOpen}
          className="group block w-full text-start"
          aria-label={`كبّر صورة: ${story.title}`}
          data-qz-silent
        >
          <motion.div
            layoutId={hidden ? undefined : `story-${story.id}`}
            className="qz-media aspect-[4/3] !rounded-[28px]"
            transition={SPRING_SOFT}
          >
            <motion.img style={{ y, scale: 1.12 }} src={story.image} alt={story.title} loading={index === 0 ? 'eager' : 'lazy'} />
            <span className="absolute left-4 top-4 grid size-11 place-items-center rounded-full border border-white/20 bg-black/30 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 className="size-4" aria-hidden="true" />
            </span>
          </motion.div>
        </button>
        <Reveal delay={0.05}>
          <h2 className="qz-h2 mt-8">{story.title}</h2>
          <p className="qz-lead mt-4">{story.caption}</p>
          <p className="mt-5 font-[family-name:var(--font-text)] text-[1.05rem] leading-[2.05] text-[color:var(--qz-text-2)]">{story.story}</p>
        </Reveal>
      </div>
    </section>
  )
}

function Lightbox({ list, index, onClose, onMove }) {
  const story = list[index]
  const closeRef = useRef(null)
  useEffect(() => {
    lockScroll()
    const prev = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      // RTL: السهم الشمال = التالي
      if (e.key === 'ArrowLeft') onMove(1)
      if (e.key === 'ArrowRight') onMove(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      unlockScroll()
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose, onMove])

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={story.title} dir="rtl">
      <motion.div className="qz-cinema-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="qz-cinema" onClick={onClose}>
        <motion.div
          layoutId={`story-${story.id}`}
          className="relative overflow-hidden rounded-[24px] bg-black shadow-[0_60px_140px_-40px_rgb(0_0_0/0.9)]"
          style={{ width: 'min(1200px, 100%)', aspectRatio: '4 / 3', maxHeight: 'calc(100vh - 200px)' }}
          transition={SPRING_SOFT}
          onClick={(e) => e.stopPropagation()}
        >
          <img src={big(story.image)} alt={story.title} className="absolute inset-0 size-full object-cover" />
        </motion.div>
        <motion.div
          className="qz-cinema-meta"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-0">
            <p className="qz-num text-xs font-semibold text-[color:var(--qz-accent)]">
              {story.year} · {story.location}
            </p>
            <p className="mt-1 font-[family-name:var(--font-quiver)] text-xl text-white sm:text-2xl">{story.title}</p>
          </div>
          {list.length > 1 && (
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => onMove(-1)} className="qz-cinema-close !static" aria-label="الحكاية السابقة">
                <ChevronRight className="size-5" />
              </button>
              <button type="button" onClick={() => onMove(1)} className="qz-cinema-close !static" aria-label="الحكاية التالية">
                <ChevronLeft className="size-5" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
      <button ref={closeRef} type="button" className="qz-cinema-close" onClick={onClose} aria-label="إغلاق العارض">
        <X className="size-5" />
      </button>
    </div>,
    document.body,
  )
}

export default function Stories() {
  const eras = useMemo(() => ['الكل', ...new Set(stories.map((s) => s.era))], [])
  const [era, setEra] = useState('الكل')
  const [open, setOpen] = useState(null)
  const list = era === 'الكل' ? stories : stories.filter((s) => s.era === era)
  const close = useCallback(() => setOpen(null), [])
  const move = useCallback((d) => setOpen((i) => (i === null ? i : (i + d + list.length) % list.length)), [list.length])

  return (
    <div>
      <PageHero
        index="—"
        eyebrow="عدسة وذاكرة"
        title={'أرشيف\nالحكايات'}
        lead="صور قديمة وحكاياتها: أماكن وأزمنة وناس، زي ما حفظتها الكاميرا. انزل في الزمن حكاية حكاية."
      />

      {eras.length > 2 && (
        <div className="mt-12">
          <Filters id="eras" items={eras} value={era} onChange={setEra} label="الحقبة" />
        </div>
      )}

      <div className="mt-10">
        {list.map((s, i) => (
          <Chapter key={s.id} story={s} index={i} hidden={open === i} onOpen={() => setOpen(i)} />
        ))}
        <div className="qz-rule" />
      </div>

      <AnimatePresence>
        {open !== null && list[open] && (
          <Lightbox
            key="lightbox"
            list={list}
            index={open}
            onClose={close}
            onMove={move}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
