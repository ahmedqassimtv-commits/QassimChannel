import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import { Play } from 'lucide-react'
import GlassCard from '../glass/GlassCard.jsx'
import MorphTooltip from '../ui/MorphTooltip.jsx'
import { useCinema } from '../qz/CinemaPlayer.jsx'

export default function VideoCard({ video }) {
  const cinema = useCinema()
  return (
    <GlassCard className="liquid-glass-hover group rounded-[28px] p-3.5 transition-colors duration-200">
      <div className="relative overflow-hidden rounded-[22px]">
        <LiteYouTubeEmbed id={video.youtubeId} title={video.title} poster="maxresdefault" noCookie />
        {cinema && (
          <button
            type="button"
            onClick={() => cinema.open(video)}
            aria-label={`تشغيل ${video.title} في مشغل السينما`}
            className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md transition duration-200 hover:bg-white hover:text-black"
          >
            <Play className="size-3 fill-current" aria-hidden="true" />
            <span>وضع السينما</span>
          </button>
        )}
      </div>
      <div className="px-2 pb-2 pt-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-neutral-400">
          <MorphTooltip label={`تصنيف الفيديو: ${video.category}`}>
            <span className="rounded-full border border-[rgb(var(--qz-glow-rgb)/0.25)] bg-[rgb(var(--qz-glow-rgb)/0.08)] px-3 py-1 font-medium text-[color:var(--qz-accent)]">
              {video.category}
            </span>
          </MorphTooltip>
          <time dateTime={video.date} className="qz-num">
            {new Date(`${video.date}T00:00:00`).toLocaleDateString('ar', {
              year: 'numeric',
              month: 'short',
            })}
          </time>
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
          {video.title}
        </h3>
        <p className="mt-2 font-[family-name:var(--font-text)] text-sm leading-7 text-neutral-300">
          {video.summary}
        </p>
      </div>
    </GlassCard>
  )
}
