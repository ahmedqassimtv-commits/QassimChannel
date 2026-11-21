import { Link } from 'react-router-dom'
import { ArrowUpLeft } from 'lucide-react'
import BrandLogo from '../brand/BrandLogo.jsx'
import { NAV } from '../nav/navConfig.js'
import { YOUTUBE_CONFIG } from '../../data/youtubeConfig.js'
import { Reveal } from '../motion/Motion.jsx'

/* الفوتر: دعوة أخيرة للقناة، خريطة الأقسام، وكلمة «قاسمز» ضخمة محفورة
   بخط Quiverleaf كتوقيع للموقع. */
export default function Footer() {
  const links = NAV.flatMap((n) => (n.children ? n.children : [n]))
  return (
    <footer className="qz-footer relative z-10 mx-auto w-full max-w-[1320px] overflow-hidden px-[var(--qz-page-x)] pt-10" dir="rtl">
      <div className="qz-rule" />
      <div className="grid gap-12 py-14 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <Reveal>
          <p className="qz-eyebrow">القناة</p>
          <p className="qz-h2 mt-4 max-w-xl">كل أسبوع حكاية جديدة بالصورة والصوت.</p>
          <a href={YOUTUBE_CONFIG.channelUrl} target="_blank" rel="noreferrer" className="qz-btn mt-8">
            اشترك على يوتيوب
            <ArrowUpLeft className="size-4" aria-hidden="true" />
          </a>
        </Reveal>
        <Reveal delay={0.1}>
          <nav aria-label="خريطة الموقع" className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="qz-link w-fit text-[0.95rem] font-normal text-[color:var(--qz-text-2)]">
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>
        </Reveal>
      </div>
      <div className="flex flex-col items-start justify-between gap-4 border-t border-[color:var(--qz-line)] py-6 text-xs text-[color:var(--qz-text-3)] sm:flex-row sm:items-center">
        <Link to="/" aria-label="قاسمز — الرئيسية" className="text-[color:var(--qz-text-2)]">
          <BrandLogo className="h-6 w-auto" />
        </Link>
        <p>محتوى يُشاهد بتأنٍ، وحكايات تستحق أن تُروى.</p>
        <p className="qz-num">© {new Date().getFullYear()} قاسمز</p>
      </div>
      <p className="qz-footer-word -mb-[0.22em] select-none text-center" aria-hidden="true">
        قاسمز
      </p>
    </footer>
  )
}
