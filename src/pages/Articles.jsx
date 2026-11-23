import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpLeft, BookOpen, Clock, Newspaper } from 'lucide-react'
import { articles } from '../data/articles.js'
import { fmtDate, fmtMinutes } from '../components/qz/Kit.jsx'
import { playGlassTap } from '../utils/glassSound.js'

/* ══ قسم المقالات المصوّرة — Miranda Broadsheet Editorial (DESIGN 6) ═══
   تصميم جريدة ثقافية عريضة (Old-World Broadsheet) لعرض المقالات بالصور:
   - شريط ترويسة الصحيفة (Editorial Header Bar) بحدود 1px
   - الشريط الثلاثي العلوي (بطاقة مقال بصورة — عنوان العرض الضخم وختم الطابع — بطاقة مقال بصورة)
   - بانر العرض المعكوس بعرض الصحيفة بالكامل (Full-Width Display Banner Block)
   - تقسيم الجريدة (عمود جانبي بحرف استهلالي Drop Cap وفلاتر + شبكة المقالات المصوّرة). */

function StampSeal() {
  return (
    <div className="qz-mr-stamp-seal">
      <svg
        viewBox="0 0 120 64"
        fill="none"
        className="mx-auto h-12 w-24 text-[#1d1d1b]"
        aria-hidden="true"
      >
        {/* أشعة الشمس المحفورة بأسلوب الطابع الكلاسيكي */}
        <circle cx="60" cy="38" r="11" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M60 8V22M60 54V60M30 38H44M76 38H90M38 16L49 27M71 49L82 58M82 16L71 27M49 49L38 58M22 26L42 33M78 33L98 26"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path d="M12 52H108" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <p className="mt-1 font-[family-name:var(--font-display)] text-sm font-black tracking-wide text-[#1d1d1b]">
        طبعة قاسمز المصوّرة
      </p>
      <p className="qz-latin mt-0.5 text-[10px] font-bold tracking-[0.22em] text-[#1d1d1b]/75">
        ILLUSTRATED BROADSHEET · EST. 2026
      </p>
    </div>
  )
}

function BroadsheetPhotoCard({ article, featured = false }) {
  return (
    <Link to={`/articles/${article.slug}`} className="qz-mr-photo-card group h-full justify-between">
      <div>
        <div className="qz-mr-photo-frame">
          <img
            src={article.cover}
            alt={article.title}
            loading={featured ? 'eager' : 'lazy'}
          />
          <span className="absolute bottom-2 right-2 bg-[#1d1d1b] px-2 py-0.5 text-[10px] font-bold text-[#cdc6be]">
            {article.category}
          </span>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2 text-[11px] font-bold text-[#1d1d1b]/75">
          <span>{article.location || 'القاهرة · طبعة مصوّرة'}</span>
          <span className="qz-num inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {fmtMinutes(article.minutes)}
          </span>
        </div>

        <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-black leading-snug text-[#1d1d1b] sm:text-2xl">
          <span>{article.title}</span>{' '}
          {article.isNew && <span className="qz-mr-new-badge mr-1.5">جديد</span>}
        </h3>

        {article.excerpt && (
          <p className="mt-2.5 font-[family-name:var(--font-text)] text-sm leading-7 text-[#1d1d1b]/85">
            {article.excerpt}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#1d1d1b]/20 pt-3">
        <span className="qz-num text-xs font-bold text-[#1d1d1b]/70">
          {fmtDate(article.date)}
        </span>
        <span className="qz-mr-underline-link">
          <span>اقرأ المقال كاملاً</span>
          <ArrowUpLeft className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

export default function Articles() {
  const categories = useMemo(
    () => ['الكل', ...new Set(articles.map((a) => a.category))],
    [],
  )
  const [active, setActive] = useState('الكل')

  const list = useMemo(
    () => (active === 'الكل' ? articles : articles.filter((a) => a.category === active)),
    [active],
  )

  const rightStripArticle = articles[0]
  const leftStripArticle = articles[1] || articles[0]

  return (
    <div className="qz-miranda-broadsheet" dir="rtl">
      {/* ── ١. شريط الترويسة التحريرية (Editorial Header Bar) ── */}
      <header className="qz-mr-header-bar">
        <div className="flex items-center gap-2">
          <Newspaper className="size-4 text-[#c03f13]" aria-hidden="true" />
          <span>القاهرة، مصر · الطبعة الورقية المصوّرة</span>
        </div>
        <div className="text-center font-[family-name:var(--font-display)] text-base font-black tracking-wide sm:text-lg">
          صحيفة قاسمز التحريرية — THE VISUAL BROADSHEET
        </div>
        <div className="qz-num text-left">
          <span>{articles.length} مقالات مصوّرة · أرشيف ٢٠٢٦</span>
        </div>
      </header>

      {/* ── ٢. الشريط الثلاثي للأعمال المميزة (Three-Column Featured Work Strip) ── */}
      <section className="qz-mr-featured-strip" aria-label="مختارات العدد المصوّرة">
        <div className="qz-mr-strip-col">
          {rightStripArticle && <BroadsheetPhotoCard article={rightStripArticle} featured />}
        </div>

        <div className="qz-mr-strip-col flex flex-col items-center justify-between text-center">
          <div>
            <span className="inline-block border-b border-[#1d1d1b] pb-1 text-xs font-extrabold tracking-widest text-[#c03f13]">
              ALL WORK · الفهرس المصوّر
            </span>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.4rem,4.4vw,4.1rem)] font-black leading-[1.04] tracking-tight text-[#1d1d1b]">
              المقالات المصوّرة
            </h1>
            <p className="mx-auto mt-4 max-w-md font-[family-name:var(--font-text)] text-base leading-7 text-[#1d1d1b]/85">
              قراءات طويلة ومتأنية في الصورة والسينما وذاكرة المدن، مصحوبة بـكادرات فوتوغرافية
              تُقرأ على مهل كما تُقرأ صحف الأحد الكلاسيكية.
            </p>
          </div>

          <StampSeal />

          <p className="mt-4 text-xs font-bold text-[#1d1d1b]/75">
            تلميح: اضغط على أي بطاقة مصوّرة لفتح صفحة القراءة الكاملة
          </p>
        </div>

        <div className="qz-mr-strip-col">
          {leftStripArticle && <BroadsheetPhotoCard article={leftStripArticle} featured />}
        </div>
      </section>

      {/* ── ٣. بانر العرض المعكوس بعرض الصحيفة (Full-Width Display Banner Block) ── */}
      <section className="qz-mr-banner-block" aria-hidden="true">
        <p className="qz-mr-banner-title">دفترُ الصُّورةِ والحِكاية</p>
      </section>

      {/* ── ٤. التقسيم التحريري غير المتماثل (32% عمود جانبي Drop Cap / 68% شبكة المقالات بالصور) ── */}
      <section className="qz-mr-editorial-split">
        {/* العمود الجانبي التحريري */}
        <aside className="qz-mr-sidebar">
          <span className="text-xs font-extrabold tracking-widest text-[#c03f13]">
            افتتاحية العدد · EDITORIAL NOTE
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-black leading-tight text-[#1d1d1b]">
            لماذا نكتب عن السينما بالصورة؟
          </h2>

          {/* إطار صورة أرشيفية محفورة في العمود الجانبي */}
          <div className="qz-mr-photo-frame mt-5 aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80"
              alt="غرفة تحميض وأرشيف سينمائي"
              loading="lazy"
            />
          </div>

          {/* نص الافتتاحية مع الحرف الاستهلالي الضخم (Drop Cap Bio Block) */}
          <div className="mt-5 font-[family-name:var(--font-text)] text-base leading-8 text-[#1d1d1b]/90">
            <span className="qz-mr-dropcap" aria-hidden="true">
              ق
            </span>
            <p>
              راءة الفيلم لا تنتهي عند نزول شارة النهاية؛ هناك دائماً كادرٌ واحد يظل عالقاً في
              الذاكرة، أو جملة موسيقية تعيد تشكيل معنى القصة بالكامل. في هذا القسم نجمع المقالات
              جنباً إلى جنب مع صورها وكادراتها الأصلية.
            </p>
          </div>

          {/* فلاتر التصنيفات بأسلوب فهرس الجريدة */}
          <div className="mt-8 border-t border-[#1d1d1b]/35 pt-6">
            <p className="mb-3 flex items-center justify-between text-xs font-extrabold tracking-wider text-[#1d1d1b]">
              <span>أبواب الصحيفة</span>
              <BookOpen className="size-3.5 text-[#c03f13]" aria-hidden="true" />
            </p>
            <div className="flex flex-col gap-2" role="tablist" aria-label="تصنيفات المقالات">
              {categories.map((cat) => {
                const isAct = active === cat
                const count =
                  cat === 'الكل'
                    ? articles.length
                    : articles.filter((a) => a.category === cat).length
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isAct}
                    data-active={isAct ? 'true' : undefined}
                    className="qz-mr-filter-btn"
                    onClick={() => {
                      playGlassTap()
                      setActive(cat)
                    }}
                  >
                    <span>{cat}</span>
                    <span className="qz-num text-xs opacity-80">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* شبكة عرض جميع المقالات بالصور (Broadsheet Photo Grid) */}
        <div className="qz-mr-main-col">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-[#1d1d1b]/35 pb-4">
            <div>
              <span className="text-xs font-extrabold tracking-widest text-[#c03f13]">
                PHOTO ARCHIVE · أرشيف المقالات
              </span>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-black text-[#1d1d1b] sm:text-3xl">
                {active === 'الكل' ? 'جميع المقالات المصوّرة' : `باب: ${active}`}
              </h2>
            </div>
            <span className="qz-num text-xs font-bold text-[#1d1d1b]/75">
              إجمالي المواد المعروضة: {list.length}
            </span>
          </div>

          {list.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {list.map((article) => (
                <BroadsheetPhotoCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center font-[family-name:var(--font-text)] text-base text-[#1d1d1b]/75">
              لا توجد مقالات مصوّرة في هذا الباب حالياً.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
