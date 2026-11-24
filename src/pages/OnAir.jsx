import { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { Play } from 'lucide-react'
import { CinemaThumb, useCinema } from '../components/qz/CinemaPlayer.jsx'
import { fmtDate } from '../components/qz/Kit.jsx'
import { assetUrl } from '../utils/assets.js'
import { videos } from '../data/videos.js'
import { YOUTUBE_CONFIG } from '../data/youtubeConfig.js'

/* ══ أون إير — نسخة ORYZO ═══════════════════════════════════════════
   غرفة تحميض: بكرة فيلم من الفلين هي البطل الوحيد. مسرح ثابت (sticky)
   والسكرول بيحرّكه على ٣ مشاهد زي الأصل:
   ١) صورة من فوق لمكتب المونتاج (مَت أخضر، أقلام، كاتر، نيجاتيف) + كلمة ضخمة
   ٢) المكتب بيختفي في ظلمة الجوز والبكرة بتلف في 3D بين عنوان ونص
   ٣) «مدعوم بالحكايات*» — البكرة بتصغر وتقعد على إيد طالعة من تحت،
      وإطار ألوان طيفية بيلمع حوالين الشاشة.
   خط واحد (Thmanyah Sans) بوزن 500، والنص الوصفي بس 400. */

const IMG = (n) => assetUrl(`/images/onair/${n}`)
const set = (name, a, b) => `${IMG(`${name}-${a}.webp`)} ${a}w, ${IMG(`${name}-${b}.webp`)} ${b}w`
const latest = videos.find((v) => v.type !== 'short') ?? videos[0]

function Stage() {
  const cinema = useCinema()
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useSpring(raw, { stiffness: 140, damping: 30, mass: 0.4 })

  // ١. المكتب
  const deskO = useTransform(p, [0, 0.14, 0.26], [1, 1, 0])
  const heroO = useTransform(p, [0, 0.08, 0.16], [1, 1, 0])
  const heroY = useTransform(p, [0, 0.16], ['0vh', '-6vh'])

  // ٢. البكرة: صور رندر حقيقية من زاويتين — بتلف بالسكرول وبتتبدّل بينهم
  const reelScale = useTransform(p, [0, 0.24, 0.62, 0.7], [0.74, 1, 1, 0.9])
  const rotZ = useTransform(p, [0, 0.66], [0, 150])
  const tiltO = useTransform(p, [0.34, 0.355, 0.52, 0.535], [0, 1, 1, 0])
  const frontO = useTransform(p, [0.34, 0.355, 0.52, 0.535, 0.66, 0.72], [1, 0, 0, 1, 1, 0])
  const rotY = useTransform(p, [0.26, 0.345, 0.43, 0.53, 0.62], [0, -28, 8, 26, 0])
  const rotX = useTransform(p, [0.26, 0.37, 0.5, 0.62], [0, 10, -8, 0])
  const reelY = useTransform(p, [0.62, 0.72], ['0vh', '-4vh'])
  const revealO = useTransform(p, [0.26, 0.34, 0.58, 0.66], [0, 1, 1, 0])
  const revealX = useTransform(p, [0.26, 0.34], ['3vw', '0vw'])

  // ٣. مدعوم بالحكايات
  const powerO = useTransform(p, [0.68, 0.76], [0, 1])
  const powerBlur = useTransform(p, [0.68, 0.78], ['blur(14px)', 'blur(0px)'])
  // الإيد طالعة ماسكة البكرة فعلاً — بتطلع لنفس مكان البكرة الطايرة اللي بتختفي
  const handY = useTransform(p, [0.64, 0.74], ['80vh', '0vh'])
  const glowO = useTransform(p, [0.86, 0.94], [0, 1])

  // الإيد بتميل مع الماوس (زي «Try to hover hand»)
  const mx = useMotionValue(0)
  const tilt = useSpring(mx, { stiffness: 120, damping: 14 })
  const handR = useTransform(tilt, [-1, 1], [-7, 7])
  const onMove = (e) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1)
  }

  return (
    <section ref={ref} className="qz-oz-track" aria-label="أون إير">
      <div className="qz-oz-stage" onPointerMove={onMove}>
        {/* المكتب */}
        <motion.img
          className="qz-oz-desk"
          src={IMG('desk-2560.webp')}
          srcSet={set('desk', 1536, 2560)}
          sizes="100vw"
          alt=""
          data-no-tint="true"
          fetchPriority="high"
          style={{ opacity: reduce ? 1 : deskO }}
        />
        <motion.div className="qz-oz-neon" style={{ opacity: glowO }} aria-hidden="true">
          <span className="qz-oz-neon-haze" />
          <span className="qz-oz-neon-line" />
        </motion.div>

        {/* ١. الافتتاحية */}
        <motion.div className="qz-oz-hero" style={{ opacity: heroO, y: heroY }}>
          <div className="qz-oz-lockup">
            <p className="qz-oz-tag">اتصوّر للشاشة، اتعمل للحكاية.</p>
            <h1 className="qz-oz-word">أون إير</h1>
          </div>
          <p className="qz-oz-hero-body">
            مساحة بتلمّ منشورات قاسم اليومية ومقتطفاته وآخر الحلقات — بتتحدّث كل ما حاجة جديدة تطلع على الهوا.
          </p>
          <div className="qz-oz-info">
            <p className="qz-oz-info-title">
              من إنتاج قاسمز،
              <br />
              حكايات حقيقية
              <br />
              بصوت مختلف.
            </p>
            <span className="qz-oz-dash" />
            <p className="qz-oz-info-foot">أكتر بكرة فيلم مالهاش لازمة في العالم.</p>
          </div>
          <button type="button" className="qz-oz-thumb" onClick={() => latest && cinema.open(latest)} data-qz-silent>
            <CinemaThumb video={latest} scope="oz-thumb" className="qz-oz-thumb-img" />
            <span className="qz-oz-thumb-word">أون إير</span>
            <Play className="qz-oz-thumb-play size-3 fill-current" aria-hidden="true" />
          </button>
          <p className="qz-oz-scroll">
            <span className="qz-oz-scroll-dot" /> كمّل لتحت
          </p>
        </motion.div>

        {/* ٢. الكشف */}
        <motion.h2 className="qz-oz-reveal-h" style={{ opacity: revealO, x: revealX }}>
          مش مجرد
          <br />
          بكرة فيلم.
        </motion.h2>
        <motion.p className="qz-oz-reveal-p" style={{ opacity: revealO }}>
          أون إير مش مجرد بكرة. دي نتيجة سنين من الحكايات والتصوير والمونتاج<sup>*</sup>.
        </motion.p>

        {/* ٣. مدعوم بالحكايات */}
        <motion.div className="qz-oz-power" style={{ opacity: powerO, filter: powerBlur }}>
          <h2 className="qz-oz-power-h">
            مدعوم بالحكايات<sup>*</sup>
          </h2>
          <span className="qz-oz-ember">قاسمز-١</span>
        </motion.div>
        <motion.p className="qz-oz-power-note" style={{ opacity: powerO }}>
          الحكاية بتكمّل الفراغات.
          <br />
          قلنا دقيقة، طلعت حلقة.
          <br />
          وطلعت حلوة.
        </motion.p>
        <motion.p className="qz-oz-hover-hint" style={{ opacity: powerO }} aria-hidden="true">
          <span>✋</span> جرّب تحرّك الإيد
        </motion.p>

        <motion.div className="qz-oz-hand" style={{ y: handY, rotate: handR }} aria-hidden="true">
          <img src={IMG('cork-hand-1600.webp')} srcSet={set('cork-hand', 700, 1600)} sizes="(max-width: 760px) 70vw, 46vh" alt="" data-no-tint="true" />
        </motion.div>

        <div className="qz-oz-reel-anchor" aria-hidden="true">
          <motion.div
            className="qz-oz-reel"
            style={reduce ? undefined : { scale: reelScale, y: reelY, rotateX: rotX, rotateY: rotY }}
          >
            <motion.img
              className="qz-oz-reel-img"
              src={IMG('cork-front-2048.webp')}
              srcSet={set('cork-front', 900, 2048)}
              sizes="(max-width: 760px) 86vw, 62vh"
              alt=""
              data-no-tint="true"
              style={reduce ? undefined : { opacity: frontO, rotate: rotZ }}
            />
            <motion.img
              className="qz-oz-reel-img"
              src={IMG('cork-tilt-2048.webp')}
              srcSet={set('cork-tilt', 900, 2048)}
              sizes="(max-width: 760px) 86vw, 62vh"
              alt=""
              data-no-tint="true"
              style={reduce ? { opacity: 0 } : { opacity: tiltO }}
            />
          </motion.div>
        </div>

        <p className="qz-oz-legal">* مونتاج يدوي</p>
        <p className="qz-oz-side" aria-hidden="true">
          أون إير · موديل ١
        </p>
      </div>
    </section>
  )
}

