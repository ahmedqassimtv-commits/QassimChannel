import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowRight, Check, Share2 } from 'lucide-react'
import MarkerText from '../components/ui/MarkerText.jsx'
import { articles, useArticle } from '../data/articles.js'
import { assetUrl } from '../utils/assets.js'
import { ArticleRow, fmtDate } from '../components/qz/Kit.jsx'
import { Reveal, SplitTitle } from '../components/motion/Motion.jsx'

/* ══ صفحة المقال ═════════════════════════════════════════════════════
   تجربة قراءة: عنوان ضخم بـ Quiverleaf بيطلع كلمة كلمة، والنص نفسه
   بثمانية Text بسطر مريح (~68 حرف) وتباعد 2.05. فهرس جانبي بيتابع
   العنوان اللي إنت فيه، وشريط تقدّم فوق، ومشاركة، ومقالات تانية في الآخر.
   الشريط في portal على body عشان مايتأثرش بحركة انتقال الصفحة. */

const slugify = (text) =>
  String(text)
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .toLowerCase()

const textOf = (children) =>
  (Array.isArray(children) ? children : [children])
    .map((c) => (typeof c === 'string' || typeof c === 'number' ? c : c?.props?.children ? textOf(c.props.children) : ''))
    .join('')

// برّه المكوّن عشان هويتهم تفضل ثابتة (لو اتعملوا جوه، كل render بيبدّل
// عناصر العناوين ومتابع الفهرس بيفضل يراقب عناصر قديمة)
function H2({ children }) {
  return <h2 id={slugify(textOf(children))}>{children}</h2>
}
function H3({ children }) {
  return <h3 id={slugify(textOf(children))}>{children}</h3>
}

function Progress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 34, mass: 0.4 })
  return createPortal(<motion.div aria-hidden="true" className="qz-progress" style={{ scaleX }} />, document.body)
}

function useActiveHeading(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    if (!ids.length) return undefined
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ids])
  return active
}

function ShareButton({ title }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      }
    } catch {
      /* المستخدم لغى المشاركة */
    }
  }
  return (
    <button type="button" onClick={share} className="qz-chip !h-9 !px-4 hover:!text-[color:var(--qz-text)]" data-qz-silent>
      {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Share2 className="size-3.5" aria-hidden="true" />}
      {copied ? 'اتنسخ الرابط' : 'شارك'}
    </button>
  )
}

export default function ArticleView() {
  const { slug } = useParams()
  const article = useArticle(slug)

  const headings = useMemo(() => {
    if (!article) return []
    return [...article.body.matchAll(/^(##|###)\s+(.+)$/gm)].map((m) => ({
      level: m[1].length,
      text: m[2].replace(/[*_`]/g, '').trim(),
      id: slugify(m[2].replace(/[*_`]/g, '')),
    }))
  }, [article])
  const ids = useMemo(() => headings.map((h) => h.id), [headings])
  const active = useActiveHeading(ids)

  if (!article) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <p className="qz-h1">المقال مش موجود</p>
        <Link to="/articles" className="qz-btn qz-btn-ghost">
          كل المقالات
        </Link>
      </div>
    )
  }

  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 3)

  return (
    <article>
      <Progress />
      <Reveal y={8}>
        <Link to="/articles" className="qz-link text-sm text-[color:var(--qz-text-2)]">
          <ArrowRight className="size-4" aria-hidden="true" />
          <span>كل المقالات</span>
        </Link>
      </Reveal>

      <header className="mx-auto max-w-4xl pb-10 pt-10 text-center sm:pt-16">
        <Reveal y={8}>
          <p className="qz-eyebrow justify-center">{article.category}</p>
        </Reveal>
        <SplitTitle text={article.title} className="qz-h1 mt-6" delay={0.05} />
        {article.excerpt && (
          <Reveal delay={0.3} className="qz-lead mx-auto mt-7 max-w-2xl">
            {article.excerpt}
          </Reveal>
        )}
        <Reveal delay={0.4} className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-[color:var(--qz-text-3)]">
          <span className="qz-num">{fmtDate(article.date)}</span>
          <span aria-hidden="true">·</span>
          <span className="qz-num">{article.minutes} دقائق قراءة</span>
          <ShareButton title={article.title} />
        </Reveal>
      </header>

      {article.cover && (
        <Reveal className="qz-media mx-auto mb-14 aspect-[21/9] max-w-6xl !rounded-[32px]">
          <img src={article.cover} alt="" loading="eager" />
        </Reveal>
      )}

      <div className="qz-rule mx-auto mb-14 max-w-4xl" />

      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="qz-prose mx-auto w-full" dir="rtl">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              blockquote: MarkerText,
              h2: H2,
              h3: H3,
              // الصور المرفوعة من صفحة الكتابة مكتوبة /uploads/... فلازم تعدّي على مسار الموقع
              img: ({ src = '', alt = '' }) => <img src={src.startsWith('/') ? assetUrl(src) : src} alt={alt} loading="lazy" />,
              a: ({ href, children }) =>
                href?.startsWith('/') ? (
                  <Link to={href}>{children}</Link>
                ) : (
                  <a href={href} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                ),
            }}
          >
            {article.body}
          </ReactMarkdown>
          {article.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2 font-[family-name:var(--font-quiver)]">
              {article.tags.map((t) => (
                <span key={t} className="qz-chip">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {headings.length > 1 && (
          <aside className="hidden lg:block">
            <nav aria-label="محتويات المقال" className="qz-toc sticky top-32">
              <p className="mb-3 text-xs font-semibold text-[color:var(--qz-text-3)]">في المقال</p>
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  data-active={active === h.id ? 'true' : undefined}
                  style={{ paddingInlineStart: h.level === 3 ? 26 : 14 }}
                  onClick={(e) => {
                    e.preventDefault()
                    const el = document.getElementById(h.id)
                    const lenis = window.__qzLenis
                    if (lenis) lenis.scrollTo(el, { offset: -110 })
                    else el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>

      {others.length > 0 && (
        <section className="qz-section">
          <p className="qz-eyebrow">اقرأ كمان</p>
          <div className="mt-8">
            {others.map((a, i) => (
              <ArticleRow key={a.slug} article={a} index={i + 1} />
            ))}
            <div className="qz-rule" />
          </div>
        </section>
      )}
    </article>
  )
}
