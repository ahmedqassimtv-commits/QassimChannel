import { Radio } from 'lucide-react'
import { FoldingBill } from '../components/onair/FoldingBill.tsx'
import { PageHero, SectionHead, ShortTile, VideoTile } from '../components/qz/Kit.jsx'
import { Stagger, StaggerItem } from '../components/motion/Motion.jsx'
import { videos } from '../data/videos.js'

export default function OnAir() {
  return (
    <div>
      <PageHero
        index="—"
        eyebrow="مساحة · البث الاجتماعي الحيّ"
        title="أون إير"
        lead="مساحة متجددة بتجمع منشورات قاسم اليومية، مقتطفاته السريعة، وتحديثاته على المنصات في مكان واحد."
        aside={
          /* ورقة قاسمز الزجاجية — اسحبها واطويها (three.js بيتحمّل مع الصفحة دي بس) */
          <div className="flex flex-col items-center gap-3">
            <FoldingBill />
            <span className="text-xs text-[color:var(--qz-text-3)]">اسحب الورقة واطويها</span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="qz-chip qz-chip-live">
            <Radio className="size-3.5" aria-hidden="true" /> على الهوا
          </span>
        </div>
      </PageHero>

      <section className="qz-section">
        <SectionHead index="01" eyebrow="من القناة" title="آخر ما اتنشر" to="/videos" cta="كل الفيديوهات" />
        <Stagger className="grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {videos.slice(0, 3).map((v) => (
            <StaggerItem key={v.id}>
              {v.type === 'short' ? <ShortTile video={v} /> : <VideoTile video={v} />}
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  )
}
