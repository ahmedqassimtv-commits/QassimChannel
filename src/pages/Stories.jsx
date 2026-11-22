import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LiquidSegmented from '../components/ui/LiquidSegmented.jsx'
import Typewriter from '../components/ui/Typewriter.jsx'
import { History, MapPin, Calendar, Maximize2, X, ChevronRight, ChevronLeft } from 'lucide-react'

const historicalStories = [
  {
    id: 'story-1',
    year: '1932',
    era: 'ثلاثينيات القرن العشرين',
    location: 'القاهرة — وسط البلد',
    title: 'صباحٌ هادئ قبل ازدحام الترام',
    caption: 'لقطة توثّق سكون الشوارع مع أول خيوط الفجر، حيث كانت الواجهات الحجرية والمقاهي الخشبية تحفظ إيقاع المدينة البطيء.',
    story: 'في مطلع الثلاثينيات، لم تكن شوارع وسط القاهرة قد عرفت بعد صخب السيارات الحديثة. كان الترام الكهربائي هو الشريان الرئيسي الذي يربط الأحياء، وكان باعة الصحف يبدأون جولتهم مع شروق الشمس حاملين أخبار العالم والأدب والسينما الصاعدة.',
    image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'story-2',
    year: '1954',
    era: 'خمسينيات القرن العشرين',
    location: 'الإسكندرية — الكورنيش القديم',
    title: 'ذاكرة البحر والضباب الشتوي',
    caption: 'عندما يلتقي موج المتوسط مع أرصفة الميناء العتيقة في صباح شتوي غائم.',
    story: 'كانت الإسكندرية في الخمسينيات ملتقى للثقافات واللغات؛ على امتداد الكورنيش وقفت المصورات الفوتوغرافية المتجولة توثق لحظات العابرين والبحارة، تاركةً أرشيفاً بصرياً يروي حكاية مدينة كانت تعيش على إيقاع البحر.',
    image: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'story-3',
    year: '1968',
    era: 'ستينيات القرن العشرين',
    location: 'الأقصر — الضفة الغربية',
    title: 'حوار الحجر والضوء عبر آلاف السنين',
    caption: 'ظلال الأعمدة الفرعونية وقت الغروب كما رصدتها عدسات البعثات الوثائقية.',
    story: 'في أواخر الستينيات، شهدت آثار صعيد مصر حملات توثيق فوتوغرافي دقيقة بالأبيض والأسود وبالألوان المبكرة، لتسجيل تفاصيل النقوش قبل أن تمتد إليها يد الترميم الحديث.',
    image: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1400&q=80',
  },
]

