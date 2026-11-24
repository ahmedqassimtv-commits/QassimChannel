import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpLeft, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FoldingBill } from '../components/onair/FoldingBill.tsx'
import { CinemaThumb, useCinema } from '../components/qz/CinemaPlayer.jsx'
import { fmtDate } from '../components/qz/Kit.jsx'
import { videos } from '../data/videos.js'
import { YOUTUBE_CONFIG } from '../data/youtubeConfig.js'

/* ══ أون إير — بأسلوب Fable ══════════════════════════════════════════
   أشرطة ألوان بعرض الشاشة بدل الكروت والفواصل: أخضر الغابة ← ورق كريمي
   ← أزرق الحكايات ← كريمي ← فحمي. عناوين سيريف عريضة بسطور لازقة،
   أزرار كبسولة (60px) غامقة على الفاتح وبيضا على الملوّن، والغلاف نفسه
   هو العمل الفني من غير إطارات. */

const EASE = [0.22, 1, 0.36, 1]
const longs = videos.filter((v) => v.type !== 'short')
const shorts = videos.filter((v) => v.type === 'short')
const latest = longs[0] ?? videos[0]

function Reveal({ children, delay = 0, className, as = 'div' }) {
  const reduce = useReducedMotion()
  const M = motion[as]
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </M>
  )
}

function Pill({ tone = 'dark', children, ...rest }) {
  const Comp = rest.to ? Link : rest.href ? 'a' : 'button'
  return (
    <Comp className={`qz-fb-pill is-${tone}`} {...rest}>
      {children}
    </Comp>
  )
}

/* قصاصات هندسية مسطحة طايرة حوالين الرسمة (نجمة، دايرة، علامة +) */
function Confetti() {
  const reduce = useReducedMotion()
  const bits = [
    { k: 'star', c: '#f5c445', x: '8%', y: '14%', s: 34, d: 0 },
    { k: 'circle', c: '#f08a3c', x: '84%', y: '10%', s: 22, d: 0.6 },
    { k: 'plus', c: '#43a1d7', x: '90%', y: '62%', s: 26, d: 1.1 },
    { k: 'circle', c: '#f7f4ee', x: '4%', y: '72%', s: 14, d: 1.6 },
    { k: 'star', c: '#ef8fb0', x: '70%', y: '88%', s: 24, d: 0.3 },
    { k: 'plus', c: '#f5c445', x: '22%', y: '92%', s: 18, d: 0.9 },
  ]
  return (
    <div className="qz-fb-confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          style={{ left: b.x, top: b.y, width: b.s, height: b.s }}
          animate={reduce ? undefined : { y: [0, -10, 0], rotate: [0, b.k === 'plus' ? 45 : 18, 0] }}
          transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: b.d }}
        >
          {b.k === 'star' && <path d="M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.7l7.1-.6z" fill={b.c} />}
          {b.k === 'circle' && <circle cx="12" cy="12" r="10" fill={b.c} />}
          {b.k === 'plus' && <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" fill={b.c} />}
        </motion.svg>
      ))}
    </div>
  )
}

/* ١. شريط أخضر الغابة — الافتتاحية */
function Hero() {
  const cinema = useCinema()
  return (
    <section className="qz-fb-band is-forest qz-fb-hero" data-structured-surface="ink" aria-labelledby="onair-title">
      <div className="qz-fb-wrap qz-fb-split">
        <div className="qz-fb-copy">
          <Reveal as="p" className="qz-fb-eyebrow">
            <span className="qz-fb-live" aria-hidden="true" /> على الهوا دلوقتي
          </Reveal>
          <Reveal as="h1" delay={0.05} className="qz-fb-display" >
            <span id="onair-title">أون إير:</span>
            <br />
            كل جديد قاسم في مكان واحد
          </Reveal>
          <Reveal as="p" delay={0.12} className="qz-fb-lead">
            منشورات يومية، مقتطفات سريعة، وآخر الحلقات من القناة — مساحة متجددة بتتحدّث مع كل نشر.
          </Reveal>
          <Reveal delay={0.2} className="qz-fb-actions">
            <Pill tone="white" type="button" onClick={() => latest && cinema.open(latest)}>
              <Play className="size-4 fill-current" aria-hidden="true" />
              شوف آخر حلقة
            </Pill>
            <a className="qz-fb-ghost is-light" href={YOUTUBE_CONFIG.channelUrl} target="_blank" rel="noreferrer">
              القناة على يوتيوب
            </a>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="qz-fb-art">
          <Confetti />
          <div className="qz-fb-bill">
            <FoldingBill />
          </div>
          <span className="qz-fb-art-note">اسحب الورقة واطويها</span>
        </Reveal>
      </div>
    </section>
  )
}

/* ٢. صف الأغلفة — بعرض الشاشة وبيطلع برّه الحافة كأنه بيكمّل */
function CoverRow() {
  const cinema = useCinema()
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-6%', '6%'])
  const row = [...videos, ...videos].slice(0, 8)
  return (
    <section ref={ref} className="qz-fb-band is-cream qz-fb-covers" data-structured-surface="putty" aria-label="أغلفة الحلقات">
      <motion.div className="qz-fb-cover-row" style={{ x }}>
        {row.map((v, i) => (
          <button
            key={`${v.id}-${i}`}
            type="button"
            className={`qz-fb-cover ${v.type === 'short' ? 'is-short' : ''}`}
            onClick={() => cinema.open(v)}
            aria-label={`شغّل: ${v.title}`}
            data-qz-silent
          >
            <CinemaThumb video={v} scope={`fb-row-${i}`} className="qz-fb-cover-img" />
          </button>
        ))}
      </motion.div>
    </section>
  )
}

