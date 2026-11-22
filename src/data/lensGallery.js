import { videos } from './videos.js'
import { reviews } from './reviews.js'

/*
 * صور معرض «العدسة السائلة» في الصفحة الرئيسية.
 * ✏️ للتعديل: زوّد أو امسح أو غيّر أي عنصر في القائمة دي.
 *  - src : مسار الصورة (من فولدر public زي '/images/x.jpg') أو رابط كامل
 *  - alt : وصف قصير للصورة
 * الصور بتتوزع لوحدها على الأعمدة، وكل ما تزود صور كل ما المعرض يبقى أغنى.
 */
const yt = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

export const lensGallery = [
  { src: import.meta.env.BASE_URL + 'fractal/optimized/01.webp', alt: 'خلفية فركتال 1' },
  { src: import.meta.env.BASE_URL + 'fractal/optimized/02.webp', alt: 'خلفية فركتال 2' },
  { src: import.meta.env.BASE_URL + 'images/home.jpg', alt: 'الصورة الرئيسية' },
  { src: import.meta.env.BASE_URL + 'fractal/optimized/08.webp', alt: 'خلفية فركتال 3' },
  { src: import.meta.env.BASE_URL + 'fractal/optimized/106.webp', alt: 'خلفية فركتال 4' },
  { src: import.meta.env.BASE_URL + 'fractal/optimized/51.webp', alt: 'خلفية فركتال 5' },

  // صور مصغّرة من فيديوهات القناة والمراجعات (بتتحدث لوحدها لما تضيف فيديو جديد)
  ...videos.filter((v) => v.youtubeId).map((v) => ({ src: yt(v.youtubeId), alt: v.title })),
  ...reviews.filter((r) => r.youtubeId).map((r) => ({ src: yt(r.youtubeId), alt: r.titleAr || r.title || '' })),
]
