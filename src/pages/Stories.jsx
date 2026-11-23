import { useMemo } from 'react'
import BiryaniLegendsTemplate from '../components/archive/BiryaniLegendsTemplate.tsx'
import { stories } from '../data/stories.js'

/* ══ قسم الأرشيف — كتاب الأرشيف المطبوع ثلاثي الأبعاد (Page-Flip Book Template) ══
   يعرض حكايات الأرشيف المصوّرة في كتاب مطبوع تفاعلي ثلاثي الأبعاد تُقلّب صفحاته
   الحقيقية حول كعب الكتاب مع التمرير أو السحب أو الأسهم، مع رسوم الحفر اليدوي
   (Engravings) وظهور الحبر التدريجي على الورق المعتّق. */

export default function Stories() {
  const legends = useMemo(
    () =>
      stories.map((s, idx) => ({
        name: s.title,
        title: `${s.location} · ${s.year}`,
        city: s.city || `${s.location.split('—')[0].trim()} ${s.year}`,
        dishName: s.era,
        layout: s.layout || (['shore', 'summit', 'terrace'][idx % 3]),
        engraving: s.engraving || (['harbour', 'fort', 'garden'][idx % 3]),
        tone: s.tone || (idx % 2 === 0 ? 'sepia' : 'graphite'),
        seed: idx * 3 + 3,
        story: [s.caption, s.story],
        continued: [
          s.continued ||
            'كل صورة في هذا الأرشيف تحمل وراءها تفاصيل يوم كامل من حياة المدينة: الضوء، الوجوه، والزمن الذي حفظته العدسة قبل أن يتغير المشهد.',
        ],
        note:
          s.note ||
          `توثيق بصري من ${s.era} (${s.year}) — محفوظ في أرشيف قاسمز للحكايات المصوّرة.`,
        dish: {
          vessel: ['brass', 'clay', 'enamel'][idx % 3],
          rice: ['jeerakasala', 'seeraga', 'basmati'][idx % 3],
          seed: idx * 2 + 4,
          alt: s.title,
        },
      })),
    [],
  )

  return (
    <div dir="ltr" className="w-full">
      <BiryaniLegendsTemplate
        preset="midnight"
        height="100dvh"
        fontHref={null}
        displayFont="var(--font-display)"
        scriptFont="var(--font-display)"
        bodyFont="var(--font-text)"
        title="أرشيف الحكايات"
        subtitle="ذاكرة الصورة والزمن"
        edition="الطبعة الأرشيفية الأولى · ٢٠٢٦"
        publisher="منصة قاسمز · QASSIMZ ARCHIVE"
        epigraph="الصورة الفوتوغرافية لا تستعيد الماضي فحسب، بل تمنحه حياةً ثانية على الورق."
        legends={legends}
        cta={{ label: 'قلع الأفكار', href: '/QassimChannel/ideas' }}
        closing={{
          heading: 'دفترُ الأرشيف المفتوح',
          script: 'حكاياتٌ تُحفظ كي لا تُنسى',
          body: 'يجمع هذا الكتاب فصولاً منتقاة من أرشيف المدن والذاكرة البصرية؛ كل صفحة صُمّمت لتُقرأ بتأنٍّ مع رسوم الحفر الكلاسيكية.',
          primary: { label: 'تصفّح المقالات المصوّرة', href: '/QassimChannel/articles' },
          secondary: { label: 'عودة إلى الرئيسية', href: '/QassimChannel/' },
          newsletter: 'اشترك في مراسلات الأرشيف البريدية',
        }}
        columns={[
          {
            title: 'فصول الأرشيف',
            links: stories.map((s) => ({ label: s.city || s.title, href: '#main' })),
          },
          {
            title: 'أقسام المنصة',
            links: [
              { label: 'الرئيسية', href: '/QassimChannel/' },
              { label: 'الفِردِكت', href: '/QassimChannel/verdict/movies' },
              { label: 'المقالات المصوّرة', href: '/QassimChannel/articles' },
              { label: 'قلع الأفكار', href: '/QassimChannel/ideas' },
            ],
          },
          {
            title: 'مساحة قاسمز',
            links: [
              { label: 'عن أحمد', href: '/QassimChannel/masaha/ahmed' },
              { label: 'أون إير', href: '/QassimChannel/masaha/on-air' },
              { label: 'الكتب والقصص', href: '/QassimChannel/masaha/books' },
            ],
          },
        ]}
        colophon="طُبع هذا الأرشيف الرقمي بخط ثمانية للعناوين والنصوص مع محرك تقليب الصفحات ثلاثي الأبعاد."
        copyright={`© ${new Date().getFullYear()} قاسمز — جميع الحقوق محفوظة.`}
      />
    </div>
  )
}
