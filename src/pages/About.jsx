import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { ArrowUpLeft } from 'lucide-react'
import { assetUrl } from '../utils/assets.js'
import { YOUTUBE_CONFIG } from '../data/youtubeConfig.js'
import RollText from '../components/nav/RollText.jsx'

/* ══ عنّي ═════════════════════════════════════════════════════════════
   نفس ترتيب صفحة لاندو نوريس الرئيسية وحركاتها، بكود مكتوب من الأول
   ومحتوى قاسمز:
   1. الاسم ضخم بيطلع من فتحة بيضاوي (oval reveal) + أدوار بتتكشف بالـ highlight
   2. شريط كلمات بيتحرك
   3. جملة كبيرة والكلمات المهمة ملوّنة
   4. معرض أفقي بيتحرك مع السكرول (sticky) + اقتباس في النص
   5. قدام الكاميرا / ورا الكاميرا (مكان On Track / Off Track)
   6. المحطات (مكان معرض الخوذ) — صورة بتمشي مع الماوس
   7. المنصات
   التوقيتات زي لاندو: highlight ‎0.6s‏ + بلوك ‎0.6s‏ بعد ‎0.3s‏، والبيضاوي ‎1.5s‏. */

const EASE_OUT = [0.215, 0.61, 0.355, 1]
const EASE_IO = [0.645, 0.045, 0.355, 1]

const GALLERY = [
  {
    src: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
    alt: 'حكاية مدينة لا تنام',
    caption: 'تصوير وثائقي',
    year: '2019',
  },
  {
    src: 'https://i.ytimg.com/vi/ScMzIvxBSi4/maxresdefault.jpg',
    alt: 'كيف نحكي بالصورة؟',
    caption: 'حديث عن السينما',
    year: '2020',
  },
  {
    src: 'https://i.ytimg.com/vi/tFMo3UJ4B4g/maxresdefault.jpg',
    alt: 'مراجعة Arrival',
    caption: 'الفِردِكت',
    year: '2021',
  },
  {
    src: 'https://i.ytimg.com/vi/Way9Dexny3w/maxresdefault.jpg',
    alt: 'مراجعة Dune: Part Two',
    caption: 'ملحمة الكثيب',
    year: '2024',
  },
  {
    src: 'https://i.ytimg.com/vi/LXb3EKWsInQ/maxresdefault.jpg',
    alt: 'ضوء آخر النهار',
    caption: 'لقطة قصيرة',
    year: '2025',
  },
  {
    src: assetUrl('/fractal/optimized/08.webp'),
    alt: 'هوية بصرية',
    caption: 'هوية بصرية',
    year: '2026',
  },
]

const MILESTONES = [
  {
    year: '2019',
    title: 'البداية',
    desc: 'أول فيديو على يوتيوب — الشغف بالحكاية البصرية بيتحول لمحتوى.',
    img: 0,
  },
  {
    year: '2021',
    title: 'الفِردِكت',
    desc: 'إطلاق سلسلة الأحكام السينمائية — THE VERDICT.',
    img: 2,
  },
  {
    year: '2023',
    title: 'التوسّع',
    desc: 'مقالات، حكايات مصوّرة، وأرشيف بصري بيمتد عبر عقود.',
    img: 1,
  },
  {
    year: '2026',
    title: 'المنصة',
    desc: 'إعادة بناء المنصة بالكامل: مشهد حي، زجاج سائل، وهوية عربية أصيلة.',
    img: 5,
  },
]

const SOCIALS = [
  { label: 'يوتيوب', latin: 'YouTube', sub: '@AhmedQassimTV', href: YOUTUBE_CONFIG.channelUrl },
  { label: 'إنستجرام', latin: 'Instagram', sub: 'قريباً', href: null },
  { label: 'تيك توك', latin: 'TikTok', sub: 'قريباً', href: null },
]

const WORDS = ['بحكي', 'بصوّر', 'بكتب', 'بتفرج', 'بحلّل', 'بسأل']

/* الاسم/العنوان بيطلع من فتحة بيضاوي بتتفتح من تحت، والسطر بيطلع 40% */
function OvalTitle({ as: Tag = 'h1', children, className = '', delay = 0 }) {
  const reduce = useReducedMotion()
  if (reduce) return <Tag className={className}>{children}</Tag>
  return (
    <Tag className={className}>
      <motion.span
        className="qz-ab-oval"
        initial={{ clipPath: 'ellipse(20% 0% at 50% 100%)' }}
        whileInView={{ clipPath: 'ellipse(100% 120% at 50% 100%)' }}
        viewport={{ once: true, margin: '-8%' }}
        transition={{ duration: 1.5, delay, ease: EASE_IO }}
      >
        <motion.span
          className="block"
          initial={{ y: '40%' }}
          whileInView={{ y: '0%' }}
          viewport={{ once: true, margin: '-8%' }}
          transition={{ duration: 1.5, delay: delay + 0.15, ease: EASE_IO }}
        >
          {children}
        </motion.span>
      </motion.span>
    </Tag>
  )
}

