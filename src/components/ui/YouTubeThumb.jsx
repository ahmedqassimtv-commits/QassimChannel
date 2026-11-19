import { useEffect, useState } from 'react'

// سلم دقة صور يوتيوب من الأعلى (1280×720 HD) إلى الاحتياطية مع حماية ضد الصورة الرمادية 120×90
const THUMB_LADDER = ['maxresdefault', 'sddefault', 'hqdefault']

export default function YouTubeThumb({
  youtubeId,
  alt = '',
  className = '',
  cropLetterboxOnFallback = false,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  ...props
}) {
  const [tier, setTier] = useState(0)

  useEffect(() => {
    setTier(0)
  }, [youtubeId])

  const advance = () => {
    setTier((prev) => (prev < THUMB_LADDER.length - 1 ? prev + 1 : prev))
  }

  const quality = THUMB_LADDER[tier]
  const isLetterboxed = tier > 0 && cropLetterboxOnFallback
  const src = `https://i.ytimg.com/vi/${youtubeId}/${quality}.jpg`

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onError={advance}
      onLoad={(event) => {
        // يوتيوب يعيد أحياناً صورة رمادية صغيرة (120×90) بدلاً من خطأ 404 عند غياب maxresdefault
        if (event.currentTarget.naturalWidth <= 120 && tier < THUMB_LADDER.length - 1) {
          advance()
        }
      }}
      className={`${className} ${isLetterboxed ? 'scale-[1.35]' : ''}`.trim()}
      {...props}
    />
  )
}
