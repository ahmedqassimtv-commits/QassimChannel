import { Link } from 'react-router-dom'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import GlassCard from '../glass/GlassCard.jsx'
import MorphTooltip from '../ui/MorphTooltip.jsx'

export default function VideoCard({ video }) {
  return (
    <GlassCard className="liquid-glass-hover group p-3">
      <div className="overflow-hidden rounded-2xl">
        <LiteYouTubeEmbed id={video.youtubeId} title={video.title} poster="hqdefault" noCookie />
      </div>
      <div className="px-2 pb-2 pt-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-neutral-400">
          <MorphTooltip label={`تصنيف الفيديو: ${video.category}`}><span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-2.5 py-1 text-emerald-200">{video.category}</span></MorphTooltip>
          <time dateTime={video.date}>{new Date(`${video.date}T00:00:00`).toLocaleDateString('ar', { year: 'numeric', month: 'short' })}</time>
        </div>
        <h3 className="text-lg font-semibold text-white">{video.title}</h3>
        <p className="mt-2 text-sm leading-7 text-neutral-400">{video.summary}</p>
      </div>
    </GlassCard>
  )
}
