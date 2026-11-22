import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Flame } from 'lucide-react'

export default function ShortCard({ video }) {
  const [playing, setPlaying] = useState(false)
  const thumbnail =
    video.thumbnail || `https://i.ytimg.com/vi/${video.youtubeId}/oar2.jpg`

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="liquid-glass liquid-glass-hover group relative overflow-hidden rounded-3xl p-2.5"
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-[color:var(--qz-ink)]">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&playsinline=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="relative block h-full w-full text-right focus:outline-none"
            aria-label={`تشغيل ${video.title}`}
          >
            <img
              src={thumbnail}
              onError={(e) => {
                e.currentTarget.src = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
              }}
              alt={video.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--qz-ink)] via-[color:var(--qz-ink)]/25 to-transparent" />

            {/* شارة Shorts */}
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-[color:var(--qz-mint)]/25 bg-[color:var(--qz-ink)]/80 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-[color:var(--qz-mint)] backdrop-blur-md">
              <Flame className="size-3 text-[color:var(--qz-sage)]" />
              SHORTS
            </span>

            {/* زر التشغيل الوسطي */}
            <span className="absolute inset-0 m-auto grid size-12 place-items-center rounded-full border border-[color:var(--qz-mint)]/40 bg-[color:var(--qz-forest)]/85 text-[color:var(--qz-mint)] shadow-xl backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-[color:var(--qz-moss)]">
              <Play className="size-5 fill-current" />
            </span>

            {/* عنوان المقطع أسفل الإطار */}
            <div className="absolute inset-x-0 bottom-0 p-3.5">
              <h3 className="font-display line-clamp-2 text-sm font-bold leading-snug text-[color:var(--qz-mint)]">
                {video.title}
              </h3>
              {video.duration && (
                <span className="mt-1.5 inline-block font-mono text-[11px] text-[color:var(--qz-sage)]">
                  {video.duration}
                </span>
              )}
            </div>
          </button>
        )}
      </div>
    </motion.article>
  )
}