/* highlight: النص بيتكشف من اليمين وبلوك بلون الثيم بيتسحب وراه */
function High({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion()
  if (reduce) return <span className={className}>{children}</span>
  return (
    <motion.span
      className={`qz-ab-high ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-8%' }}
    >
      <motion.span
        className="qz-ab-high-text"
        variants={{
          hidden: { clipPath: 'inset(0 0 0 100%)' },
          show: {
            clipPath: 'inset(0 0 0 0%)',
            transition: { duration: 0.6, delay, ease: EASE_OUT },
          },
        }}
      >
        {children}
      </motion.span>
      <motion.span
        className="qz-ab-high-block"
        aria-hidden="true"
        variants={{
          hidden: { scaleX: 1 },
          show: { scaleX: 0, transition: { duration: 0.6, delay: delay + 0.3, ease: EASE_IO } },
        }}
      />
    </motion.span>
  )
}

/* المعرض الأفقي: القسم طويل والمحتوى sticky، والشريط بيتحرك بالعرض مع السكرول */
function HorizontalTrack() {
  const reduce = useReducedMotion()
  const trackRef = useRef(null)
  const railRef = useRef(null)
  const [dist, setDist] = useState(0)

  useLayoutEffect(() => {
    const measure = () => {
      if (!railRef.current) return
      setDist(Math.max(0, railRef.current.scrollWidth - window.innerWidth))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  // RTL: الشريط بيبدأ من اليمين فبيتحرك ناحية اليمين (موجب)
  const x = useTransform(scrollYProgress, [0, 1], [0, dist])
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1])

  if (reduce) {
    return (
      <div ref={trackRef} className="qz-ab-bleed overflow-x-auto">
        <div ref={railRef} className="qz-ab-rail">
          <Shots />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={trackRef}
      className="qz-ab-bleed qz-ab-track"
      style={{ height: `calc(100svh + ${dist}px)` }}
    >
      <div className="qz-ab-sticky">
        <motion.div ref={railRef} className="qz-ab-rail" style={{ x }}>
          <Shots />
        </motion.div>
        <div className="qz-ab-progress" aria-hidden="true">
          <motion.i style={{ scaleX: progress }} />
        </div>
      </div>
    </div>
  )
}

function Shots() {
  return (
    <>
      {GALLERY.slice(0, 2).map((g, i) => (
        <Shot key={g.src} g={g} i={i} />
      ))}
      <p className="qz-ab-quote">
        <High>«مش مهم بتبدأ منين، المهم بتكبر إزاي من هناك.»</High>
      </p>
      {GALLERY.slice(2).map((g, i) => (
        <Shot key={g.src} g={g} i={i + 2} />
      ))}
    </>
  )
}

function Shot({ g, i }) {
  return (
    <figure className="qz-ab-shot" data-even={i % 2 ? 'true' : undefined}>
      <div className="qz-ab-shot-media">
        <img src={g.src} alt={g.alt} loading="lazy" />
      </div>
      <figcaption>
        <span>{g.caption}</span>
        <span className="qz-latin">{g.year}</span>
      </figcaption>
    </figure>
  )
}

/* صورة بتمشي ورا الماوس فوق صفوف المحطات (ديسكتوب بس) */
function useFloat() {
  const mx = useMotionValue(-400)
  const my = useMotionValue(-400)
  const x = useSpring(mx, { stiffness: 260, damping: 28, mass: 0.6 })
  const y = useSpring(my, { stiffness: 260, damping: 28, mass: 0.6 })
  const onMove = (e) => {
    mx.set(e.clientX - 130)
    my.set(e.clientY - 160)
  }
  return { x, y, onMove }
}

export default function About() {
  const [hovered, setHovered] = useState(null)
  const float = useFloat()

  return (
    <div className="qz-about">
      {/* 1 — الاسم */}
      <header className="qz-ab-hero">
        <p className="qz-eyebrow">
          <High>وراء الصورة والحكاية</High>
        </p>
        <OvalTitle className="qz-ab-name" delay={0.1}>
          أحمد قاسم
        </OvalTitle>
        <div className="qz-ab-roles">
          <span className="qz-ab-pill">
            <High delay={0.25}>صانع محتوى</High>
          </span>
          <span className="qz-ab-pill">
            <High delay={0.35}>مؤسس قاسمز</High>
          </span>
          <span className="qz-ab-pill qz-latin">
            <High delay={0.45}>THE VERDICT</High>
          </span>
        </div>
        <p className="qz-lead qz-ab-lead">
          <High delay={0.5}>
            صانع محتوى عربي بيدوّر في تفاصيل الصورة، وبيحكي بالضوء والظل والكلمة.
          </High>{' '}
          <High delay={0.65}>
            من الأحكام السينمائية للوثائقيات — كل لقطة وراها حكاية تستحق تتحكي.
          </High>
        </p>
        <div className="qz-ab-cta">
          <Link to="/videos" className="qz-btn qz-roll-host">
            <RollText>شوف الأعمال</RollText>
            <ArrowUpLeft className="size-4" aria-hidden="true" />
          </Link>
          <Link to="/masaha/on-air" className="qz-btn qz-btn-ghost qz-roll-host">
            <RollText>أون إير</RollText>
          </Link>
        </div>
      </header>

      {/* 2 — شريط الكلمات */}
      <div className="qz-ab-bleed qz-ab-marquee" aria-hidden="true">
        <div className="qz-ab-marquee-track">
          {[...WORDS, ...WORDS].map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
      </div>

      {/* 3 — الجملة الكبيرة */}
      <section className="qz-ab-manifesto">
        <OvalTitle as="p" className="qz-ab-big">
          بدوّر على <mark>الحكاية</mark> اللي ورا كل صورة، وبحوّلها لحاجة <mark>تتشاف</mark> وتفضل
          معاك.
        </OvalTitle>
      </section>

      {/* 4 — المعرض الأفقي */}
      <HorizontalTrack />

      {/* 5 — قدام الكاميرا / ورا الكاميرا */}
      <section className="qz-ab-bleed qz-ab-split">
        <Link to="/videos" className="qz-ab-split-card qz-roll-host">
          <span className="qz-latin qz-ab-split-eyebrow">On camera</span>
          <h3>
            <span className="qz-latin">ON CAM</span>
            <small>قدام الكاميرا</small>
          </h3>
          <p>الفيديوهات، الشورتس، وأحكام الفِردِكت — كل اللي بيتشاف.</p>
        </Link>
        <Link to="/articles" className="qz-ab-split-card qz-roll-host">
          <span className="qz-latin qz-ab-split-eyebrow">Behind the scenes</span>
          <h3>
            <span className="qz-latin">OFF CAM</span>
            <small>ورا الكاميرا</small>
          </h3>
          <p>الكتابة، التحضير، والمقالات — كل اللي بيتعمل قبل ما الكاميرا تشتغل.</p>
        </Link>
      </section>

      {/* 6 — المحطات */}
      <section className="qz-ab-hall" onPointerMove={float.onMove}>
        <div className="qz-ab-hall-head">
          <h2 className="qz-ab-h2">
            <High>المحطات</High>
          </h2>
          <p className="qz-body">
            <High delay={0.15}>من أول فيديو للمنصة — اللحظات اللي عملت قاسمز.</High>
          </p>
        </div>
        <ol className="qz-ab-rows">
          {MILESTONES.map((m, i) => (
            <li
              key={m.year}
              className="qz-ab-row qz-roll-host"
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              <span className="qz-ab-row-year qz-latin">{m.year}</span>
              <strong>
                <RollText>{m.title}</RollText>
              </strong>
              <span className="qz-ab-row-desc">{m.desc}</span>
            </li>
          ))}
        </ol>
        <motion.div
          className="qz-ab-float"
          style={{ x: float.x, y: float.y }}
          data-on={hovered !== null ? 'true' : undefined}
          aria-hidden="true"
        >
          {MILESTONES.map((m, i) => (
            <img
              key={m.year}
              src={GALLERY[m.img].src}
              alt=""
              data-show={hovered === i ? 'true' : undefined}
            />
          ))}
        </motion.div>
      </section>

      {/* 7 — المنصات */}
      <section className="qz-ab-social">
        <h2 className="qz-ab-h2">
          <High>تابعني في كل حتة.</High>
        </h2>
        <div className="qz-ab-social-grid">
          {SOCIALS.map((s) =>
            s.href ? (
              <a
                key={s.latin}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="qz-ab-social-pill qz-roll-host"
              >
                <RollText>{s.label}</RollText>
                <span className="qz-latin" dir="ltr">
                  {s.sub}
                </span>
              </a>
            ) : (
              <div key={s.latin} className="qz-ab-social-pill" data-soon="true">
                <span>{s.label}</span>
                <span>{s.sub}</span>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  )
}
