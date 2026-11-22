import { Link } from 'react-router-dom'
import { ArrowUpLeft } from 'lucide-react'
import BrandLogo from '../brand/BrandLogo.jsx'
import { NAV } from '../nav/navConfig.js'
import { YOUTUBE_CONFIG } from '../../data/youtubeConfig.js'
import { assetUrl } from '../../utils/assets.js'
import { Reveal } from '../motion/Motion.jsx'

/* ══ الفوتر ═══════════════════════════════════════════════════════════
   كارت أخير للقناة (عنوان بتدريج الثيم + وش قاسم + اشتراك)، وتحته الأقسام
   متجمّعة زي النافبار بالظبط، وسطر صغير في الآخر. من غير الكلمة الضخمة. */

const MAIN = NAV.filter((n) => !n.children)
const GROUPS = NAV.filter((n) => n.children)

export default function Footer() {
  const toTop = () => {
    const lenis = window.__qzLenis
    if (lenis) lenis.scrollTo(0)
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <footer
      className="qz-foot relative z-10 mx-auto w-full max-w-[1320px] px-[var(--qz-page-x)] pb-10 pt-16"
      dir="rtl"
    >
      <Reveal>
        <div className="qz-foot-card">
          <div className="qz-foot-copy">
            <p className="qz-eyebrow">القناة</p>
            <p className="qz-h2 mt-4">كل أسبوع حكاية جديدة بالصورة والصوت.</p>
            <p className="qz-foot-lead">
              أفلام ووثائقيات وأحكام صادقة — على يوتيوب {YOUTUBE_CONFIG.channelHandle}
            </p>
            <div className="qz-foot-actions">
              <a
                href={YOUTUBE_CONFIG.channelUrl}
                target="_blank"
                rel="noreferrer"
                className="qz-btn"
              >
                اشترك على يوتيوب
                <ArrowUpLeft className="size-4" aria-hidden="true" />
              </a>
              <Link to="/masaha/about" className="qz-btn qz-btn-ghost">
                مين قاسم؟
              </Link>
            </div>
          </div>
          <img
            className="qz-foot-face"
            src={assetUrl('/avatar/anime/base.webp')}
            alt=""
            loading="lazy"
          />
        </div>
      </Reveal>

      <nav aria-label="خريطة الموقع" className="qz-foot-map">
        <div>
          <p className="qz-foot-h">الأقسام</p>
          {MAIN.map((l) => (
            <Link key={l.to} to={l.to}>
              {l.label}
            </Link>
          ))}
        </div>
        {GROUPS.map((g) => (
          <div key={g.key}>
            <p className="qz-foot-h">{g.label}</p>
            {g.children.map((l) => (
              <Link key={l.to} to={l.to}>
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="qz-foot-bar">
        <Link to="/" aria-label="قاسمز — الرئيسية" className="qz-foot-logo">
          <BrandLogo className="h-5 w-auto" />
        </Link>
        <p>محتوى يُشاهد بتأنٍ، وحكايات تستحق أن تُروى.</p>
        <p className="qz-num">© {new Date().getFullYear()}</p>
        <button type="button" onClick={toTop} className="qz-foot-top">
          لفوق ↑
        </button>
      </div>
    </footer>
  )
}
