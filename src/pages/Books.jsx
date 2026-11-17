import { motion } from 'framer-motion'
import { Library, BookOpen, Bookmark, ArrowUpLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/glass/GlassCard.jsx'
import Typewriter from '../components/ui/Typewriter.jsx'

const heroEase = [0.22, 1, 0.36, 1]
const rise = (delay) => ({
  initial: { opacity: 0, y: 18, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.7, delay, ease: heroEase },
})

// بيانات الكتب والقصص — محتوى حقيقي placeholder
const BOOKS = [
  {
    id: 'book-1',
    title: 'في مديح البطء',
    author: 'كارل أونوريه',
    category: 'قراءة',
    cover: '/fractal/optimized/15.webp',
    excerpt: 'كتاب يدعونا للتوقف عن الركض المحموم والتأمل في تفاصيل الحياة التي نمر عليها مرور الكرام.',
    rating: 4,
  },
  {
    id: 'book-2',
    title: 'عن التصوير الفوتوغرافي',
    author: 'سوزان سونتاغ',
    category: 'قراءة',
    cover: '/fractal/optimized/51.webp',
    excerpt: 'تأملات فلسفية عميقة في الصورة وعلاقتنا بها — كيف نرى العالم من خلال العدسة.',
    rating: 5,
  },
  {
    id: 'book-3',
    title: 'حكايات من خلف الكاميرا',
    author: 'قاسم',
    category: 'قصة',
    cover: '/fractal/optimized/70.webp',
    excerpt: 'مجموعة قصصية قصيرة تروي لحظات من كواليس صناعة المحتوى — الأخطاء، المفاجآت، والدهشة.',
    rating: null,
  },
  {
    id: 'book-4',
    title: 'ضوء آخر النهار',
    author: 'قاسم',
    category: 'قصة',
    cover: '/fractal/optimized/86.webp',
    excerpt: 'تفاصيل صغيرة من أيام طويلة — مكتوبة بلغة الصورة قبل أن تكون كلمات.',
    rating: null,
  },
]

function StarRating({ rating }) {
  if (!rating) return null
  return (
    <div className="flex gap-0.5" aria-label={`تقييم ${rating} من 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`text-sm ${i < rating ? 'text-emerald-300' : 'text-[color:var(--qz-sage)]/30'}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function Books() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ترويسة الصفحة */}
      <header className="liquid-glass mb-10 rounded-3xl p-6 sm:p-10">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border border-emerald-400/30 bg-[color:var(--qz-ink)] text-emerald-300">
            <Library className="size-4" />
          </span>
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-emerald-300">
            LIBRARY • مكتبة ومساحة قراءة
          </span>
        </div>

        <h1 className="font-history mt-4 text-4xl font-black text-[color:var(--qz-mint)] sm:text-5xl">
          الكتب والقصص
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--qz-sage)] sm:text-base">
          <Typewriter text="مساحة للقراءات المُلهمة، والقصص التي تستحق أن تُحكى." />
        </p>
      </header>

      {/* الكتب */}
      <div className="grid gap-6 md:grid-cols-2">
        {BOOKS.map((book, i) => (
          <motion.div key={book.id} {...rise(i * 0.1)}>
            <GlassCard className="liquid-glass-hover group h-full p-0">
              <div className="flex h-full flex-col sm:flex-row">
                {/* غلاف */}
                <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-t-3xl sm:w-40 sm:rounded-r-3xl sm:rounded-tl-none">
                  <img
                    src={book.cover}
                    alt={book.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--qz-ink)]/60 to-transparent sm:bg-gradient-to-l" />
                  <span className="absolute top-3 right-3 rounded-full border border-emerald-300/30 bg-[color:var(--qz-ink)]/80 px-3 py-1 text-[10px] font-bold text-emerald-200 backdrop-blur-md">
                    {book.category}
                  </span>
                </div>

                {/* تفاصيل */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-black text-white">{book.title}</h3>
                      <Bookmark className="size-5 shrink-0 text-[color:var(--qz-sage)]/50 transition-colors group-hover:text-emerald-300" />
                    </div>
                    <p className="mt-1 text-xs text-emerald-200">{book.author}</p>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--qz-sage)]">
                      {book.excerpt}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <StarRating rating={book.rating} />
                    <span className="text-xs text-[color:var(--qz-sage)]/60">
                      {book.rating ? 'قراءة مُكتملة' : 'قصة أصلية'}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div {...rise(0.4)} className="mt-16 text-center">
        <p className="text-sm text-[color:var(--qz-sage)]">
          المكتبة تتوسع باستمرار — ترقب قراءات ومراجعات كتب جديدة قريباً.
        </p>
      </motion.div>
    </motion.div>
  )
}
