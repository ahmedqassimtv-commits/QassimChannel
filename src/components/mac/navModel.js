import {
  BookOpen,
  Clapperboard,
  Film,
  History,
  House,
  Moon,
  Palette,
  Play,
  Radio,
  Search,
  Sparkles,
  Sun,
  Tv,
  UserRound,
  Video,
} from 'lucide-react'
import { reviews } from '../../data/reviews.js'
import { videos } from '../../data/videos.js'
import { stories } from '../../data/stories.js'
import { articles } from '../../data/articles.js'

/*
 * خريطة الموقع على طريقة نظام ماك: كل قسم = «قائمة» في شريط القوائم
 * و«تطبيق» في الـDock. مصدر واحد للشريط والـDock والبحث (Spotlight).
 */

export const THEME_META = {
  night: { label: 'ليلي', icon: Moon, swatch: ['#0D1440', '#3340B8', '#9AA6F2'] },
  green: { label: 'زمردي', icon: Sparkles, swatch: ['#0B2B26', '#235347', '#8EB69B'] },
  red: { label: 'جمري', icon: Palette, swatch: ['#3B160C', '#E5372B', '#F59E2B'] },
  blue: { label: 'لبني فاتح', icon: Sun, swatch: ['#EBE2CC', '#B7B09E', '#5E584B'] },
}

/* الـDock: ترتيب الأيقونات وألوان بلاطة كل «تطبيق» (تصميم أصلي بأيقونات lucide) */
export const DOCK_APPS = [
  { id: 'home', label: 'الرئيسية', to: '/', icon: House, tile: ['#5B6CFF', '#2A2F8F'], match: (p) => p === '/' },
  { id: 'verdict', label: 'الفِردِكت', to: '/verdict/movies', icon: Clapperboard, tile: ['#FF6A3D', '#B3221B'], match: (p) => p.startsWith('/verdict') },
  { id: 'stories', label: 'أرشيف الحكايات', to: '/stories', icon: History, tile: ['#F5C451', '#C9781B'], match: (p) => p.startsWith('/stories') },
  { id: 'videos', label: 'الفيديوهات', to: '/videos', icon: Play, tile: ['#FF4D6D', '#9E1239'], match: (p) => p.startsWith('/videos') },
  { id: 'articles', label: 'المقالات', to: '/articles', icon: BookOpen, tile: ['#F2F2F7', '#B9BCC9'], dark: true, match: (p) => p.startsWith('/articles') },
  { id: 'onair', label: 'أون إير', to: '/on-air', icon: Radio, tile: ['#3EE08F', '#0E8A55'], match: (p) => p.startsWith('/on-air') },
  { divider: true, id: 'div' },
  { id: 'about', label: 'عن أحمد', to: '/about', icon: UserRound, tile: ['#A68BFF', '#5631C9'], match: (p) => p.startsWith('/about') },
  { id: 'search', label: 'بحث', action: 'spotlight', icon: Search, tile: ['#6B7280', '#1F2430'] },
]

const fmtRating = (r) => `${Number(r).toLocaleString('ar-EG')}/١٠`
const shortTitle = (t, n = 34) => (t.length > n ? `${t.slice(0, n - 1)}…` : t)