/* ٤. الحلقات — قايمة متقسمة بخطوط متقطعة */
function Episodes() {
  const cinema = useCinema()
  return (
    <section className="qz-oz-list" aria-labelledby="oz-eps">
      <div className="qz-oz-list-head">
        <h2 id="oz-eps" className="qz-oz-h">
          على الهوا
          <br />
          دلوقتي.
        </h2>
        <p className="qz-oz-body">كل حلقة ولقطة نزلت على القناة، بالترتيب — دوس على أي واحدة وتشتغل هنا.</p>
      </div>
      <ol className="qz-oz-rows">
        {videos.map((v, i) => (
          <li key={v.id}>
            <button type="button" className="qz-oz-row" onClick={() => cinema.open(v)} data-qz-silent>
              <span className="qz-oz-row-n qz-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="qz-oz-row-t">{v.title}</span>
              <span className="qz-oz-row-c">{v.category}</span>
              <span className="qz-oz-row-d qz-num">{fmtDate(v.date)}</span>
              <CinemaThumb video={v} scope={`oz-row-${i}`} className="qz-oz-row-img" />
            </button>
          </li>
        ))}
      </ol>
      <div className="qz-oz-cta">
        <a className="qz-oz-pill" href={YOUTUBE_CONFIG.channelUrl} target="_blank" rel="noreferrer">
          اشترك في القناة
        </a>
        <p className="qz-oz-credit">
          اتعمل بواسطة <span>قاسمز</span>
        </p>
      </div>
    </section>
  )
}

export default function OnAir() {
  return (
    <div className="qz-oz" dir="rtl">
      <Stage />
      <Episodes />
    </div>
  )
}
