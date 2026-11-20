import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ExternalLink, X } from 'lucide-react'
import YouTubeThumb from '../ui/YouTubeThumb.jsx'
import { lockScroll, unlockScroll } from '../../lib/scroll.js'
import { SPRING_SOFT } from '../motion/Motion.jsx'

/* ══ مشغّل السينما ═══════════════════════════════════════════════════
   أي فيديو في الموقع بيفتح هنا: الصفحة بتغمق وتتموّه، والصورة المصغّرة
   بتكبر من مكانها لحد ما تبقى شاشة العرض (layoutId مشترك بين الكارت
   والمشغّل)، وبعدها يوتيوب بيبدأ. Esc أو برّه الشاشة بيقفل، والصورة
   بترجع لكارتها بنفس الطريق (اتساق مكاني).

   الاستخدام: const cinema = useCinema(); cinema.open(video)
   والكارت يلبس <CinemaThumb video={v} /> عشان الانتقال المشترك يشتغل. */

const CinemaContext = createContext({ open: () => {}, close: () => {}, current: null })

export function useCinema() {
  return useContext(CinemaContext)
}

const isShort = (v) => v?.type === 'short'

/* الصورة المصغّرة القابلة للتمدد: نفس layoutId في الكارت وفي المشغّل */
export function CinemaThumb({ video, className = '', imgClassName = '', priority = false }) {
  const { current } = useCinema()
  const playing = current?.youtubeId === video.youtubeId
  return (
    <motion.div
      layoutId={playing ? undefined : `cinema-${video.youtubeId}`}
      className={`qz-media ${className}`}
      transition={SPRING_SOFT}
    >
      <YouTubeThumb
        youtubeId={video.youtubeId}
        alt=""
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        cropLetterboxOnFallback={isShort(video)}
        className={imgClassName}
      />
    </motion.div>
  )
}

function Player({ video, onClose }) {
  const reduce = useReducedMotion()
  const [ready, setReady] = useState(false)
  const src = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&color=white`

  useEffect(() => {
    lockScroll()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      unlockScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <>
      <motion.div
        className="qz-cinema-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.35 } }}
        onClick={onClose}
      />
      <div className="qz-cinema" role="dialog" aria-modal="true" aria-label={video.title} dir="rtl" onClick={onClose}>
        <motion.div
          layoutId={reduce ? undefined : `cinema-${video.youtubeId}`}
          className={`qz-cinema-frame ${isShort(video) ? 'is-short' : ''}`}
          transition={SPRING_SOFT}
          onLayoutAnimationComplete={() => setReady(true)}
          onClick={(e) => e.stopPropagation()}
        >
          <YouTubeThumb youtubeId={video.youtubeId} alt="" loading="eager" cropLetterboxOnFallback={isShort(video)} />
          {(ready || reduce) && (
            <iframe
              src={src}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          )}
        </motion.div>
        <motion.div
          className="qz-cinema-meta"
          style={isShort(video) ? { width: 'min(420px, 100%)' } : undefined}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.5 } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-0">
            {video.category && <p className="text-xs font-semibold text-[color:var(--qz-accent)]">{video.category}</p>}
            <h2 className="mt-1 font-[family-name:var(--font-quiver)] text-xl font-semibold leading-snug sm:text-2xl">{video.title}</h2>
            {video.summary && <p className="mt-1 hidden max-w-2xl text-sm leading-7 text-white/65 sm:block">{video.summary}</p>}
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noreferrer"
            className="qz-btn qz-btn-ghost hidden shrink-0 sm:inline-flex"
            style={{ height: 42 }}
          >
            يوتيوب
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </motion.div>
      </div>
      <motion.button
        type="button"
        className="qz-cinema-close"
        aria-label="إغلاق المشغّل"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={onClose}
      >
        <X className="size-5" />
      </motion.button>
    </>
  )
}

export function CinemaProvider({ children }) {
  const [current, setCurrent] = useState(null)
  const open = useCallback((video) => setCurrent(video), [])
  const close = useCallback(() => setCurrent(null), [])
  const value = useMemo(() => ({ open, close, current }), [open, close, current])
  return (
    <CinemaContext.Provider value={value}>
      {children}
      <AnimatePresence>{current && <Player key={current.youtubeId} video={current} onClose={close} />}</AnimatePresence>
    </CinemaContext.Provider>
  )
}
