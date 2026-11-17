import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import GlassCard from '../components/glass/GlassCard.jsx'
import { articles } from '../data/articles.js'

export default function Articles() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <header className="mb-9"><p className="mb-2 text-xs tracking-[0.2em] text-emerald-300">مساحة للقراءة والتأمل</p><h1 className="text-4xl font-black text-white">المقالات</h1><p className="mt-3 text-neutral-400">خواطر وحكايات عن السينما والصورة.</p></header>
      <div className="grid gap-5 md:grid-cols-2">{articles.map((article) => <GlassCard key={article.slug} className="liquid-glass-hover p-7"><div className="flex items-center gap-3 text-xs text-emerald-200"><span>{article.category}</span><span className="text-neutral-600">•</span><time>{article.date}</time></div><h2 className="mt-4 text-2xl font-bold text-white">{article.title}</h2><p className="mt-3 leading-8 text-neutral-400">{article.excerpt}</p><Link to={`/articles/${article.slug}`} className="mt-6 inline-flex text-sm text-emerald-200 hover:text-emerald-100">اقرأ المقال ←</Link></GlassCard>)}</div>
      {articles.length === 0 && <p className="py-16 text-center text-neutral-400">لا توجد مقالات منشورة حتى الآن.</p>}
    </motion.div>
  )
}
