import { useMemo } from 'react'
import { reviews } from '../data/reviews.js'
import { useCinema } from '../components/qz/CinemaPlayer.jsx'
import CinemaReel from '../components/verdict/CinemaReel.jsx'

/* ══ الفِردِكت ═════════════════════════════════════════════════════════
   بكرة سينما بالشاشة كلها (Cinema Reel): كل حكم كادر. الأفلام والمسلسلات
   في نفس البكرة، و/verdict/movies أو /verdict/series بيحدد أول كادر
   (والـPlan switch في النافبار بيبدّل بينهم من غير ما الصفحة تتقفل). */

const asVideo = (r) => ({
  youtubeId: r.youtubeId,
  title: r.titleAr || r.title,
  category: `الفِردِكت · ${r.mediaType}`,
  summary: r.verdict,
})

export default function Reviews({ defaultTab = 'فيلم' }) {
  const cinema = useCinema()
  // الأفلام الأول وبعدين المسلسلات، والأعلى تقييماً الأول جوّه كل نوع
  const items = useMemo(
    () =>
      ['فيلم', 'مسلسل'].flatMap((t) =>
        reviews.filter((r) => r.mediaType === t).sort((a, b) => b.rating - a.rating),
      ),
    [],
  )
  const startId = items.find((r) => r.mediaType === defaultTab)?.id

  return (
    <div>
      <h1 className="sr-only">الفِردِكت — {defaultTab === 'مسلسل' ? 'المسلسلات' : 'الأفلام'}</h1>
      <CinemaReel items={items} startId={startId} onWatch={(r) => cinema.open(asVideo(r))} />
    </div>
  )
}
