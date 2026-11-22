import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { stories } from '../data/stories.js'
import { SPRING_SOFT } from '../components/motion/Motion.jsx'
import { lockScroll, unlockScroll } from '../lib/scroll.js'
import TapeArchive from '../components/stories/TapeArchive.tsx'
import { YOUTUBE_CONFIG } from '../data/youtubeConfig.js'

/* ══ أرشيف الحكايات ═══════════════════════════════════════════════════
   الصفحة كلها «الشريط اللي بيلم الحكايات» (components/stories/TapeArchive):
   صور الأرشيف متلزّقة بشريط بيتلف مع السكرول. الضغط على أي صورة بيفتح
   الحكاية كاملة في العارض (Lightbox)، والأسهم بتقلّب بين الحكايات. */

const big = (url) => url.replace(/w=\d+/, 'w=2000')

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
      <motion.div
        className="qz-cinema-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <div className="qz-cinema" onClick={onClose}>
        <motion.div
          layoutId={`story-${story.id}`}
          exit={{ opacity: 0 }}
          className="relative overflow-hidden rounded-[24px] bg-black shadow-[0_60px_140px_-40px_rgb(0_0_0/0.9)]"
          style={{
            width: 'min(1200px, 100%)',
            aspectRatio: '4 / 3',
            maxHeight: 'calc(100vh - 200px)',
          }}
          transition={SPRING_SOFT}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={big(story.image)}
            alt={story.title}
            className="absolute inset-0 size-full object-cover"
          />
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
            <p className="mt-1 font-[family-name:var(--font-quiver)] text-xl text-white sm:text-2xl">
              {story.title}
            </p>
          </div>
          {list.length > 1 && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onMove(-1)}
                className="qz-cinema-close !static"
                aria-label="الحكاية السابقة"
              >
                <ChevronRight className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                className="qz-cinema-close !static"
                aria-label="الحكاية التالية"
              >
                <ChevronLeft className="size-5" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
      <button
        ref={closeRef}
        type="button"
        className="qz-cinema-close"
        onClick={onClose}
        aria-label="إغلاق العارض"
      >
        <X className="size-5" />
      </button>
    </div>,
    document.body,
  )
}

export default function Stories() {
  const [open, setOpen] = useState(null)
  const close = useCallback(() => setOpen(null), [])
  const move = useCallback(
    (d) => setOpen((i) => (i === null ? i : (i + d + stories.length) % stories.length)),
    [],
  )

  return (
    <div className="qz-tape-page">
      <TapeArchive stories={stories} onOpen={setOpen} channelUrl={YOUTUBE_CONFIG.channelUrl} />

      <AnimatePresence>
        {open !== null && stories[open] && (
          <Lightbox key="lightbox" list={stories} index={open} onClose={close} onMove={move} />
        )}
      </AnimatePresence>
    </div>
  )
}
