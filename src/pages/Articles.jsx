import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpLeft } from 'lucide-react'
import { articles } from '../data/articles.js'
import { ArticleRow, Filters, PageHero, fmtDate } from '../components/qz/Kit.jsx'
import { Reveal, Stagger, StaggerItem } from '../components/motion/Motion.jsx'

/* ══ المقالات ═════════════════════════════════════════════════════════
   فهرس تحريري: أحدث مقال كغلاف كبير، وتحته باقي المقالات كسطور مرقّمة
   زي فهرس مجلة، مع فلاتر بالتصنيف. */

export default function Articles() {
  const categories = useMemo(() => ['الكل', ...new Set(articles.map((a) => a.category))], [])
  const [active, setActive] = useState('الكل')
  const list = active === 'الكل' ? articles : articles.filter((a) => a.category === active)
  const [featured, ...rest] = list

  return (
    <div>
      <PageHero
        index="—"
        eyebrow="دفتر الملاحظات"
        title="المقالات"
        lead="قراءات طويلة ومتأنية في الصورة والسينما والحكاية، تتقري على مهل."
      />

      {categories.length > 2 && (
        <div className="mt-12">
          <Filters id="articles" items={categories} value={active} onChange={setActive} label="تصنيفات المقالات" />
        </div>
      )}

      {featured && (
        <Reveal className="mt-12">
          <Link to={`/articles/${featured.slug}`} className="qz-panel group qz-hover-zoom grid overflow-hidden lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="qz-media !rounded-none min-h-[240px] lg:min-h-[420px]">
              {featured.cover ? (
                <img src={featured.cover} alt="" loading="eager" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_70%_30%,rgb(var(--qz-moss-rgb)/0.9),transparent_70%),radial-gradient(60%_60%_at_20%_90%,rgb(var(--qz-glow-rgb)/0.25),transparent_70%)]">
                  <span className="absolute inset-0 grid place-items-center font-[family-name:var(--font-quiver)] text-[clamp(6rem,14vw,12rem)] font-light text-[rgb(var(--qz-mint-rgb)/0.12)]">
                    ”
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between gap-8 p-7 sm:p-10">
              <div>
                <p className="qz-eyebrow">الأحدث · {featured.category}</p>
                <h2 className="qz-h2 mt-5 transition-colors duration-300 group-hover:text-[color:var(--qz-accent)]">{featured.title}</h2>
                {featured.excerpt && <p className="qz-lead mt-5">{featured.excerpt}</p>}
              </div>
              <div className="flex items-center justify-between gap-4 text-sm text-[color:var(--qz-text-3)]">
                <span className="qz-num">
                  {fmtDate(featured.date)} · {featured.minutes} دقائق قراءة
                </span>
                <ArrowUpLeft className="size-5 text-[color:var(--qz-accent)] transition-transform duration-500 group-hover:-translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
              </div>
            </div>
          </Link>
        </Reveal>
      )}

      {rest.length > 0 && (
        <section className="mt-16">
          <Stagger>
            {rest.map((a, i) => (
              <StaggerItem key={a.slug}>
                <ArticleRow article={a} index={i + 2} />
              </StaggerItem>
            ))}
          </Stagger>
          <div className="qz-rule" />
        </section>
      )}

      {list.length === 0 && <p className="qz-body mt-16 text-center">مفيش مقالات في التصنيف ده لسه.</p>}
    </div>
  )
}
