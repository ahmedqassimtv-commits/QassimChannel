import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import GlassCard from '../components/glass/GlassCard.jsx'
import ReadingProgress from '../components/ui/ReadingProgress.jsx'
import MarkerText from '../components/ui/MarkerText.jsx'
import { useArticle } from '../data/articles.js'

export default function ArticleView() {
  const { slug } = useParams()
  const article = useArticle(slug)
  if (!article) return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center"><h1 className="text-3xl font-bold">المقال غير موجود</h1><Link to="/articles" className="mt-5 inline-block text-emerald-200">العودة إلى المقالات</Link></motion.div>
  return (
    <>
    {/* برّه الـ article عشان الـ transform بتاعه مايأثرش على position: fixed */}
    <ReadingProgress />
    <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-3xl">
      <Link to="/articles" className="mb-6 inline-block text-sm text-emerald-200">← كل المقالات</Link>
      <GlassCard className="p-6 sm:p-10">
        <header className="mb-8 border-b border-white/[0.08] pb-6"><p className="text-xs text-emerald-200">{article.category} · {article.date}</p><h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">{article.title}</h1><p className="mt-4 leading-8 text-neutral-400">{article.excerpt}</p></header>
        <div className="prose prose-invert max-w-none text-neutral-300 prose-headings:font-bold prose-headings:text-white prose-p:leading-8 prose-li:leading-8 prose-strong:text-white" dir="rtl"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ blockquote: MarkerText }}>{article.body}</ReactMarkdown></div>
      </GlassCard>
    </motion.article>
    </>
  )
}
