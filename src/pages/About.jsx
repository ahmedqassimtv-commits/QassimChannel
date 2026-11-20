import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft } from 'lucide-react'
import { assetUrl } from '../utils/assets.js'
import { YOUTUBE_CONFIG } from '../data/youtubeConfig.js'
import { SectionHead } from '../components/qz/Kit.jsx'
import { Reveal, SplitTitle, Stagger, StaggerItem, EASE } from '../components/motion/Motion.jsx'

/* ══ عنّي ═════════════════════════════════════════════════════════════
   الاسم بخط ضخم، اقتباس، معرض «من العدسة» بشبكة غير منتظمة (bento)،
   ومسيرة بخط بيترسم مع التمرير، وروابط المنصات. */

const GALLERY = [
  { src: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg', alt: 'حكاية مدينة لا تنام', caption: 'تصوير وثائقي', span: 'sm:col-span-2 sm:row-span-2' },
  { src: 'https://i.ytimg.com/vi/ScMzIvxBSi4/maxresdefault.jpg', alt: 'كيف نحكي بالصورة؟', caption: 'حديث عن السينما', span: '' },
  { src: 'https://i.ytimg.com/vi/tFMo3UJ4B4g/maxresdefault.jpg', alt: 'مراجعة Arrival', caption: 'الفِردِكت', span: '' },
  { src: 'https://i.ytimg.com/vi/Way9Dexny3w/maxresdefault.jpg', alt: 'مراجعة Dune: Part Two', caption: 'ملحمة الكثيب', span: 'sm:row-span-2' },
  { src: 'https://i.ytimg.com/vi/LXb3EKWsInQ/maxresdefault.jpg', alt: 'ضوء آخر النهار', caption: 'لقطة قصيرة', span: '' },
  { src: assetUrl('/fractal/optimized/08.webp'), alt: 'هوية بصرية', caption: 'هوية بصرية', span: '' },
]

const MILESTONES = [
  { year: '2019', title: 'البداية', desc: 'أول فيديو على يوتيوب — الشغف بالحكاية البصرية بيتحول لمحتوى.' },
  { year: '2021', title: 'الفِردِكت', desc: 'إطلاق سلسلة الأحكام السينمائية — THE VERDICT.' },
  { year: '2023', title: 'التوسّع', desc: 'مقالات، حكايات مصوّرة، وأرشيف بصري بيمتد عبر عقود.' },
  { year: '2026', title: 'المنصة', desc: 'إعادة بناء المنصة بالكامل: مشهد حي، زجاج سائل، وهوية عربية أصيلة.' },
]

const SOCIALS = [
  { label: 'YouTube', sub: '@AhmedQassimTV', href: YOUTUBE_CONFIG.channelUrl },
  { label: 'Instagram', sub: 'قريباً', href: null },
  { label: 'TikTok', sub: 'قريباً', href: null },
]

export default function About() {
  const reduce = useReducedMotion()
  return (
    <div>
      <header className="flex min-h-[calc(100svh-9rem)] flex-col justify-center py-10 text-center">
        <Reveal y={8}>
          <p className="qz-eyebrow justify-center">وراء الصورة والحكاية</p>
        </Reveal>
        <SplitTitle text="قاسم" className="qz-display mt-6" delay={0.08} />
        <Reveal delay={0.3} className="qz-lead mx-auto mt-8 max-w-2xl">
          صانع محتوى عربي بيدوّر في تفاصيل الصورة، وبيحكي بالضوء والظل والكلمة. من الأحكام السينمائية للوثائقيات — كل لقطة وراها حكاية تستحق تتحكي.
        </Reveal>
        <Reveal delay={0.4} className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/videos" className="qz-btn">
            شوف الأعمال
            <ArrowUpLeft className="size-4" aria-hidden="true" />
          </Link>
          <Link to="/masaha/on-air" className="qz-btn qz-btn-ghost">
            أون إير
          </Link>
        </Reveal>
      </header>

      <section className="qz-section">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="font-[family-name:var(--font-quiver)] text-[clamp(1.8rem,4vw,3.4rem)] font-light leading-[1.6] text-[color:var(--qz-text)]">
            «مش مهم بتبدأ منين، المهم بتكبر إزاي من هناك.»
          </p>
          <p className="mt-6 text-sm text-[color:var(--qz-text-3)]">— قاسم</p>
        </Reveal>
      </section>

      <section className="qz-section pt-0">
        <SectionHead index="01" eyebrow="من العدسة" title="لقطات من الطريق" />
        <Stagger className="grid auto-rows-[180px] grid-cols-2 gap-4 sm:auto-rows-[220px] sm:grid-cols-4">
          {GALLERY.map((g) => (
            <StaggerItem key={g.src} className={`group qz-hover-zoom ${g.span}`}>
              <figure className="qz-media size-full">
                <img src={g.src} alt={g.alt} loading="lazy" />
                <div className="qz-scrim" />
                <figcaption className="absolute bottom-4 right-4 text-sm text-white/85">{g.caption}</figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="qz-section pt-0">
        <SectionHead index="02" eyebrow="المسيرة" title="من أول فيديو للمنصة" />
        <div className="relative">
          <motion.div
            className="absolute right-0 top-[52px] hidden h-px w-full origin-right bg-[color:var(--qz-accent)] opacity-60 lg:block"
            initial={{ scaleX: reduce ? 1 : 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 1.6, ease: EASE }}
            aria-hidden="true"
          />
          <Stagger className="grid gap-10 lg:grid-cols-4" gap={0.15}>
            {MILESTONES.map((m) => (
              <StaggerItem key={m.year}>
                <p className="qz-num font-[family-name:var(--font-quiver)] text-5xl font-light text-[color:var(--qz-text)]">{m.year}</p>
                <span className="mt-4 block size-2.5 rounded-full bg-[color:var(--qz-accent)] shadow-[0_0_14px_var(--qz-accent)]" aria-hidden="true" />
                <h3 className="qz-h3 mt-5">{m.title}</h3>
                <p className="qz-body mt-2 text-[0.95rem]">{m.desc}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="qz-section pt-0">
        <SectionHead index="03" eyebrow="تابع" title="على المنصات" />
        <Stagger className="grid gap-4 sm:grid-cols-3">
          {SOCIALS.map((s) => (
            <StaggerItem key={s.label}>
              {s.href ? (
                <a href={s.href} target="_blank" rel="noreferrer" className="qz-panel group flex items-center justify-between p-6">
                  <span>
                    <span className="qz-latin block text-sm text-[color:var(--qz-text)]">{s.label}</span>
                    <span className="mt-1 block text-xs text-[color:var(--qz-text-3)]" dir="ltr">
                      {s.sub}
                    </span>
                  </span>
                  <ArrowUpLeft className="size-5 text-[color:var(--qz-accent)] transition-transform duration-500 group-hover:-translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
                </a>
              ) : (
                <div className="qz-panel flex items-center justify-between p-6 opacity-60">
                  <span>
                    <span className="qz-latin block text-sm text-[color:var(--qz-text)]">{s.label}</span>
                    <span className="mt-1 block text-xs text-[color:var(--qz-text-3)]">{s.sub}</span>
                  </span>
                </div>
              )}
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  )
}
