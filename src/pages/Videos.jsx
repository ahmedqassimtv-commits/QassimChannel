import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { videos as localVideos } from '../data/videos.js'
import { YOUTUBE_CONFIG } from '../data/youtubeConfig.js'
import { Filters, PageHero, SectionHead, ShortTile, VideoTile } from '../components/qz/Kit.jsx'
import { Reveal, Stagger, StaggerItem, SPRING } from '../components/motion/Motion.jsx'

/* ══ الفيديوهات ═══════════════════════════════════════════════════════
   الحلقة الأحدث بعرض الشاشة (تفتح مشغّل السينما)، وتحتها فلاتر بفقاعة
   بتتزحلق، وشبكة الحلقات بتعيد ترتيب نفسها بنعومة (layout) مع الفلتر،
   والشورتس في شريط عمودي لوحدها. /videos/shorts = نفس الصفحة بفلتر. */

const FILTERS = ['الكل', 'حلقات', 'وثائقيات', 'لقطات قصيرة']
const isShort = (v) => v.type === 'short' || v.category === 'لقطات قصيرة'

export default function Videos({ shorts = false }) {
  const navigate = useNavigate()
  const [active, setActive] = useState(shorts ? 'لقطات قصيرة' : 'الكل')
  const [remote, setRemote] = useState([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => setActive(shorts ? 'لقطات قصيرة' : 'الكل'), [shorts])

  // جلب أحدث فيديوهات القناة من وسيط Cloudflare Worker لو متضبط، والمحلي احتياطي
  useEffect(() => {
    if (!YOUTUBE_CONFIG.workerFeedUrl) return undefined
    let ignore = false
    setSyncing(true)
    fetch(YOUTUBE_CONFIG.workerFeedUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && Array.isArray(data?.items)) setRemote(data.items)
      })
      .catch(() => {})
      .finally(() => !ignore && setSyncing(false))
    return () => {
      ignore = true
    }
  }, [])

  const all = useMemo(() => {
    const ids = new Set(localVideos.map((v) => v.youtubeId))
    return [...remote.filter((v) => !ids.has(v.youtubeId)), ...localVideos]
  }, [remote])

  const longs = all.filter((v) => !isShort(v))
  const shortsList = all.filter(isShort)
  const featured = longs[0]
  const grid = active === 'الكل' ? longs.slice(1) : active === 'لقطات قصيرة' ? [] : longs.filter((v) => v.category === active)
  const showShorts = active === 'الكل' || active === 'لقطات قصيرة'

  const onFilter = (value) => {
    setActive(value)
    // المسار بيتبع الفلتر عشان رابط الشورتس يتشارك
    if (value === 'لقطات قصيرة' && !shorts) navigate('/videos/shorts', { replace: true })
    else if (value !== 'لقطات قصيرة' && shorts) navigate('/videos', { replace: true })
  }

  return (
    <div>
      <PageHero
        index="—"
        eyebrow="المكتبة المرئية"
        title="الفيديوهات"
        lead="أفلام وثائقية، حلقات تحليلية، ولقطات قصيرة تتشاف بتأنٍ. اضغط على أي فيديو يفتح في شاشة السينما."
        aside={
          <div className="flex flex-col items-start gap-3 lg:items-end">
            {syncing && (
              <span className="flex items-center gap-2 text-xs text-[color:var(--qz-text-3)]">
                <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" /> بنحدّث من القناة…
              </span>
            )}
            <a href={YOUTUBE_CONFIG.channelUrl} target="_blank" rel="noreferrer" className="qz-btn qz-btn-ghost">
              القناة على يوتيوب
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </div>
        }
      />

      {featured && active === 'الكل' && (
        <Reveal className="mt-12">
          <VideoTile video={featured} size="lg" priority />
        </Reveal>
      )}

      <div className="sticky top-[92px] z-20 mt-16 flex justify-center lg:top-[84px]">
        <Filters id="videos" items={FILTERS} value={active} onChange={onFilter} label="تصفية الفيديوهات" />
      </div>

      {grid.length > 0 && (
        <section className="mt-12">
          <motion.div layout className="grid gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {grid.map((v) => (
                <motion.div
                  key={v.youtubeId}
                  layout
                  initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                  transition={SPRING}
                >
                  <VideoTile video={v} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      )}

      {active !== 'الكل' && active !== 'لقطات قصيرة' && grid.length === 0 && (
        <p className="qz-body mt-16 text-center">لسه مفيش فيديوهات في «{active}». قريب.</p>
      )}

      {showShorts && shortsList.length > 0 && (
        <section className="qz-section">
          <SectionHead index="◐" eyebrow="أقل من دقيقة" title="اللقطات القصيرة" />
          <Stagger className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
            {shortsList.map((v) => (
              <StaggerItem key={v.youtubeId}>
                <ShortTile video={v} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </div>
  )
}
