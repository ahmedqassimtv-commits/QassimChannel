import { useEffect, useSyncExternalStore } from 'react'
import { AudioLines, Play, Radio, Waves } from 'lucide-react'
import GlassSwitch from '../components/ui/GlassSwitch.jsx'
import { FoldingBill } from '../components/onair/FoldingBill.tsx'
import { PageHero, SectionHead, ShortTile, VideoTile } from '../components/qz/Kit.jsx'
import { Stagger, StaggerItem } from '../components/motion/Motion.jsx'
import { videos } from '../data/videos.js'
import {
  getOnAirState,
  startOnAirAmbient,
  stopOnAirAmbient,
  subscribeOnAir,
  toggleOnAirPlayback,
} from '../utils/glassSound.js'

const STATUS_LABELS = {
  idle: 'جاهز للتشغيل',
  loading: 'جاري التشغيل…',
  playing: 'أجواء صوتية محيطية نشطة',
  paused: 'الموسيقى متوقفة',
  blocked: 'اضغط في أي مكان لتشغيل الموسيقى',
  fallback: 'أجواء صوتية بديلة',
}

// مشغل مصغّر بستايل الزجاج السائل: تشغيل/إيقاف بس (الصوت بيظهر ويختفي تدريجياً)
function OnAirPlayer() {
  const { status } = useSyncExternalStore(subscribeOnAir, getOnAirState, getOnAirState)
  const isPlaying = status === 'playing' || status === 'loading' || status === 'fallback'

  return (
    <div
      className="inline-flex max-w-full flex-wrap items-center gap-3 rounded-[28px] border border-[color:var(--qz-line)] bg-[color:var(--qz-glass-1)] py-1.5 pe-4 ps-2 text-xs text-[color:var(--qz-text-2)] backdrop-blur-md"
      role="group"
      aria-label="مشغل موسيقى أون إير"
    >
      {/* سويتش التشغيل الزجاجي (زي الصور المرجعية) */}
      <GlassSwitch
        checked={isPlaying}
        onChange={() => toggleOnAirPlayback()}
        labelOn="على الهوا"
        labelOff="تشغيل"
        iconOn={AudioLines}
        iconOff={Play}
        ariaLabel={isPlaying ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        size="md"
      />

      <span className="flex items-center gap-1.5" aria-live="polite">
        <Waves className={`size-3.5 text-[color:var(--qz-accent)] ${status === 'playing' ? 'animate-pulse' : 'opacity-50'}`} />
        <span className="sm:whitespace-nowrap">{STATUS_LABELS[status] ?? STATUS_LABELS.idle}</span>
      </span>
    </div>
  )
}

export default function OnAir() {
  useEffect(() => {
    // التشغيل + إعادة المحاولة بعد أول تفاعل لو المتصفح منع الـ Autoplay بقوا جوه المحرك نفسه
    startOnAirAmbient()
    return () => stopOnAirAmbient()
  }, [])

  return (
    <div>
      <PageHero
        index="—"
        eyebrow="مساحة · البث الاجتماعي الحيّ"
        title="أون إير"
        lead="مساحة متجددة بتجمع منشورات قاسم اليومية، مقتطفاته السريعة، وتحديثاته على المنصات في مكان واحد — على موسيقى هادية."
        aside={
          /* ورقة قاسمز الزجاجية — اسحبها واطويها (three.js بيتحمّل مع الصفحة دي بس) */
          <div className="flex flex-col items-center gap-3">
            <FoldingBill />
            <span className="text-xs text-[color:var(--qz-text-3)]">اسحب الورقة واطويها</span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="qz-chip qz-chip-live">
            <Radio className="size-3.5" aria-hidden="true" /> على الهوا
          </span>
          <OnAirPlayer />
        </div>
      </PageHero>

      <section className="qz-section">
        <SectionHead index="01" eyebrow="من القناة" title="آخر ما اتنشر" to="/videos" cta="كل الفيديوهات" />
        <Stagger className="grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {videos.slice(0, 3).map((v) => (
            <StaggerItem key={v.id}>
              {v.type === 'short' ? <ShortTile video={v} /> : <VideoTile video={v} />}
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  )
}
