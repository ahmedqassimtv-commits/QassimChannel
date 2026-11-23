import {
  BookOpen,
  Compass,
  Film,
  History,
  Home,
  Library,
  Lightbulb,
  Radio,
  Scale,
  Tv,
  User,
  Video,
} from 'lucide-react'

/* خريطة التنقل الوحيدة للموقع: النافبار والبحث والفوتر كلهم بيقروا منها.
   - «قاع الأفكار» قسم رئيسي مستقل في النافبار العلوي فقط (بدون تكرار داخل قائمة «مساحة»). */

export const VERDICT_ITEMS = [
  {
    to: '/verdict/movies',
    label: 'حُكم السينما',
    sub: 'مراجعات وتقييمات الأفلام',
    icon: Film,
    motion: 'tilt',
  },
  {
    to: '/verdict/series',
    label: 'حُكم المسلسلات',
    sub: 'قراءات في المواسم والحلقات',
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
  {
    to: '/masaha/ahmed',
    label: 'عن أحمد',
    sub: 'تجربة تفاعلية وراء الصورة والحكاية',
    icon: User,
    motion: 'nod',
  },
]

export const NAV = [
  { key: '/', to: '/', label: 'الرئيسية', icon: Home, motion: 'beat' },
  {
    key: 'verdict',
    label: 'الفِردِكت',
    tag: 'THE VERDICT',
    icon: Scale,
    motion: 'tilt',
    children: VERDICT_ITEMS,
  },
  { key: '/stories', to: '/stories', label: 'الحكايات', icon: History, motion: 'rewind' },
  { key: '/videos', to: '/videos', label: 'الفيديوهات', icon: Video, motion: 'beat' },
  { key: '/articles', to: '/articles', label: 'المقالات', icon: BookOpen, motion: 'nudge' },
  {
    key: '/ideas',
    to: '/ideas',
    label: 'قاع الأفكار',
    sub: 'دفاتر المسودات والتجارب البصرية',
    icon: Lightbulb,
    motion: 'tilt',
  },
  { key: 'masaha', label: 'مساحة', icon: Compass, motion: 'spin', children: MASAHA_ITEMS },
]

/* القسم النشط من المسار */
export function sectionKey(pathname) {
  if (pathname.startsWith('/verdict') || pathname.startsWith('/review')) return 'verdict'
  if (pathname.startsWith('/ideas') || pathname.startsWith('/masaha/ideas')) return '/ideas'
  if (
    pathname.startsWith('/masaha') ||
    pathname.startsWith('/on-air') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/ahmed')
  )
    return 'masaha'
  if (pathname.startsWith('/stories')) return '/stories'
  if (pathname.startsWith('/video')) return '/videos'
  if (pathname.startsWith('/article')) return '/articles'
  return '/'
}
