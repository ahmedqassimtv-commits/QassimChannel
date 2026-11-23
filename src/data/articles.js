import { useMemo } from 'react'
import { assetUrl } from '../utils/assets.js'

/* ══ المقالات ═════════════════════════════════════════════════════════
   كل مقال ملف Markdown في src/content/articles. صفحة الإدارة (/admin)
   بتكتب نفس الملفات، فالمحلل هنا لازم يفهم الـ YAML اللي بتطلّعه:
   قيم بين علامات تنصيص، نص طويل على كذا سطر (>- و |)، وقوائم (- عنصر). */

const files = import.meta.glob('../content/articles/*.md', { query: '?raw', import: 'default', eager: true })

function unquote(v) {
  const s = v.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    const inner = s.slice(1, -1)
    return s.startsWith('"') ? inner.replace(/\\"/g, '"').replace(/\\n/g, '\n') : inner.replace(/''/g, "'")
  }
  return s
}

export function parseFrontmatter(src) {
  const meta = {}
  const lines = src.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([\w-]+):\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    const rest = m[2]
    // نص على كذا سطر: > أو | (مع - أو + اختياري)
    if (/^[>|][+-]?\s*$/.test(rest)) {
      const folded = rest.startsWith('>')
      const block = []
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1].trim() === '')) {
        block.push(lines[++i].trim())
      }
      meta[key] = folded ? block.join(' ').replace(/\s+/g, ' ').trim() : block.join('\n').trim()
      continue
    }
    // قائمة: key: ثم أسطر - عنصر
    if (rest.trim() === '') {
      const list = []
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        list.push(unquote(lines[++i].replace(/^\s*-\s+/, '')))
      }
      meta[key] = list.length ? list : ''
      continue
    }
    // قائمة سطر واحد: [a, b]
    if (/^\[.*\]$/.test(rest.trim())) {
      meta[key] = rest
        .trim()
        .slice(1, -1)
        .split(',')
        .map((x) => unquote(x))
        .filter(Boolean)
      continue
    }
    meta[key] = unquote(rest)
  }
  return meta
}

const WORDS_PER_MINUTE = 190

function parseArticle(path, raw) {
  const slug = path.split('/').pop().replace(/\.md$/, '')
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  const meta = match ? parseFrontmatter(match[1]) : {}
  let body = match ? match[2] : raw
  const title = meta.title || slug
  // لو أول سطر في المقال هو نفس العنوان (# ...) بنشيله عشان مايتكررش تحت العنوان الكبير
  body = body.replace(/^\s*#\s+(.+)\r?\n/, (line, h) => (h.trim() === title.trim() ? '' : line))
  const words = body.replace(/[#>*_`-]/g, ' ').split(/\s+/).filter(Boolean).length
  const cover = meta.cover
    ? /^https?:/.test(meta.cover)
      ? meta.cover
      : assetUrl(meta.cover)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80'
  return {
    slug,
    title,
    date: String(meta.date || '').slice(0, 10),
    category: meta.category || 'مقالات',
    excerpt: meta.excerpt || '',
    cover,
    isNew: meta.isNew === 'true' || meta.isNew === true,
    location: meta.location || 'القاهرة · طبعة مصوّرة',
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    draft: meta.draft === 'true' || meta.draft === true,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    body,
  }
}

export const articles = Object.entries(files)
  .map(([path, raw]) => parseArticle(path, raw))
  .filter((a) => !a.draft)
  .sort((a, b) => b.date.localeCompare(a.date))

export function useArticle(slug) {
  return useMemo(() => {
    const decoded = (() => {
      try {
        return decodeURIComponent(slug ?? '')
      } catch {
        return slug
      }
    })()
    return articles.find((article) => article.slug === slug || article.slug === decoded)
  }, [slug])
}
