import { books } from '../data/books.js'
import { PageHero, SectionHead } from '../components/qz/Kit.jsx'
import { Stagger, StaggerItem } from '../components/motion/Motion.jsx'

/* ══ الكتب والقصص ═════════════════════════════════════════════════════
   رف كتب: كل غلاف كتاب له عمق حقيقي (CSS 3D: وش + كعب + سُمك صفحات)،
   مايل شوية، ومع الماوس بيلف ويواجهك. قسمين: قراءات قاسم، وقصصه هو. */

function Rating({ value }) {
  if (!value) return null
  return (
    <span className="flex gap-1" aria-label={`تقييم ${value} من 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-1 w-5 rounded-full ${i < value ? 'bg-[color:var(--qz-accent)]' : 'bg-[rgb(var(--qz-mint-rgb)/0.14)]'}`} />
      ))}
    </span>
  )
}

function Book({ book }) {
  return (
    <article className="group">
      <div className="qz-book mx-auto w-[min(220px,70%)]">
        <div className="qz-book-body">
          <img src={book.cover} alt="" loading="lazy" className="qz-book-cover" />
          <span className="qz-book-title">{book.title}</span>
          <span className="qz-book-spine" aria-hidden="true" />
          <span className="qz-book-pages" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-8 text-center">
        <h3 className="qz-h3">{book.title}</h3>
        <p className="mt-1 text-sm text-[color:var(--qz-accent)]">{book.author}</p>
        <p className="qz-body mx-auto mt-3 max-w-xs text-[0.95rem]">{book.excerpt}</p>
        <div className="mt-4 flex justify-center">
          <Rating value={book.rating} />
        </div>
      </div>
    </article>
  )
}

export default function Books() {
  const reads = books.filter((b) => b.category !== 'قصة')
  const tales = books.filter((b) => b.category === 'قصة')
  return (
    <div>
      <PageHero
        index="—"
        eyebrow="مساحة · مكتبة"
        title="الكتب والقصص"
        lead="قراءات غيّرت طريقة الشوف، وقصص مكتوبة بلغة الصورة قبل ما تبقى كلام."
      />
      {reads.length > 0 && (
        <section className="qz-section">
          <SectionHead index="01" eyebrow="على الرف" title="قراءات" />
          <Stagger className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {reads.map((b) => (
              <StaggerItem key={b.id}>
                <Book book={b} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
      {tales.length > 0 && (
        <section className="qz-section pt-0">
          <SectionHead index="02" eyebrow="بقلم قاسم" title="قصص" />
          <Stagger className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {tales.map((b) => (
              <StaggerItem key={b.id}>
                <Book book={b} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </div>
  )
}