/* ٣. شريط كريمي — آخر ما اتنشر */
function Latest() {
  const cinema = useCinema()
  if (!latest) return null
  return (
    <section className="qz-fb-band is-cream" data-structured-surface="putty" aria-labelledby="fb-latest">
      <div className="qz-fb-wrap qz-fb-split is-reverse">
        <div className="qz-fb-copy">
          <Reveal as="p" className="qz-fb-eyebrow is-dark">من القناة · {fmtDate(latest.date)}</Reveal>
          <Reveal as="h2" delay={0.05} className="qz-fb-display is-ink" >
            <span id="fb-latest">{latest.title}</span>
          </Reveal>
          <Reveal as="p" delay={0.1} className="qz-fb-sub">{latest.summary}</Reveal>
          <Reveal delay={0.16} className="qz-fb-actions">
            <Pill tone="dark" type="button" onClick={() => cinema.open(latest)}>
              <Play className="size-4 fill-current" aria-hidden="true" />
              شغّل الحلقة
            </Pill>
            <Link className="qz-fb-ghost" to="/videos">
              كل الفيديوهات
            </Link>
          </Reveal>
        </div>
        <Reveal delay={0.08} className="qz-fb-feature">
          <button type="button" className="qz-fb-feature-card" onClick={() => cinema.open(latest)} data-qz-silent>
            <CinemaThumb video={latest} scope="fb-latest" className="qz-fb-feature-img" priority />
            <span className="qz-fb-play" aria-hidden="true">
              <Play className="size-6 fill-current" />
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  )
}

/* ٤. شريط أزرق الحكايات — الشورتس جوه موبايلات على كارت أبيض كبير */
function Shorts() {
  const cinema = useCinema()
  if (!shorts.length) return null
  return (
    <section className="qz-fb-band is-sky" data-structured-surface="putty" aria-labelledby="fb-shorts">
      <div className="qz-fb-wrap qz-fb-split">
        <div className="qz-fb-copy">
          <Reveal as="p" className="qz-fb-eyebrow is-dark">لقطات قصيرة</Reveal>
          <Reveal as="h2" delay={0.05} className="qz-fb-display is-ink">
            <span id="fb-shorts">دقيقة واحدة،</span>
            <br />
            حكاية كاملة
          </Reveal>
          <Reveal as="p" delay={0.1} className="qz-fb-sub">
            تفاصيل صغيرة من يوم طويل وكواليس التصوير — بالطول، زي ما الكاميرا شافتها.
          </Reveal>
          <Reveal delay={0.16} className="qz-fb-actions">
            <Pill tone="dark" type="button" onClick={() => cinema.open(shorts[0])}>
              <Play className="size-4 fill-current" aria-hidden="true" />
              ابدأ اللقطات
            </Pill>
          </Reveal>
        </div>
        <Reveal delay={0.08} className="qz-fb-elevated">
          <div className="qz-fb-phones">
            {shorts.slice(0, 2).map((v, i) => (
              <button
                key={v.id}
                type="button"
                className={`qz-fb-phone ${i === 1 ? 'is-back' : ''}`}
                onClick={() => cinema.open(v)}
                aria-label={`شغّل: ${v.title}`}
                data-qz-silent
              >
                <CinemaThumb video={v} scope={`fb-short-${i}`} className="qz-fb-phone-screen" />
                <span className="qz-fb-phone-cap">{v.title}</span>
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ٥. شريط كريمي — الأرشيف كروت كريمي */
function Archive() {
  const cinema = useCinema()
  return (
    <section className="qz-fb-band is-paper" data-structured-surface="putty" aria-labelledby="fb-archive">
      <div className="qz-fb-wrap">
        <Reveal as="h2" className="qz-fb-heading">
          <span id="fb-archive">من الأرشيف</span>
        </Reveal>
        <div className="qz-fb-cards">
          {videos.map((v, i) => (
            <Reveal key={v.id} delay={i * 0.06}>
              <button type="button" className="qz-fb-card" onClick={() => cinema.open(v)} data-qz-silent>
                <CinemaThumb
                  video={v}
                  scope={`fb-card-${i}`}
                  className={`qz-fb-card-img ${v.type === 'short' ? 'is-short' : ''}`}
                />
                <span className="qz-fb-card-meta">
                  {v.category} · <span className="qz-num">{fmtDate(v.date)}</span>
                </span>
                <span className="qz-fb-card-title">{v.title}</span>
                <span className="qz-fb-card-body">{v.summary}</span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ٦. الشريط الفحمي الختامي */
function Finale() {
  return (
    <section className="qz-fb-band is-char" data-structured-surface="ink" aria-label="تابع قاسمز">
      <div className="qz-fb-wrap qz-fb-finale">
        <Reveal as="h2" className="qz-fb-display">
          الحلقة الجاية
          <br />
          على الهوا قريب
        </Reveal>
        <Reveal delay={0.1} className="qz-fb-actions">
          <Pill tone="white" href={YOUTUBE_CONFIG.channelUrl} target="_blank" rel="noreferrer">
            اشترك في القناة
            <ArrowUpLeft className="size-4" aria-hidden="true" />
          </Pill>
        </Reveal>
      </div>
    </section>
  )
}

export default function OnAir() {
  return (
    <div className="qz-fb" dir="rtl">
      <Hero />
      <CoverRow />
      <Latest />
      <Shorts />
      <Archive />
      <Finale />
    </div>
  )
}
