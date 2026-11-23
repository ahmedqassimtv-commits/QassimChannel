import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CinemaReel from '../components/verdict/CinemaReel.jsx'

/* ══ قسم السينما والمسلسلات — Cinema Reel (cinema-reel.md) ═════════════
   بكرة الفِردِكت الرأسية بكامل الشاشة مع فيزياء التقاط نابضية، بارالاكس 1.2x،
   دخول بكرة الفيلم القديمة، ولوحة تفاصيل المراجعة بميل ثلاثي الأبعاد 15 درجة. */

export default function Reviews({ defaultTab = 'فيلم' }) {
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState(defaultTab || 'الكل')

  useEffect(() => {
    setFilterType(defaultTab || 'الكل')
  }, [defaultTab])

  const handleFilterChange = (next) => {
    setFilterType(next)
    if (next === 'فيلم') navigate('/verdict/movies', { replace: true })
    else if (next === 'مسلسل') navigate('/verdict/series', { replace: true })
  }

  return <CinemaReel filterType={filterType} onFilterChange={handleFilterChange} />
}
