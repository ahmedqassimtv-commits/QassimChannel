import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Film, Tv, Sparkles } from 'lucide-react'
import ReviewCard from '../components/cards/ReviewCard.jsx'
import LiquidSegmented from '../components/ui/LiquidSegmented.jsx'
import WeightWave from '../components/ui/WeightWave.jsx'
import PlanSwitch from '../components/ui/PlanSwitch.jsx'
import { reviews } from '../data/reviews.js'

const SECTION_OPTIONS = [
  { value: 'فيلم', label: 'مراجعات الأفلام', to: '/verdict/movies' },
  { value: 'مسلسل', label: 'مراجعات المسلسلات', to: '/verdict/series' },
  { value: 'حلقات', label: 'المواسم والحلقات', to: '/verdict/series?view=episodes' },
]

export default function Reviews({ defaultTab = 'فيلم' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedTag, setSelectedTag] = useState('الكل')
  // الفقاعة بتتحرك فوراً، والتنقل بيحصل في نفس اللحظة (الصفحة نفسها مش بتتشال فالفقاعة بتكمل حركتها)
  const activeSection = new URLSearchParams(location.search).get('view') === 'episodes' ? 'حلقات' : defaultTab

  // إعادة ضبط فلتر التصنيف عند التنقل بين الأفلام والمسلسلات
  useEffect(() => {
    setSelectedTag('الكل')
  }, [defaultTab])

  const isMovies = defaultTab === 'فيلم'

  // فلترة الأعمال حسب القسم (أفلام فقط أو مسلسلات فقط)
  const sectionItems = useMemo(
    // لا توجد مراجعات بنوع 'حلقة' في البيانات؛ وضع «حلقات» يعرض المسلسلات
    // (الحلقات جزء من المسلسل) بدل قائمة فارغة دائماً.
    () => activeSection === 'حلقات' ? reviews.filter((item) => item.mediaType === 'مسلسل') : reviews.filter((item) => item.mediaType === defaultTab),
    [defaultTab, activeSection]
  )

  // استخراج التصنيفات الموجودة داخل هذا القسم فقط
  const availableTags = useMemo(() => {
    const tagsSet = new Set()
    sectionItems.forEach((item) => item.tags?.forEach((tag) => tagsSet.add(tag)))
    return ['الكل', ...Array.from(tagsSet)]
  }, [sectionItems])

  // الفلترة النهائية بالتصنيف المختار
  const filteredItems = useMemo(() => {
    if (selectedTag === 'الكل') return sectionItems
    return sectionItems.filter((item) => item.tags?.includes(selectedTag))
  }, [sectionItems, selectedTag])

  return (
    <div>
      {/* ترويسة القسم بستايل هوليوودي (THE VERDICT) */}
      <header className="mb-10 rounded-3xl border border-[color:var(--qz-sage)]/20 bg-[color:var(--qz-deep)]/55 p-6 backdrop-blur-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl border border-[color:var(--qz-sage)]/30 bg-[color:var(--qz-ink)] text-[color:var(--qz-sage)]">
              {isMovies ? <Film className="size-4" /> : <Tv className="size-4" />}
            </span>
            <span className="font-mono text-xs font-bold tracking-[0.22em] text-[color:var(--qz-sage)]">
              THE VERDICT • {isMovies ? 'CINEMA' : 'SERIES'}
            </span>
          </div>

          {/* تبديل الأفلام/المسلسلات بفقاعة liquidGL */}
          <PlanSwitch
            options={SECTION_OPTIONS}
            value={activeSection}
            onChange={(next) => {
              const target = SECTION_OPTIONS.find((o) => o.value === next)
              if (target) navigate(target.to)
            }}
          />
        </div>

        <h1 className="font-cinema mt-4 text-5xl leading-[1.35] text-[color:var(--qz-mint)] sm:text-6xl">
          <WeightWave text={activeSection === 'حلقات' ? 'المواسم والحلقات' : isMovies ? 'حُكم السينما' : 'حُكم المسلسلات'} />
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--qz-sage)] sm:text-base">
          {isMovies
            ? 'قراءات نقدية وتقييمات صريحة لأبرز الأفلام السينمائية، بلا حرق قدر الإمكان.'
            : 'تحليل درامي وتقييم شامل للمواسم والحلقات التي تستحق وقتك أمام الشاشة.'}
        </p>
      </header>

      <motion.div
        key={defaultTab}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >

      {/* شريط التصنيفات الداخلية */}
      {availableTags.length > 1 && (
        <LiquidSegmented
          id="verdict-tags"
          className="mb-8"
          size="sm"
          ariaLabel="تصفية حسب النوع"
          options={availableTags.map((tag) => ({ value: tag, label: tag }))}
          value={selectedTag}
          onChange={setSelectedTag}
        />
      )}

      {/* شبكة البطاقات */}
      {filteredItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredItems.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-[color:var(--qz-sage)]/15 bg-[color:var(--qz-deep)]/40 p-12 text-center">
          <Sparkles className="mx-auto mb-3 size-6 text-[color:var(--qz-sage)]" />
          <p className="text-sm text-[color:var(--qz-mint)]">
            لا توجد مراجعات منشورة في قسم {activeSection === 'حلقات' ? 'المواسم والحلقات' : isMovies ? 'الأفلام' : 'المسلسلات'} حالياً.
          </p>
        </div>
      )}
      </motion.div>
    </div>
  )
}