/* قوائم شريط القوائم. shortcut = ⌥ + رقم (بيشتغل فعلاً من الكيبورد) */
export function buildMenus() {
  const latestReviews = [...reviews].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4)
  const latestVideos = [...videos].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4)
  const latestArticles = articles.slice(0, 4)
  const someStories = stories.slice(0, 4)

  return [
    {
      id: 'verdict',
      label: 'الفِردِكت',
      match: (p) => p.startsWith('/verdict') || p.startsWith('/reviews'),
      items: [
        { label: 'حُكم الأفلام', icon: Film, to: '/verdict/movies', shortcut: '1' },
        { label: 'حُكم المسلسلات', icon: Tv, to: '/verdict/series', shortcut: '2' },
        { type: 'sep' },
        { type: 'header', label: 'أحدث الأحكام' },
        ...latestReviews.map((r) => ({
          label: shortTitle(r.titleAr || r.title),
          to: r.mediaType === 'مسلسل' ? '/verdict/series' : '/verdict/movies',
          hint: fmtRating(r.rating),
        })),
      ],
    },
    {
      id: 'stories',
      label: 'الحكايات',
      match: (p) => p.startsWith('/stories'),
      items: [
        { label: 'أرشيف الحكايات', icon: History, to: '/stories', shortcut: '3' },
        { type: 'sep' },
        { type: 'header', label: 'من الأرشيف' },
        ...someStories.map((s) => ({ label: shortTitle(s.title), to: '/stories', hint: s.year })),
      ],
    },
    {
      id: 'videos',
      label: 'الفيديوهات',
      match: (p) => p.startsWith('/videos'),
      items: [
        { label: 'كل الحلقات', icon: Video, to: '/videos', shortcut: '4' },
        { label: 'الشورتس', icon: Play, to: '/videos/shorts' },
        { type: 'sep' },
        { type: 'header', label: 'أحدث الحلقات' },
        ...latestVideos.map((v) => ({
          label: shortTitle(v.title),
          href: `https://youtu.be/${v.youtubeId}`,
          hint: v.category,
        })),
      ],
    },
    {
      id: 'articles',
      label: 'المقالات',
      match: (p) => p.startsWith('/articles'),
      items: [
        { label: 'كل المقالات', icon: BookOpen, to: '/articles', shortcut: '5' },
        ...(latestArticles.length
          ? [
              { type: 'sep' },
              { type: 'header', label: 'أحدث المقالات' },
              ...latestArticles.map((a) => ({ label: shortTitle(a.title), to: `/articles/${a.slug}`, hint: a.category })),
            ]
          : []),
      ],
    },
    {
      id: 'onair',
      label: 'أون إير',
      match: (p) => p.startsWith('/on-air'),
      items: [
        { label: 'افتح أون إير', icon: Radio, to: '/on-air', shortcut: '6' },
        { label: 'عن أحمد', icon: UserRound, to: '/about', shortcut: '7' },
      ],
    },
  ]
}

/* فهرس Spotlight: الأقسام + كل المحتوى */
export function buildSearchIndex() {
  const sections = [
    { title: 'الرئيسية', sub: 'الواجهة', to: '/', icon: House, group: 'الأقسام' },
    { title: 'حُكم الأفلام', sub: 'الفِردِكت', to: '/verdict/movies', icon: Film, group: 'الأقسام' },
    { title: 'حُكم المسلسلات', sub: 'الفِردِكت', to: '/verdict/series', icon: Tv, group: 'الأقسام' },
    { title: 'أرشيف الحكايات', sub: 'صور وقصص من التاريخ', to: '/stories', icon: History, group: 'الأقسام' },
    { title: 'الفيديوهات', sub: 'حلقات وشورتس', to: '/videos', icon: Video, group: 'الأقسام' },
    { title: 'المقالات', sub: 'قراءات متأنية', to: '/articles', icon: BookOpen, group: 'الأقسام' },
    { title: 'أون إير', sub: 'حضور قاسم الحيّ', to: '/on-air', icon: Radio, group: 'الأقسام' },
    { title: 'عن أحمد', sub: 'الملف التعريفي', to: '/about', icon: UserRound, group: 'الأقسام' },
  ]
  const content = [
    ...reviews.map((r) => ({
      title: r.titleAr || r.title,
      sub: `${r.mediaType} · ${fmtRating(r.rating)}`,
      to: r.mediaType === 'مسلسل' ? '/verdict/series' : '/verdict/movies',
      icon: r.mediaType === 'مسلسل' ? Tv : Film,
      group: 'الفِردِكت',
      extra: `${r.title} ${(r.tags || []).join(' ')}`,
    })),
    ...articles.map((a) => ({ title: a.title, sub: a.category, to: `/articles/${a.slug}`, icon: BookOpen, group: 'المقالات', extra: a.excerpt })),
    ...stories.map((s) => ({ title: s.title, sub: `${s.year} · ${s.location}`, to: '/stories', icon: History, group: 'الحكايات', extra: s.era })),
    ...videos.map((v) => ({ title: v.title, sub: v.category, href: `https://youtu.be/${v.youtubeId}`, icon: Play, group: 'الفيديوهات', extra: v.summary })),
  ]
  return [...sections, ...content]
}

export const SHORTCUT_ROUTES = {
  1: '/verdict/movies',
  2: '/verdict/series',
  3: '/stories',
  4: '/videos',
  5: '/articles',
  6: '/on-air',
  7: '/about',
  0: '/',
}
