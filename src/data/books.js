import { assetUrl } from '../utils/assets.js'

// الكتب والقصص — مصدر واحد للصفحة والبحث
export const books = [
  {
    id: 'book-1',
    title: 'في مديح البطء',
    author: 'كارل أونوريه',
    category: 'قراءة',
    cover: assetUrl('/fractal/optimized/15.webp'),
    excerpt: 'كتاب يدعونا للتوقف عن الركض المحموم والتأمل في تفاصيل الحياة التي نمر عليها مرور الكرام.',
    rating: 4,
  },
  {
    id: 'book-2',
    title: 'عن التصوير الفوتوغرافي',
    author: 'سوزان سونتاغ',
    category: 'قراءة',
    cover: assetUrl('/fractal/optimized/51.webp'),
    excerpt: 'تأملات فلسفية عميقة في الصورة وعلاقتنا بها — كيف نرى العالم من خلال العدسة.',
    rating: 5,
  },
  {
    id: 'book-3',
    title: 'حكايات من خلف الكاميرا',
    author: 'قاسم',
    category: 'قصة',
    cover: assetUrl('/fractal/optimized/70.webp'),
    excerpt: 'مجموعة قصصية قصيرة تروي لحظات من كواليس صناعة المحتوى — الأخطاء، المفاجآت، والدهشة.',
    rating: null,
  },
  {
    id: 'book-4',
    title: 'ضوء آخر النهار',
    author: 'قاسم',
    category: 'قصة',
    cover: assetUrl('/fractal/optimized/86.webp'),
    excerpt: 'تفاصيل صغيرة من أيام طويلة — مكتوبة بلغة الصورة قبل أن تكون كلمات.',
    rating: null,
  },
]
