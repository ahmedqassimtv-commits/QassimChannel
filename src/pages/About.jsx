import { motion } from 'framer-motion'
import { ArrowUpLeft, Camera, Film, BookOpen, Radio, Clapperboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/glass/GlassCard.jsx'
import { assetUrl } from '../utils/assets.js'

const heroEase = [0.22, 1, 0.36, 1]
const rise = (delay) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, delay, ease: heroEase },
})

// صور placeholder من YouTube thumbnails الموجودة
const GALLERY = [
  { src: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg', alt: 'حكاية مدينة لا تنام', caption: 'تصوير وثائقي، 2025', span: 'col-span-2 row-span-2' },
  { src: 'https://i.ytimg.com/vi/ScMzIvxBSi4/maxresdefault.jpg', alt: 'كيف نحكي بالصورة؟', caption: 'حديث عن السينما', span: 'col-span-1' },
  { src: 'https://i.ytimg.com/vi/tFMo3UJ4B4g/maxresdefault.jpg', alt: 'مراجعة Arrival', caption: 'الفِردِكت', span: 'col-span-1' },
  { src: 'https://i.ytimg.com/vi/Way9Dexny3w/maxresdefault.jpg', alt: 'مراجعة Dune: Part Two', caption: 'ملحمة الكثيب', span: 'col-span-1 row-span-2' },
  { src: 'https://i.ytimg.com/vi/LXb3EKWsInQ/maxresdefault.jpg', alt: 'ضوء آخر النهار', caption: 'لقطة قصيرة', span: 'col-span-1' },
  { src: assetUrl('/fractal/optimized/08.webp'), alt: 'فن فراكتالي', caption: 'هوية بصرية', span: 'col-span-1' },
]

const MILESTONES = [
  { year: '2019', title: 'البداية', desc: 'أول فيديو على YouTube — الشغف بالحكاية البصرية يتحول إلى محتوى.' },
  { year: '2021', title: 'الفِردِكت', desc: 'إطلاق سلسلة المراجعات السينمائية — THE VERDICT.' },
  { year: '2023', title: 'التوسع', desc: 'مقالات، حكايات مصورة، وأرشيف بصري يمتد عبر عقود.' },
  { year: '2025', title: 'المنصة', desc: 'إعادة بناء المنصة بالكامل — زجاج سائل وهوية عربية أصيلة.' },
]

const SOCIALS = [
  { label: 'YouTube', href: 'https://www.youtube.com/@AhmedQassimTV', color: 'bg-red-500/20 text-red-300' },
  { label: 'Instagram', href: '#', color: 'bg-pink-500/20 text-pink-300' },
  { label: 'TikTok', href: '#', color: 'bg-cyan-500/20 text-cyan-300' },
]

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-0"
    >
      {/* ===== Hero — ملء الشاشة ===== */}
      <section className="relative -mx-5 -mt-32 flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-5 sm:-mx-8 sm:px-8">
        {/* خلفية فراكتالية */}
        <div className="absolute inset-0 z-0">
          <img
            src={assetUrl('/fractal/optimized/01.webp')}
            alt=""
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--qz-ink)]/40 via-[color:var(--qz-ink)]/70 to-[color:var(--qz-ink)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.p
            {...rise(0)}
            className="mb-6 text-xs font-semibold tracking-[0.3em] text-emerald-300"
          >
            وراء الصورة والحكاية
          </motion.p>

          <motion.h1
            {...rise(0.1)}
            className="text-5xl font-black leading-[1.3] text-white sm:text-7xl lg:text-8xl"
          >
            قاسم
          </motion.h1>

          <motion.p
            {...rise(0.2)}
            className="mx-auto mt-8 max-w-2xl text-lg leading-9 text-[color:var(--qz-sage)] sm:text-xl"
          >
            صانع محتوى عربي يبحث في تفاصيل الصورة، ويروي حكايات بالضوء والظل
            والكلمة. من المراجعات السينمائية إلى الوثائقيات — كل لقطة تحمل
            حكاية تستحق أن تُروى.
          </motion.p>

          <motion.div {...rise(0.3)} className="mt-10 flex justify-center gap-4">
            <Link
              to="/videos"
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-300 px-7 py-3.5 text-sm font-bold text-[color:var(--qz-x6)] transition hover:bg-emerald-200"
            >
              شاهد الأعمال
              <ArrowUpLeft className="size-4 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              to="/masaha/on-air"
              className="rounded-full border border-white/15 bg-white/[0.05] px-7 py-3.5 text-sm text-white transition hover:bg-white/[0.1]"
            >
              أون إير
            </Link>
          </motion.div>
        </div>

        {/* سهم سكرول */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-10 z-10 text-white/40"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ===== اقتباس ===== */}
      <section className="py-24 sm:py-32">
        <motion.div {...rise(0)} className="mx-auto max-w-3xl text-center">
          <div className="mb-6 text-5xl text-emerald-300/50">❝</div>
          <blockquote className="font-display text-2xl font-bold leading-[1.8] text-white sm:text-3xl">
            لا يهم من أين تبدأ، المهم كيف تتطور من هناك.
          </blockquote>
          <p className="mt-6 text-sm text-[color:var(--qz-sage)]">
            — قاسم
          </p>
        </motion.div>
      </section>

      {/* ===== معرض الصور ===== */}
      <section className="py-16">
        <motion.div {...rise(0)} className="mb-10">
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-emerald-300">
            من العدسة
          </p>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            لحظات مختارة
          </h2>
        </motion.div>

        <div className="grid auto-rows-[200px] grid-cols-2 gap-3 sm:grid-cols-3 sm:auto-rows-[240px] lg:grid-cols-4">
          {GALLERY.map((img, i) => (
            <motion.div
              key={img.alt}
              {...rise(i * 0.08)}
              className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] ${img.span}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-4 p-4 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-xs text-emerald-200">{img.caption}</p>
                <p className="mt-1 text-sm font-bold text-white">{img.alt}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== على الشاشة / خلف الكواليس ===== */}
      <section className="py-16">
        <div className="grid gap-5 md:grid-cols-2">
          <motion.div {...rise(0)}>
            <GlassCard className="liquid-glass-hover group relative overflow-hidden p-0">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg"
                  alt="على الشاشة"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--qz-ink)] via-[color:var(--qz-ink)]/50 to-transparent" />
              </div>
              <div className="relative p-8">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black tracking-tight text-emerald-300">على</span>
                </div>
                <h3 className="text-4xl font-black text-white">الشاشة</h3>
                <p className="mt-4 text-sm leading-7 text-[color:var(--qz-sage)]">
                  أحدث الأعمال، إحصاءات المشاهدات، وصور من الاستوديو.
                </p>
                <Link
                  to="/videos"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-200 transition hover:text-emerald-100"
                >
                  تصفح الفيديوهات
                  <ArrowUpLeft className="size-4" />
                </Link>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div {...rise(0.1)}>
            <GlassCard className="liquid-glass-hover group relative overflow-hidden p-0">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="https://i.ytimg.com/vi/ScMzIvxBSi4/hqdefault.jpg"
                  alt="خلف الكواليس"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--qz-ink)] via-[color:var(--qz-ink)]/50 to-transparent" />
              </div>
              <div className="relative p-8">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black tracking-tight text-emerald-300">خلف</span>
                </div>
                <h3 className="text-4xl font-black text-white">الكواليس</h3>
                <p className="mt-4 text-sm leading-7 text-[color:var(--qz-sage)]">
                  مقالات، حملات تصويرية، وكل ما يحدث بعيداً عن الكاميرا.
                </p>
                <Link
                  to="/articles"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-200 transition hover:text-emerald-100"
                >
                  اقرأ المقالات
                  <ArrowUpLeft className="size-4" />
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ===== المسيرة ===== */}
      <section className="py-16">
        <motion.div {...rise(0)} className="mb-12">
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-emerald-300">
            رحلة وتطور
          </p>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            المسيرة
          </h2>
        </motion.div>

        <div className="relative">
          {/* خط زمني */}
          <div className="absolute right-6 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-300/40 via-emerald-300/20 to-transparent sm:right-8" />

          <div className="space-y-12">
            {MILESTONES.map((m, i) => (
              <motion.div
                key={m.year}
                {...rise(i * 0.1)}
                className="relative flex gap-6 pr-14 sm:pr-20"
              >
                {/* نقطة على الخط */}
                <div className="absolute right-[18px] top-1 size-4 rounded-full border-2 border-emerald-300 bg-[color:var(--qz-ink)] sm:right-[26px]" />

                <div className="flex-1">
                  <span className="font-mono text-sm font-bold text-emerald-300">{m.year}</span>
                  <h3 className="mt-1 text-xl font-black text-white">{m.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--qz-sage)]">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== الروابط الاجتماعية ===== */}
      <section className="py-16">
        <motion.div {...rise(0)} className="text-center">
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-emerald-300">
            تابع قاسم
          </p>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            على المنصات
          </h2>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-full px-8 py-4 text-sm font-bold transition hover:scale-105 ${s.color}`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== CTA نهائي ===== */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-emerald-400/[0.07] via-white/[0.015] to-transparent py-20 text-center">
        <div className="pointer-events-none absolute -left-24 -top-10 size-80 rounded-full bg-emerald-400/[0.09] blur-[100px]" />
        <motion.div {...rise(0)} className="relative z-10">
          <p className="text-lg text-[color:var(--qz-sage)] sm:text-xl">
            دائماً نبحث في التفاصيل.
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[color:var(--qz-sage)]/70">
            للتعاون والاستفسارات التجارية
          </p>
          <a
            href="mailto:hello@qassimz.com"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.1]"
          >
            تواصل معي
            <ArrowUpLeft className="size-4" />
          </a>
        </motion.div>
      </section>
    </motion.div>
  )
}
