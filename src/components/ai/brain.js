import { videos } from '../../data/videos.js'
import { reviews } from '../../data/reviews.js'
import { articles } from '../../data/articles.js'
import { stories } from '../../data/stories.js'

/* ══ عقل قاسم الافتراضي ═════════════════════════════════════════════
   وضعين:
   1. محلي (الافتراضي، ببلاش): بيفهم السؤال بكلمات مفتاحية وبيرد من
      محتوى الموقع نفسه (أحدث حلقة، آخر حُكم، مقال، حكاية…) ومعاه لينك.
   2. ذكاء اصطناعي: لو VITE_QZ_AI_ENDPOINT متظبط (Cloudflare Worker في
      workers/qz-ai) الكلام بيروح لموديل حقيقي ومعاه فهرس الموقع، ولو
      حصل أي خطأ بيرجع للوضع المحلي. مفتاح الـ API عمره ما بيبقى هنا. */

export const AI_ENDPOINT = import.meta.env.VITE_QZ_AI_ENDPOINT || ''

const longVideos = videos.filter((v) => v.type !== 'short')
const shorts = videos.filter((v) => v.type === 'short')
const pick = (list) => list[Math.floor(Math.random() * list.length)]

export const GREETING = {
  text: 'أهلاً! أنا قاسم — النسخة الافتراضية. أقدر أرشّحلك حلقة، أقولك آخر حُكم سينمائي، أو أحكيلك حكاية من الأرشيف. تحب تبدأ بإيه؟',
}

export const SUGGESTIONS = [
  { id: 'about', label: 'عرّفني بنفسك' },
  { id: 'video', label: 'أحدث حلقة' },
  { id: 'verdict', label: 'آخر حُكم' },
  { id: 'article', label: 'مقال أقراه' },
  { id: 'story', label: 'حكاية من الأرشيف' },
]

const INTENTS = [
  { id: 'about', re: /(مين|عرف|عرّف|انت|إنت|نفسك|قاسم|القناة)/ },
  { id: 'verdict', re: /(حكم|حُكم|فيلم|افلام|أفلام|مسلسل|سينما|مراجع|تقييم|فردكت|فِردِكت)/ },
  { id: 'article', re: /(مقال|اقرا|أقرا|قراء|كتاب|اكتب)/ },
  { id: 'story', re: /(حكاي|أرشيف|ارشيف|قديم|زمان|صور)/ },
  { id: 'short', re: /(شورت|قصير|سريع)/ },
  { id: 'video', re: /(فيديو|حلق|جديد|اتفرج|شوف|يوتيوب)/ },
  { id: 'onair', re: /(اون|أون|بث|لايف|مباشر|اير|إير)/ },
]

export function intentOf(text) {
  const t = String(text || '')
  return INTENTS.find((i) => i.re.test(t))?.id || null
}

export function localReply(intent) {
  switch (intent) {
    case 'about':
      return {
        text: 'أنا أحمد قاسم، صانع محتوى بيحب الصورة والحكاية. هنا هتلاقي وثائقيات، أحكام على الأفلام والمسلسلات، ومقالات عن التفاصيل اللي بتفرق.',
        link: { to: '/masaha/about', label: 'صفحة عنّي' },
      }
    case 'video': {
      const v = longVideos[0]
      return v
        ? {
            text: `آخر حلقة نزلت: «${v.title}». ${v.summary}`,
            link: { to: '/videos', label: 'شوف الحلقة' },
          }
        : { text: 'الحلقات كلها في صفحة الفيديوهات.', link: { to: '/videos', label: 'الفيديوهات' } }
    }
    case 'short': {
      const s = shorts[0]
      return {
        text: s ? `خد دي سريعة: «${s.title}». ${s.summary}` : 'الشورتس في صفحة الفيديوهات.',
        link: { to: '/videos/shorts', label: 'الشورتس' },
      }
    }
    case 'verdict': {
      const r = reviews[0]
      if (!r)
        return {
          text: 'الأحكام في الفِردِكت.',
          link: { to: '/verdict/movies', label: 'الفِردِكت' },
        }
      return {
        text: `آخر حُكم: «${r.titleAr || r.title}» — ${r.rating} من 10. ${r.verdict}`,
        link: {
          to: r.mediaType === 'مسلسل' ? '/verdict/series' : '/verdict/movies',
          label: 'اقرا الحُكم',
        },
      }
    }
    case 'article': {
      const a = articles[0]
      return a
        ? {
            text: `اقرا «${a.title}». ${a.excerpt}`,
            link: { to: `/articles/${a.slug}`, label: 'افتح المقال' },
          }
        : { text: 'المقالات كلها في صفحة المقالات.', link: { to: '/articles', label: 'المقالات' } }
    }
    case 'story': {
      const s = pick(stories)
      return {
        text: `من الأرشيف: ${s.year}، ${s.location}. «${s.title}» — ${s.caption}`,
        link: { to: '/stories', label: 'الحكايات' },
      }
    }
    case 'onair':
      return {
        text: 'أون إير هو المكان اللي فيه البث والمحتوى الحي. تعالى شوف إيه اللي شغّال دلوقتي.',
        link: { to: '/masaha/on-air', label: 'أون إير' },
      }
    default:
      return {
        text: 'مش متأكد فهمتك. جرّب تسألني عن حلقة، فيلم، مقال، أو حكاية من الأرشيف.',
      }
  }
}

/* فهرس مختصر للموقع بيتبعت للموديل عشان يرشّح لينكات حقيقية بس */
export function catalog() {
  return {
    videos: longVideos
      .slice(0, 8)
      .map((v) => ({ title: v.title, summary: v.summary, to: '/videos' })),
    shorts: shorts.slice(0, 5).map((v) => ({ title: v.title, to: '/videos/shorts' })),
    verdicts: reviews.slice(0, 8).map((r) => ({
      title: r.titleAr || r.title,
      rating: r.rating,
      verdict: r.verdict,
      to: r.mediaType === 'مسلسل' ? '/verdict/series' : '/verdict/movies',
    })),
    articles: articles
      .slice(0, 8)
      .map((a) => ({ title: a.title, excerpt: a.excerpt, to: `/articles/${a.slug}` })),
    stories: stories.map((s) => ({ title: s.title, year: s.year, to: '/stories' })),
    pages: [
      { label: 'عنّي', to: '/masaha/about' },
      { label: 'أون إير', to: '/masaha/on-air' },
      { label: 'الكتب', to: '/masaha/books' },
    ],
  }
}

/** history: [{ role: 'user' | 'assistant', content }] */
export async function ask(text, history = []) {
  const intent = intentOf(text)
  if (!AI_ENDPOINT) return localReply(intent)
  try {
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => ctrl.abort(), 15000)
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...history.slice(-8), { role: 'user', content: text }],
        catalog: catalog(),
      }),
      signal: ctrl.signal,
    })
    window.clearTimeout(timer)
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    if (!data?.reply) throw new Error('empty')
    const link = data.link?.to && data.link.to.startsWith('/') ? data.link : null
    return { text: data.reply, link }
  } catch {
    return localReply(intent)
  }
}