export default function Stories() {
  const [selectedEra, setSelectedEra] = useState('الكل')
  const [activeIndex, setActiveIndex] = useState(null)
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

  const eras = useMemo(() => {
    const list = new Set(historicalStories.map((s) => s.era))
    return ['الكل', ...Array.from(list)]
  }, [])

  const filteredStories = useMemo(() => {
    if (selectedEra === 'الكل') return historicalStories
    return historicalStories.filter((s) => s.era === selectedEra)
  }, [selectedEra])

  const activeStory = activeIndex !== null ? filteredStories[activeIndex] : null

  // نافذة الصورة: حبس التركيز داخلها وإعادته لمكانه عند الإغلاق
  useEffect(() => {
    if (!activeStory) return undefined
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement
    closeButtonRef.current?.focus()
    const handleTab = (event) => {
      if (event.key !== 'Tab' || !dialog) return
      const focusables = [...dialog.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => {
      document.removeEventListener('keydown', handleTab)
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus()
    }
  }, [activeStory])

  useEffect(() => {
    if (activeIndex === null) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setActiveIndex(null)
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev + 1) % filteredStories.length)
      }
      if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev - 1 + filteredStories.length) % filteredStories.length)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeIndex, filteredStories.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header className="mb-10 rounded-3xl border border-[color:var(--qz-sage)]/20 bg-[color:var(--qz-deep)]/55 p-6 backdrop-blur-md sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border border-[color:var(--qz-sage)]/30 bg-[color:var(--qz-ink)] text-[color:var(--qz-sage)]">
            <History className="size-4" />
          </span>
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-[color:var(--qz-sage)]">
            VISUAL ARCHIVE • عدسة وذاكرة
          </span>
        </div>

        <h1 className="font-history mt-4 text-4xl font-bold text-[color:var(--qz-mint)] sm:text-5xl">
          المكتبة وأرشيف الحكايات
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--qz-sage)] sm:text-base">
          <Typewriter text="مساحة للبحث في الصور والحكايات ومصادر الذاكرة الوثائقية." />
        </p>
      </header>

      <LiquidSegmented
        id="story-eras"
        className="mb-8"
        ariaLabel="تصفية حسب الحقبة الزمنية"
        options={eras.map((era) => ({ value: era, label: era }))}
        value={selectedEra}
        onChange={setSelectedEra}
      />

      <div className="space-y-8">
        {filteredStories.map((item, idx) => (
          <article
            key={item.id}
            className="group overflow-hidden rounded-3xl border border-[color:var(--qz-sage)]/20 bg-[color:var(--qz-deep)]/65 p-4 backdrop-blur-md transition hover:border-[color:var(--qz-sage)]/40 sm:p-6"
          >
            <div className="grid items-center gap-6 lg:grid-cols-12">
              <div
                onClick={() => setActiveIndex(idx)}
                className="relative cursor-zoom-in overflow-hidden rounded-2xl border border-[color:var(--qz-sage)]/15 bg-[color:var(--qz-ink)] lg:col-span-6"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src={item.image}
                  alt={item.title}
                  className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--qz-ink)]/80 via-transparent to-transparent" />
                <span className="absolute right-3 top-3 rounded-full border border-[color:var(--qz-sage)]/30 bg-[color:var(--qz-ink)]/85 px-3 py-1 font-mono text-xs font-bold text-[color:var(--qz-mint)] backdrop-blur-md">
                  {item.year}
                </span>
                <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-[color:var(--qz-sage)]/25 bg-[color:var(--qz-ink)]/85 px-3 py-1.5 text-xs text-[color:var(--qz-mint)] backdrop-blur-md">
                  <Maximize2 className="size-3.5 text-[color:var(--qz-sage)]" />
                  <span>تكبير الصورة</span>
                </span>
              </div>

              <div className="lg:col-span-6 lg:px-2">
                <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--qz-sage)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {item.era}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {item.location}
                  </span>
                </div>

                <h2 className="font-history mt-3 text-2xl font-bold leading-snug text-[color:var(--qz-mint)] sm:text-3xl">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm font-medium text-[color:var(--qz-sage)]">
                  {item.caption}
                </p>

                <p className="font-text mt-4 border-t border-[color:var(--qz-sage)]/15 pt-4 text-sm leading-8 text-[color:var(--qz-mint)]/85">
                  {item.story}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <AnimatePresence>
        {activeStory && (
          <motion.div
            key="story-lightbox-modal"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={activeStory.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8"
          >
            <div
              onClick={() => setActiveIndex(null)}
              className="fixed inset-0 bg-[color:var(--qz-ink)]/95 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[color:var(--qz-sage)]/30 bg-[color:var(--qz-deep)] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[color:var(--qz-sage)]/15 px-5 py-3.5">
                <div className="flex items-center gap-2 text-xs text-[color:var(--qz-sage)]">
                  <span className="rounded bg-[color:var(--qz-ink)] px-2 py-0.5 font-mono font-bold text-[color:var(--qz-mint)]">
                    {activeStory.year}
                  </span>
                  <span>{activeStory.location}</span>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={() => setActiveIndex(null)}
                  className="rounded-full border border-[color:var(--qz-sage)]/25 p-1.5 text-[color:var(--qz-mint)] transition hover:bg-[color:var(--qz-forest)]"
                  aria-label="إغلاق"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="relative flex-1 overflow-y-auto bg-[color:var(--qz-ink)]">
                <img
                  loading="lazy"
                  decoding="async"
                  src={activeStory.image}
                  alt={activeStory.title}
                  className="mx-auto max-h-[62vh] w-auto object-contain"
                />
              </div>

              <div className="border-t border-[color:var(--qz-sage)]/15 bg-[color:var(--qz-deep)] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-history text-xl font-bold text-[color:var(--qz-mint)] sm:text-2xl">
                      {activeStory.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-6 text-[color:var(--qz-mint)]/80 sm:text-sm">
                      {activeStory.story}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() =>
                        setActiveIndex((prev) => (prev - 1 + filteredStories.length) % filteredStories.length)
                      }
                      className="grid size-10 place-items-center rounded-full border border-[color:var(--qz-sage)]/25 bg-[color:var(--qz-ink)] text-[color:var(--qz-mint)] hover:bg-[color:var(--qz-forest)]"
                      aria-label="السابق"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                    <button
                      onClick={() => setActiveIndex((prev) => (prev + 1) % filteredStories.length)}
                      className="grid size-10 place-items-center rounded-full border border-[color:var(--qz-sage)]/25 bg-[color:var(--qz-ink)] text-[color:var(--qz-mint)] hover:bg-[color:var(--qz-forest)]"
                      aria-label="التالي"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
