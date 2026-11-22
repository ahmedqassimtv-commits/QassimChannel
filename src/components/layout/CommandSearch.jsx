import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Film, Tv, History, BookOpen, Video, Home, X, ArrowUpLeft } from 'lucide-react'

const quickDestinations = [
  { title: 'الرئيسية', subtitle: 'الواجهة العامة للمنصة', to: '/', icon: Home, group: 'التنقل السريع' },
  { title: 'حُكم السينما — THE VERDICT', subtitle: 'مراجعات وتقييمات الأفلام', to: '/verdict/movies', icon: Film, group: 'الفِردِكت (THE VERDICT)' },
  { title: 'حُكم المسلسلات — THE VERDICT', subtitle: 'مراجعات وتقييمات المسلسلات', to: '/verdict/series', icon: Tv, group: 'الفِردِكت (THE VERDICT)' },
  { title: 'أرشيف الحكايات المصورة', subtitle: 'صور تحكي قصصاً من التاريخ', to: '/stories', icon: History, group: 'الأقسام التحريرية' },
  { title: 'الفيديوهات', subtitle: 'مقاطع مرئية وتحليلات', to: '/videos', icon: Video, group: 'الأقسام التحريرية' },
  { title: 'المقالات', subtitle: 'قراءات طويلة ومقالات متأنية', to: '/articles', icon: BookOpen, group: 'الأقسام التحريرية' },
]

export default function CommandSearch({ open, onClose }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const filtered = quickDestinations.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.group.toLowerCase().includes(query.toLowerCase())
  )

  const goTo = (path) => {
    navigate(path)
    setQuery('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-search-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24 sm:pt-32"
        >
          <div
            onClick={onClose}
            className="fixed inset-0 bg-[color:var(--qz-ink)]/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-[color:var(--qz-sage)]/30 bg-[color:var(--qz-deep)]/95 shadow-2xl shadow-black/60"
          >
            <div className="flex items-center gap-3 border-b border-[color:var(--qz-sage)]/15 px-5 py-4">
              <Search className="size-5 text-[color:var(--qz-sage)]" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن فيلم، مسلسل، قصة تاريخية، أو قسم..."
                className="w-full bg-transparent text-sm text-[color:var(--qz-mint)] placeholder-[color:var(--qz-sage)]/60 focus:outline-none sm:text-base"
              />
              <button
                onClick={onClose}
                className="rounded-full p-1 text-[color:var(--qz-sage)] transition hover:bg-white/10 hover:text-[color:var(--qz-mint)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-[color:var(--qz-sage)]/70">
                  لا توجد نتائج مطابقة لـ «{query}»
                </p>
              ) : (
                <div className="space-y-1">
                  {filtered.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.to}
                        onClick={() => goTo(item.to)}
                        className="group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-right transition hover:bg-[color:var(--qz-forest)]"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="grid size-10 place-items-center rounded-xl border border-[color:var(--qz-sage)]/20 bg-[color:var(--qz-ink)] text-[color:var(--qz-sage)] transition group-hover:border-[color:var(--qz-sage)]/50 group-hover:text-[color:var(--qz-mint)]">
                            <Icon className="size-4" />
                          </span>
                          <div>
                            <div className="text-sm font-bold text-[color:var(--qz-mint)]">{item.title}</div>
                            <div className="text-xs text-[color:var(--qz-sage)]/80">{item.subtitle}</div>
                          </div>
                        </div>
                        <ArrowUpLeft className="size-4 text-[color:var(--qz-sage)]/40 transition group-hover:text-[color:var(--qz-mint)]" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[color:var(--qz-sage)]/15 bg-[color:var(--qz-ink)]/60 px-5 py-2.5 text-[11px] text-[color:var(--qz-sage)]/75">
              <span>تنقّل سريع داخل منصة قاسم</span>
              <span className="rounded border border-[color:var(--qz-sage)]/25 px-1.5 py-0.5 font-mono text-[10px]">ESC للإغلاق</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}