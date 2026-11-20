import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft, BookOpen, Film, History, Library, Search, Video, X } from 'lucide-react'
import { NAV } from './navConfig.js'
import { videos } from '../../data/videos.js'
import { reviews } from '../../data/reviews.js'
import { articles } from '../../data/articles.js'
import { stories } from '../../data/stories.js'
import { books } from '../../data/books.js'
import { useCinema } from '../qz/CinemaPlayer.jsx'
import { SPRING } from '../motion/Motion.jsx'

/* ══ البحث (⌘K / Ctrl+K / «/») ═══════════════════════════════════════
   بيدوّر في كل المحتوى مرة واحدة: الأقسام، الفيديوهات، أحكام الفِردِكت،
   المقالات، الحكايات، والكتب. البحث متسامح مع العربي: بيشيل التشكيل
   ويوحّد الألف والياء والتاء المربوطة، فـ«الوصول» تلاقي «الوُصول».
   الأسهم بتتنقل، Enter بيفتح، والفيديو بيشتغل في مشغّل السينما على طول. */

const normalize = (s = '') =>
  String(s)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '') // تشكيل وتطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')

function buildIndex() {
  const sections = NAV.flatMap((n) => (n.children ? n.children : [n])).map((n) => ({
    group: 'الأقسام',
    title: n.label,
    sub: n.sub ?? '',
    to: n.to,
    icon: n.icon,
  }))
  return [
    ...sections,
    ...videos.map((v) => ({
      group: 'فيديوهات',
      title: v.title,
      sub: `${v.category} · ${v.summary ?? ''}`,
      thumb: `https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`,
      video: v,
      icon: Video,
    })),
    ...reviews.map((r) => ({
      group: 'الفِردِكت',
      title: r.titleAr || r.title,
      sub: `${r.title} · ${r.mediaType} · ${r.rating}/10`,
      extra: (r.tags ?? []).join(' '),
      thumb: `https://i.ytimg.com/vi/${r.youtubeId}/mqdefault.jpg`,
      to: r.mediaType === 'مسلسل' ? '/verdict/series' : '/verdict/movies',
      icon: Film,
    })),
    ...articles.map((a) => ({
      group: 'مقالات',
      title: a.title,
      sub: `${a.category} · ${a.excerpt}`,
      to: `/articles/${a.slug}`,
      icon: BookOpen,
    })),
    ...stories.map((s) => ({
      group: 'الحكايات',
      title: s.title,
      sub: `${s.year} · ${s.location}`,
      thumb: s.image.replace('w=1400', 'w=200'),
      to: '/stories',
      icon: History,
    })),
    ...books.map((b) => ({
      group: 'الكتب',
      title: b.title,
      sub: b.author,
      to: '/masaha/books',
      icon: Library,
    })),
  ].map((item) => ({ ...item, key: normalize(`${item.title} ${item.sub} ${item.extra ?? ''}`) }))
}

export default function SearchOverlay({ open, onClose }) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const cinema = useCinema()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const index = useMemo(buildIndex, [])

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return index.filter((i) => i.group === 'الأقسام' || i.group === 'فيديوهات').slice(0, 9)
    const words = q.split(/\s+/)
    return index
      .map((item) => {
        if (!words.every((w) => item.key.includes(w))) return null
        // العنوان اللي بيبدأ بالكلمة أهم من اللي فيه الكلمة في النص
        const t = normalize(item.title)
        const score = (t.startsWith(words[0]) ? 0 : t.includes(words[0]) ? 1 : 2) + (item.group === 'الأقسام' ? -0.5 : 0)
        return { item, score }
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 24)
      .map((r) => r.item)
  }, [query, index])

  useEffect(() => setCursor(0), [query])
  useEffect(() => {
    if (!open) return undefined
    setQuery('')
    const id = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(id)
  }, [open])

  // العنصر المختار يفضل ظاهر وقت التنقل بالأسهم
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const pick = (item) => {
    if (!item) return
    onClose()
    if (item.video) cinema.open(item.video)
    else navigate(item.to)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(results.length - 1, c + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(0, c - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[cursor])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  let lastGroup = null

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="qz-search-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="البحث في الموقع"
            className="qz-search"
            dir="rtl"
            data-lenis-prevent
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.97, filter: 'blur(10px)' }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98, filter: 'blur(8px)' }}
            transition={SPRING}
          >
            <div className="qz-search-field">
              <Search className="size-5 shrink-0 text-[color:var(--qz-text-3)]" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="دوّر على فيديو، فيلم، مقال، حكاية…"
                aria-label="كلمة البحث"
                role="combobox"
                aria-expanded="true"
                aria-controls="qz-search-list"
                aria-activedescendant={results[cursor] ? `qz-sr-${cursor}` : undefined}
                autoComplete="off"
                spellCheck="false"
              />
              <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full text-[color:var(--qz-text-3)] hover:bg-[rgb(var(--qz-mint-rgb)/0.08)]" aria-label="إغلاق البحث">
                <X className="size-4" />
              </button>
            </div>

            <div ref={listRef} id="qz-search-list" role="listbox" className="qz-search-results">
              {results.length === 0 ? (
                <p className="qz-search-empty">مفيش نتايج لـ «{query}». جرّب كلمة تانية.</p>
              ) : (
                results.map((item, i) => {
                  const header = item.group !== lastGroup ? item.group : null
                  lastGroup = item.group
                  const Icon = item.icon
                  return (
                    <div key={`${item.group}-${item.title}-${i}`}>
                      {header && <p className="qz-search-group">{header}</p>}
                      <button
                        type="button"
                        id={`qz-sr-${i}`}
                        role="option"
                        aria-selected={i === cursor}
                        data-active={i === cursor ? 'true' : undefined}
                        className="qz-search-item"
                        onMouseMove={() => setCursor(i)}
                        onClick={() => pick(item)}
                      >
                        {item.thumb ? (
                          <img src={item.thumb} alt="" className="qz-search-thumb" loading="lazy" />
                        ) : (
                          <span className="qz-search-thumb grid place-items-center">
                            {Icon && <Icon className="size-4 text-[color:var(--qz-accent)]" aria-hidden="true" />}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{item.title}</span>
                          {item.sub && <span className="mt-0.5 block truncate text-xs text-[color:var(--qz-text-3)]">{item.sub}</span>}
                        </span>
                        {i === cursor && <ArrowUpLeft className="size-4 shrink-0 text-[color:var(--qz-text-3)]" aria-hidden="true" />}
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <div className="qz-search-foot">
              <span><kbd className="qz-kbd">↵</kbd> فتح</span>
              <span><kbd className="qz-kbd">↑↓</kbd> تنقّل</span>
              <span><kbd className="qz-kbd">Esc</kbd> إغلاق</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
