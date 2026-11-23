import { useMemo } from 'react'

const files = import.meta.glob('../content/articles/*.md', { query: '?raw', import: 'default', eager: true })

function parseArticle(path, raw) {
  const slug = path.split('/').pop().replace(/\.md$/, '')
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  const metadata = {}
  let body = raw
  if (match) {
    for (const line of match[1].split('\n')) {
      const pair = line.match(/^([\w-]+):\s*["']?(.*?)["']?\s*$/)
      if (pair) metadata[pair[1]] = pair[2]
    }
    body = match[2]
  }
  return {
    slug,
    title: metadata.title || slug,
    date: metadata.date || '',
    category: metadata.category || 'مقالات',
    excerpt: metadata.excerpt || '',
    draft: String(metadata.draft).toLowerCase() === 'true',
    body,
  }
}

export const articles = Object.entries(files)
  .map(([path, raw]) => parseArticle(path, raw))
  .filter((article) => !article.draft)
  .sort((a, b) => b.date.localeCompare(a.date))

export function useArticle(slug) {
  return useMemo(() => articles.find((article) => article.slug === slug), [slug])
}
