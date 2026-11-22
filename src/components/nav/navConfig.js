import {
  BookOpen,
  Compass,
  Film,
  History,
  Home,
  Library,
  Radio,
  Scale,
  Tv,
  User,
  Video,
} from 'lucide-react'

/* خريطة التنقل الوحيدة للموقع: النافبار والتابات السفلية والبحث كلهم بيقروا منها.
   motion = حركة الأيقونة لما الماوس يقف على العنصر (beat | tilt | rewind | nudge | spin | pulse | nod) */

export const VERDICT_ITEMS = [
  {
    to: '/verdict/movies',
    label: 'حُكم السينما',
    sub: 'مراجعات وتقييمات الأفلام',
    short: 'أفلام',
    points: ['حكم صريح من غير حرق', 'تقييم من 10 بالأسباب', 'الحلقة كاملة على يوتيوب'],
    icon: Film,
    motion: 'tilt',
  },
  {
    to: '/verdict/series',
    label: 'حُكم المسلسلات',
    sub: 'قراءات في المواسم والحلقات',
    short: 'مسلسلات',
    points: ['قراءة الموسم كله مش حلقة', 'إيه اللي يستاهل وقتك', 'مقارنات بين المواسم'],
    icon: Tv,
    motion: 'beat',
  },
]

export const MASAHA_ITEMS = [
  {
    to: '/masaha/on-air',
    label: 'أون إير',
    sub: 'البث والمحتوى الحيّ',
    icon: Radio,
    motion: 'pulse',
  },
  {
    to: '/masaha/books',
    label: 'الكتب والقصص',
    sub: 'مكتبة القراءات والحكايات',
    icon: Library,
    motion: 'tilt',
  },
  { to: '/masaha/about', label: 'عنّي', sub: 'وراء الصورة والحكاية', icon: User, motion: 'nod' },
]

export const NAV = [
  { key: '/', to: '/', label: 'الرئيسية', icon: Home, glyph: 'home', motion: 'beat' },
  {
    key: 'verdict',
    glyph: 'verdict',
    label: 'الفِردِكت',
    tag: 'THE VERDICT',
    icon: Scale,
    motion: 'tilt',
    children: VERDICT_ITEMS,
  },
  {
    key: '/stories',
    to: '/stories',
    label: 'الحكايات',
    icon: History,
    glyph: 'stories',
    motion: 'rewind',
  },
  {
    key: '/videos',
    to: '/videos',
    label: 'الفيديوهات',
    icon: Video,
    glyph: 'videos',
    motion: 'beat',
  },
  {
    key: '/articles',
    to: '/articles',
    label: 'المقالات',
    icon: BookOpen,
    glyph: 'articles',
    motion: 'nudge',
  },
  {
    key: 'masaha',
    label: 'مساحة',
    icon: Compass,
    glyph: 'masaha',
    motion: 'spin',
    children: MASAHA_ITEMS,
  },
]

/* القسم النشط من المسار */
export function sectionKey(pathname) {
  if (pathname.startsWith('/verdict') || pathname.startsWith('/review')) return 'verdict'
  if (
    pathname.startsWith('/masaha') ||
    pathname.startsWith('/on-air') ||
    pathname.startsWith('/about')
  )
    return 'masaha'
  if (pathname.startsWith('/stories')) return '/stories'
  if (pathname.startsWith('/video')) return '/videos'
  if (pathname.startsWith('/article')) return '/articles'
  return '/'
}
