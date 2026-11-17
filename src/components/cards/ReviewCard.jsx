import { useState } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import { Bookmark, Check, Share2, Eye, EyeOff } from 'lucide-react'
import GlassCard from '../glass/GlassCard.jsx'

export default function ReviewCard({ review }) {
  const [saved, setSaved] = useState(() => {
    try {
      const list = JSON.parse(localStorage.getItem('qassim_watchlist') || '[]')
      return list.includes(review.id)
    } catch {
      return false
    }
  })
  const [copied, setCopied] = useState(false)
  const [showSpoiler, setShowSpoiler] = useState(false)

  // إحداثيات لمعة الضوء ثلاثية الأبعاد على سطح الزجاج
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const toggleWatchlist = () => {
    try {
      const list = JSON.parse(localStorage.getItem('qassim_watchlist') || '[]')
      const updated = saved
        ? list.filter((id) => id !== review.id)
        : [...list, review.id]
      localStorage.setItem('qassim_watchlist', JSON.stringify(updated))
      setSaved(!saved)
    } catch {
      setSaved(!saved)
    }
  }

  const handleShareVerdict = async () => {
    const text = `حُكم الفِردِكت على "${review.title}": ${review.rating}/10 — ${review.verdict}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // تجاهل في حال منع المتصفح النسخ
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onMouseMove={handleMouseMove}
      className="group relative"
    >
      <GlassCard className="liquid-glass-hover relative overflow-hidden p-3">
        {/* لمعة إضاءة زمردية تتبع الماوس */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                420px circle at ${mouseX}px ${mouseY}px,
                rgb(var(--qz-sage-rgb)/0.14),
                transparent 80%
              )
            `,
          }}
        />

        <div className="relative z-10 overflow-hidden rounded-2xl">
          <LiteYouTubeEmbed
            id={review.youtubeId}
            title={`إعلان ${review.title}`}
            poster="hqdefault"
            noCookie
          />
        </div>

        <div className="relative z-10 px-2 pb-2 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-medium tracking-wider text-[color:var(--qz-sage)]">
                {review.mediaType}
              </span>
              {/* ✅ عنوان الفيلم أو المسلسل بخط Liftaswash السينمائي
                  (الخط عربي بس ومافيهوش حروف إنجليزي — عشان كده كان العنوان الإنجليزي بيظهر بخط عادي،
                  فبقى العنوان العربي بالخط ده، والإنجليزي تحته صغير) */}
              <h3
                lang="ar"
                className="font-cinema mt-1.5 text-[1.7rem] leading-snug text-[color:var(--qz-mint)]"
              >
                {review.titleAr || review.title}
              </h3>
              {review.titleAr && (
                <span dir="ltr" className="mt-0.5 block text-right font-sans text-[11px] font-medium tracking-[0.12em] text-[color:var(--qz-sage)]/80 uppercase">
                  {review.title}
                </span>
              )}
            </div>

            <div className="shrink-0 rounded-2xl border border-[color:var(--qz-sage)]/25 bg-[color:var(--qz-deep)]/85 px-3 py-2 text-center">
              <span className="block text-lg font-bold text-[color:var(--qz-mint)]">
                {review.rating}
                <span className="text-xs text-[color:var(--qz-sage)]">/10</span>
              </span>
              <span className="text-[10px] text-[color:var(--qz-sage)]/80">الفِردِكت</span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-[color:var(--qz-mint)]/85">
            {review.verdict}
          </p>

          {/* درع حرق الأحداث الاختياري (يظهر فقط إذا أضفت حقل spoiler للعمل) */}
          {review.spoiler && (
            <div className="mt-4 rounded-2xl border border-[color:var(--qz-sage)]/20 bg-[color:var(--qz-ink)]/70 p-3">
              <button
                type="button"
                onClick={() => setShowSpoiler((prev) => !prev)}
                className="flex w-full items-center justify-between text-xs font-medium text-[color:var(--qz-sage)] hover:text-[color:var(--qz-mint)]"
              >
                <span>تحليل النهاية (يحتوي على حرق)</span>
                <span className="flex items-center gap-1">
                  {showSpoiler ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {showSpoiler ? 'إخفاء' : 'كشف'}
                </span>
              </button>
              {showSpoiler && (
                <p className="mt-2.5 border-t border-[color:var(--qz-sage)]/15 pt-2.5 text-xs leading-6 text-[color:var(--qz-mint)]/80">
                  {review.spoiler}
                </p>
              )}
            </div>
          )}

          {/* التصنيفات + أزرار الحفظ والمشاركة */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[color:var(--qz-sage)]/10 pt-3.5">
            <div className="flex flex-wrap gap-1.5">
              {review.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[color:var(--qz-sage)]/15 bg-[color:var(--qz-deep)]/60 px-2.5 py-1 text-xs text-[color:var(--qz-sage)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={toggleWatchlist}
                title={saved ? 'محفوظ في قائمتك' : 'حفظ للمشاهدة لاحقاً'}
                className={`grid size-8 place-items-center rounded-full border transition ${
                  saved
                    ? 'border-[color:var(--qz-sage)]/50 bg-[color:var(--qz-forest)] text-[color:var(--qz-mint)]'
                    : 'border-[color:var(--qz-sage)]/20 bg-[color:var(--qz-ink)]/60 text-[color:var(--qz-sage)] hover:text-[color:var(--qz-mint)]'
                }`}
              >
                <Bookmark className={`size-3.5 ${saved ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleShareVerdict}
                title="نسخ التقييم للمشاركة"
                className="flex h-8 items-center gap-1 rounded-full border border-[color:var(--qz-sage)]/20 bg-[color:var(--qz-ink)]/60 px-2.5 text-[11px] text-[color:var(--qz-sage)] transition hover:border-[color:var(--qz-sage)]/50 hover:text-[color:var(--qz-mint)]"
              >
                {copied ? <Check className="size-3.5 text-emerald-300" /> : <Share2 className="size-3.5" />}
                {copied && <span>تم النسخ</span>}
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}