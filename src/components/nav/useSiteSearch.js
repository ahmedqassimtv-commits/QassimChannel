import { useMemo, useState } from 'react'
import { BookOpen, Film, History, Library, Video } from 'lucide-react'
import { NAV } from './navConfig.js'
import { videos } from '../../data/videos.js'
import { reviews } from '../../data/reviews.js'
import { articles } from '../../data/articles.js'
import { stories } from '../../data/stories.js'
import { books } from '../../data/books.js'

/* ══ البحث جوّه النافبار (⌘K / Ctrl+K / «/») ═════════════════════════
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

export function buildIndex() {
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

/** فهرس + نتايج + مؤشر الاختيار */
export default function useSiteSearch() {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const index = useMemo(buildIndex, [])
  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return index.filter((i) => i.group === 'الأقسام' || i.group === 'فيديوهات').slice(0, 8)
    const words = q.split(/\s+/)
    return index
      .map((item) => {
        if (!words.every((w) => item.key.includes(w))) return null
        // العنوان اللي بيبدأ بالكلمة أهم من اللي فيه الكلمة في النص
        const t = normalize(item.title)
        const score =
          (t.startsWith(words[0]) ? 0 : t.includes(words[0]) ? 1 : 2) +
          (item.group === 'الأقسام' ? -0.5 : 0)
        return { item, score }
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 24)
      .map((r) => r.item)
  }, [query, index])
  return {
    query,
    setQuery: (q) => {
      setQuery(q)
      setCursor(0)
    },
    cursor,
    setCursor,
    results,
  }
}
