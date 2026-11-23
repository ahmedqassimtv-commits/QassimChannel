import { videos } from '../../data/videos.js'
import { reviews } from '../../data/reviews.js'
import { articles } from '../../data/articles.js'
import { stories } from '../../data/stories.js'
import { books } from '../../data/books.js'

/* ══ عقل قاسم الافتراضي ═════════════════════════════════════════════
   وضعان متكاملان:
   1. محلي فوري: يفهم السؤال بكلمات مفتاحية مرنة ويرد من محتوى منصة قاسمز
      الحقيقي (أحدث حلقة، آخر حُكم، مقال، حكاية، قاع الأفكار، الكتب، عن أحمد)
      مع رابط مباشر للقسم أو المقال.
   2. ذكاء اصطناعي سحابي: لو VITE_QZ_AI_ENDPOINT مضبوط، يرسل المحادثة
      مع فهرس المنصة للخادم ويعود تلقائياً للوضع المحلي عند أي انقطاع. */

export const AI_ENDPOINT = import.meta.env.VITE_QZ_AI_ENDPOINT || ''

const longVideos = videos.filter((v) => v.type !== 'short')
const shorts = videos.filter((v) => v.type === 'short')
const pick = (list) => list[Math.floor(Math.random() * list.length)]

export const GREETING = {
  text: 'أهلاً! أنا قاسم — النسخة الافتراضية. أقدر أرشّحلك حلقة، أقولك آخر حُكم في الفِردِكت، أو أفتحلك فصل من معرض الحكايات وقاع الأفكار. تحب تبدأ بإيه؟',
}

export const SUGGESTIONS = [
  { id: 'about', label: 'عن أحمد' },
  { id: 'story', label: 'حكاية من المعرض' },
  { id: 'verdict', label: 'آخر حُكم' },
  { id: 'ideas', label: 'قاع الأفكار' },
  { id: 'article', label: 'مقال أقراه' },
  { id: 'video', label: 'أحدث حلقة' },
]

const INTENTS = [
  { id: 'about', re: /(مين|عرف|عرّف|انت|إنت|نفسك|أحمد|احمد|قاسم|القناة|عن)/ },
  { id: 'ideas', re: /(فكر|افكار|أفكار|قاع|قلع|دفتر|مسود|ملاحظ)/ },
  { id: 'verdict', re: /(حكم|حُكم|فيلم|افلام|أفلام|مسلسل|سينما|مراجع|تقييم|فردكت|فِردِكت)/ },
  { id: 'story', re: /(حكاي|أرشيف|ارشيف|معرض|قديم|زمان|صور)/ },
  { id: 'article', re: /(مقال|اقرا|أقرا|قراء|جريد|صحيف|اكتب)/ },
  { id: 'books', re: /(كتاب|كتب|قصص|قصه|قصة|مكتب|رف)/ },
  { id: 'short', re: /(شورت|قصير|سريع)/ },
  { id: 'video', re: /(فيديو|حلق|جديد|اتفرج|شوف|يوتيوب)/ },
  { id: 'onair', re: /(اون|أون|بث|لايف|مباشر|اير|إير|موسيق)/ },
]

export function intentOf(text) {
  const t = String(text || '')
  return INTENTS.find((i) => i.re.test(t))?.id || null
}

export function localReply(intent) {
  switch (intent) {
    case 'about':
      return {
        text: 'أنا أحمد قاسم، صانع محتوى بيحب الصورة والحكاية. في صفحة «عن أحمد» هتلاقي تجربة تفاعلية كاملة بتعرّفك على العالم البصري للقناة.',
        link: { to: '/masaha/ahmed', label: 'افتح قسم عن أحمد' },
      }
    case 'ideas':
      return {
        text: 'قاع الأفكار هو دفتر المسودات والتجارب البصرية قبل ما تتحوّل لحلقات — تقدر تتصفّح الدفاتر وتضيف شرارة فكرتك بنفسك.',
        link: { to: '/ideas', label: 'ادخل قاع الأفكار' },
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
        text: s ? `خد دي سريعة: «${s.title}». ${s.summary}` : 'المقاطع القصيرة في صفحة الفيديوهات.',
        link: { to: '/videos/shorts', label: 'الشورتس' },
      }
    }
    case 'verdict': {
      const r = reviews[0]
      if (!r) {
        return {
          text: 'الأحكام السينمائية كلها في الفِردِكت.',
          link: { to: '/verdict/movies', label: 'الفِردِكت' },
        }
      }
      return {
        text: `آخر حُكم في الفِردِكت: «${r.titleAr || r.title}» — ${r.rating} من 10. ${r.verdict}`,
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
            text: `اقرا في الجريدة المصوّرة: «${a.title}». ${a.excerpt}`,
            link: { to: `/articles/${a.slug}`, label: 'افتح المقال' },
          }
        : { text: 'المقالات المصوّرة كلها في قسم المقالات.', link: { to: '/articles', label: 'المقالات' } }
    }
    case 'story': {
      const s = pick(stories)
      return {
        text: `من معرض الحكايات الكلاسيكي: ${s.year}، ${s.location}. «${s.title}» — ${s.caption}`,
        link: { to: '/stories', label: 'ادخل معرض الحكايات' },
      }
    }
    case 'books': {
      const b = books[0]
      return b
        ? {
            text: `من رف المكتبة: «${b.title}» لـ ${b.author}. ${b.excerpt}`,
            link: { to: '/masaha/books', label: 'الكتب والقصص' },
          }
        : { text: 'مكتبة الكتب والقصص في قسم مساحة.', link: { to: '/masaha/books', label: 'الكتب والقصص' } }
    }
    case 'onair':
      return {
        text: 'أون إير هو مساحة البث والموسيقى الهادئة والتحديثات الحية. تعالى نسمع إيه شغّال دلوقتي.',
        link: { to: '/masaha/on-air', label: 'افتح أون إير' },
      }
    default:
      return {
        text: 'جرّب تسألني عن حلقة جديدة، حُكم فيلم في الفِردِكت، فصل من معرض الحكايات، قاع الأفكار، أو قسم عن أحمد.',
      }
  }
}

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
      { label: 'عن أحمد', to: '/masaha/ahmed' },
      { label: 'قاع الأفكار', to: '/ideas' },
      { label: 'أون إير', to: '/masaha/on-air' },
      { label: 'الكتب والقصص', to: '/masaha/books' },
    ],
  }
}

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
