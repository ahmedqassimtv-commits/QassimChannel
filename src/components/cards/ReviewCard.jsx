import { VerdictTile } from '../qz/Kit.jsx'
import { useCinema } from '../qz/CinemaPlayer.jsx'

export default function ReviewCard({ review }) {
  const cinema = useCinema()
  return (
    <VerdictTile
      review={review}
      onPlay={() =>
        cinema.open({
          youtubeId: review.youtubeId,
          title: review.titleAr || review.title,
          category: `الفِردِكت · ${review.mediaType}`,
          summary: review.verdict,
        })
      }
    />
  )
}
