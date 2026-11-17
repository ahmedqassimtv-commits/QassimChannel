import { useEffect, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { AudioLines, Play, Radio, Waves } from 'lucide-react'
import GlassSwitch from '../components/ui/GlassSwitch.jsx'
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
      className="inline-flex flex-wrap items-center gap-3 rounded-[28px] border border-[color:var(--qz-mint)]/20 bg-[color:var(--qz-ink)]/60 py-1.5 pe-4 ps-2 text-xs text-[color:var(--qz-sage)] backdrop-blur-md"
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
        <Waves className={`size-3.5 text-emerald-300 ${status === 'playing' ? 'animate-pulse' : 'opacity-50'}`} />
        <span className="whitespace-nowrap">{STATUS_LABELS[status] ?? STATUS_LABELS.idle}</span>
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <header className="liquid-glass rounded-3xl p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl border border-emerald-400/30 bg-[color:var(--qz-ink)] text-emerald-300">
              <Radio className="size-4" />
            </span>
            <span className="flex items-center gap-2 font-mono text-xs font-bold tracking-[0.2em] text-emerald-300">
              <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
              ON AIR • البث الاجتماعي الحيّ
            </span>
          </div>

          <OnAirPlayer />
        </div>

        <h1 className="thmanyah-swash mt-4 text-4xl font-black text-[color:var(--qz-mint)] sm:text-5xl">
          أون إير
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--qz-sage)] sm:text-base">
          مساحة متجددة تجمع منشورات قاسم اليومية، مقتطفاته السريعة، وتحديثاته عبر منصات التواصل الاجتماعي في مكان واحد.
        </p>
      </header>
    </motion.div>
  )
}