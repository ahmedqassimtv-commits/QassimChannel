import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import LiquidSegmented from '../components/ui/LiquidSegmented.jsx'
import { Video, Flame, ExternalLink, RefreshCw } from 'lucide-react'
import VideoCard from '../components/cards/VideoCard.jsx'
import ShortCard from '../components/cards/ShortCard.jsx'
import { videos as localVideos } from '../data/videos.js'
import { YOUTUBE_CONFIG } from '../data/youtubeConfig.js'

const filters = ['الكل', 'وثائقيات', 'حلقات', 'لقطات قصيرة']

export default function Videos({ shorts = false }) {
  const [active, setActive] = useState(shorts ? 'لقطات قصيرة' : 'الكل')
  useEffect(() => { setActive(shorts ? 'لقطات قصيرة' : 'الكل') }, [shorts])
  const [remoteVideos, setRemoteVideos] = useState([])
  const [syncing, setSyncing] = useState(false)

  // الجلب التلقائي من وسيط Cloudflare Worker عند إعداده مع الاحتفاظ بالبيانات المحلية كاحتياطي
  useEffect(() => {
    if (!YOUTUBE_CONFIG.workerFeedUrl) return
    let ignore = false

    async function fetchChannelFeed() {
      setSyncing(true)
      try {
        const res = await fetch(YOUTUBE_CONFIG.workerFeedUrl)
        if (!res.ok) return
        const data = await res.json()
        if (!ignore && Array.isArray(data?.items)) {
          setRemoteVideos(data.items)
        }
      } catch {
        // عند تعذر الاتصال تبقى البيانات المحلية معروضة بسلاسة
      } finally {
        if (!ignore) setSyncing(false)
      }
    }

    fetchChannelFeed()
    return () => {
      ignore = true
    }
  }, [])

  // دمج الفيديوهات المجلوبة تلقائياً مع الفيديوهات المحلية بدون تكرار
  const allVideos = useMemo(() => {
    if (remoteVideos.length === 0) return localVideos
    const existingIds = new Set(localVideos.map((v) => v.youtubeId))
    const freshRemote = remoteVideos.filter((v) => !existingIds.has(v.youtubeId))
    return [...freshRemote, ...localVideos]
  }, [remoteVideos])

  const filtered = useMemo(
    () =>
      active === 'الكل'
        ? allVideos
        : allVideos.filter((video) => video.category === active),
    [active, allVideos]
  )

  const longFormVideos = useMemo(
    () => filtered.filter((video) => video.category !== 'لقطات قصيرة'),
    [filtered]
  )

  const shortVideos = useMemo(
    () => filtered.filter((video) => video.category === 'لقطات قصيرة'),
    [filtered]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* ترويسة المكتبة المرئية */}
      <header className="liquid-glass mb-9 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl border border-[color:var(--qz-sage)]/30 bg-[color:var(--qz-ink)] text-[color:var(--qz-sage)]">
              <Video className="size-4" />
            </span>
            <span className="font-mono text-xs font-bold tracking-[0.2em] text-[color:var(--qz-sage)]">
              VISUAL LIBRARY • المكتبة المرئية
            </span>
          </div>

          <div className="flex items-center gap-3">
            {syncing && (
              <span className="flex items-center gap-1.5 text-xs text-[color:var(--qz-sage)]">
                <RefreshCw className="size-3.5 animate-spin" />
                <span>تحديث القناة...</span>
              </span>
            )}
            <a
              href={YOUTUBE_CONFIG.channelUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-[color:var(--qz-mint)]/25 bg-[color:var(--qz-forest)]/85 px-4 py-2 text-xs font-bold text-[color:var(--qz-mint)] transition hover:border-[color:var(--qz-mint)]/45 hover:bg-[color:var(--qz-moss)]"
            >
              <span>قناة قاسم على يوتيوب</span>
              <ExternalLink className="size-3.5 text-[color:var(--qz-sage)]" />
            </a>
          </div>
        </div>

        <h1 className="thmanyah-swash mt-4 text-4xl font-black text-[color:var(--qz-mint)] sm:text-5xl">
          الفيديوهات
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--qz-sage)] sm:text-base">
          أفلام وثائقية، حلقات تحليلية، ولقطات قصيرة تُشاهد بتأنٍ داخل مساحة قاسم.
        </p>
      </header>

      {/* أزرار التصفية بفقاعة Liquid Glass */}
      <LiquidSegmented
        id="video-filters"
        className="mb-8"
        ariaLabel="تصفية الفيديوهات"
        options={filters.map((filter) => ({ value: filter, label: filter }))}
        value={active}
        onChange={setActive}
      />

      {/* قسم الحلقات الطويلة والوثائقيات (16:9) */}
      {longFormVideos.length > 0 && (
        <section className="mb-12">
          {active === 'الكل' && shortVideos.length > 0 && (
            <h2 className="mb-5 text-xl font-bold text-[color:var(--qz-mint)]">
              الحلقات والوثائقيات
            </h2>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            {longFormVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* قسم اللقطات القصيرة العمودية (Shorts 9:16) */}
      {shortVideos.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-2">
            <Flame className="size-5 text-[color:var(--qz-sage)]" />
            <h2 className="text-xl font-bold text-[color:var(--qz-mint)]">
              لقطات قصيرة <span className="font-mono text-xs text-[color:var(--qz-sage)]">SHORTS</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shortVideos.map((video) => (
              <ShortCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <p className="py-16 text-center text-[color:var(--qz-sage)]">
          لا توجد فيديوهات في هذا التصنيف بعد.
        </p>
      )}
    </motion.div>
  )
}
