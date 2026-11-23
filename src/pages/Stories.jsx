import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { ArrowDown, X } from 'lucide-react'
import { stories } from '../data/stories.js'
import { assetUrl } from '../utils/assets.js'
import ClothRibbon from '../components/stories/ClothRibbon.jsx'
import NileWater from '../components/stories/NileWater.jsx'

/* ══ قسم الحكايات — على إيقاع Structured (structured.money) ══════════════
   نفس تسلسل وتفاصيل فيديو المرجع، بمحتوى أرشيف الحكايات:
   ١ افتتاحية فاتحة: عنوان صغير + أرقام + زرار سداسي، وكلمة «الحكايات»
     ضخمة مقصوصة على الحواف، بتنزل أبطأ من الصفحة فبتغطس ورا شجر اللوحة.
   ٢ لوحة زيتية طويلة (الأهرامات › وادي النيل › المعابد › التمثال ›
     البحيرة) والصفحة بتنزل فيها، وكارت أسود ثابت في النص بيتفتح من خط
     رفيع، ونصه بيتبدل مع كل حكاية + شريط تقدّم.
   ٣ غرفة سودا: عنوان ٣ سطور + سطر صغير.
   ٤ حروف «أرشيف» عملاقة بتطلع من ورا الخطوط الهندسية، وقماشة حرير
     بتعدّي فوقها (WebGL)، وبعدها خلايا «صورة واحدة».
   ٥ شريط المدن › «الأرشيف مشروحاً» بـ٣ دواير وأزرار سداسية › كروت ظرف
     للحكايات (بتفتح القارئ) › خاتمة فاتحة.
   اللوحات أصلية (متولّدة) بأسلوب زيتي كلاسيكي — مش منسوخة من المرجع. */

const IMG = (name) => assetUrl(`/images/stories/structured/${name}`)
const PAINTING = {
  src: IMG('nile-painting-1600.webp'),
  srcSet: `${IMG('nile-painting-900.webp')} 900w, ${IMG('nile-painting-1600.webp')} 1600w`,
}
const TREE_L = { src: IMG('tree-left-800.webp'), srcSet: `${IMG('tree-left-420.webp')} 420w, ${IMG('tree-left-800.webp')} 800w` }
const TREE_R = { src: IMG('tree-right-800.webp'), srcSet: `${IMG('tree-right-420.webp')} 420w, ${IMG('tree-right-800.webp')} 800w` }

const EASE = [0.22, 1, 0.36, 1]
const years = stories.map((s) => Number(s.year)).filter(Boolean)
const SPAN = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : ''

// كلمات كاملة (العربي مايتقسمش حروف) — كل كلمة بتنكشف من اليمين للشمال
const GLYPH_WORDS = ['أرشيف', 'حكايات', 'المدن']

const VIGNETTES = [
  {
    title: 'ذاكرة المكان',
    img: IMG('vignette-ibis.webp'),
    alt: 'لوحة زيتية لطائر أبو منجل يمشي في المرج',
    more: 'المدن بتتغير، لكن الصورة بتحفظ إيقاعها: شارع قبل الزحمة، رصيف ميناء، ومقهى ماكانش لسه عرف السرعة.',
  },
  {
    title: 'مخطوطة الزمن',
    img: IMG('vignette-amphora.webp'),
    alt: 'لوحة زيتية لجرّة فخار مصرية منقوشة على العشب',
    more: 'كل حكاية هنا صورة ونص ميداني معاها، يتقروا مع بعض بتأنٍّ، زي البطاقات اللي جنب اللوحات في المتاحف.',
  },
  {
    title: 'حكايات حيّة',
    img: IMG('vignette-butterflies.webp'),
    alt: 'لوحة زيتية لفراشتين على زهور برية',
    more: 'لحظة واحدة بتلقطها العدسة، وبعد عقود بتبقى شهادة حيّة — من ضباب الشتا لأشرعة الفلوكة في النيل.',
  },
]

/* ── زرار أسود بأطراف سداسية ── */
function HexButton({ children, onClick, light = false }) {
  return (
    <button type="button" onClick={onClick} className={`qz-sx-hexbtn ${light ? 'is-light' : ''}`}>
      {children}
    </button>
  )
}

function scrollTo(el) {
  if (!el) return
  const lenis = window.__qzLenis
  if (lenis?.scrollTo) lenis.scrollTo(el, { duration: 1.4 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

/* ══ ١ + ٢: الافتتاحية ورحلة اللوحة ══════════════════════════════════ */

/* فراشة بجناحين بيرفرفوا (كل جناح صورة لوحده وبيلف في 3D) */
function Butterfly({ style, delay = 0, path = 'a' }) {
  return (
    <div className="qz-sx-bfly" style={style} aria-hidden="true">
      <div className={`qz-sx-bfly-path is-${path}`} style={{ animationDelay: `${delay}s` }}>
        <div className="qz-sx-bfly-body">
          <img className="qz-sx-bfly-w is-l" src={IMG('bfly-l.webp')} alt="" data-no-tint="true" />
          <img className="qz-sx-bfly-w is-r" src={IMG('bfly-r.webp')} alt="" data-no-tint="true" />
        </div>
      </div>
    </div>
  )
}

function HeroAndJourney() {
  const reduce = useReducedMotion()
  const heroRef = useRef(null)
  const journeyRef = useRef(null)
  const cardRef = useRef(null)
  const paintRef = useRef(null)
  const [step, setStep] = useState(0)

  // الكلمة بتنزل أبطأ من الصفحة، فاللوحة (اللي فوقها) بتطلع وتغطيها وتختفي
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const wordY = useTransform(heroP, [0, 1], reduce ? ['0vh', '0vh'] : ['0vh', '34vh'])

  // الشجر طبقة أمامية: طالع من تحت قدّام الكلمة، وبيطلع أسرع من اللوحة ويكبر
  const { scrollYProgress: treeP } = useScroll({ target: journeyRef, offset: ['start end', 'start start'] })
  const treeY = useTransform(treeP, [0, 1], reduce ? ['0vh', '0vh'] : ['0vh', '-105vh'])
  const treeScale = useTransform(treeP, [0, 1], reduce ? [1, 1] : [1, 1.35])
  const treeLX = useTransform(treeP, [0, 1], reduce ? ['-26%', '-26%'] : ['-26%', '-12%'])
  const treeRX = useTransform(treeP, [0, 1], reduce ? ['26%', '26%'] : ['26%', '12%'])

  // الكارت بيتفتح من خط رفيع أول ما يظهر، ونصه بيتبدل مع التقدّم في اللوحة
  const cardIn = useInView(cardRef, { once: true, margin: '-20% 0px -20% 0px' })
  const { scrollYProgress: journeyP } = useScroll({ target: journeyRef, offset: ['start start', 'end end'] })
  useMotionValueEvent(journeyP, 'change', (v) => {
    const next = Math.min(stories.length - 1, Math.max(0, Math.floor(((v - 0.1) / 0.8) * stories.length)))
    setStep((prev) => (prev === next ? prev : next))
  })
  const story = stories[step]

  return (
    <>
      <section ref={heroRef} className="qz-sx-hero" data-structured-surface="putty" aria-label="افتتاحية أرشيف الحكايات">
        <div className="qz-sx-hero-cluster">
          <motion.h1
            className="qz-sx-hero-title"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            حكاياتٌ حقيقية
            <br />
            <span className="is-soft">على</span> ورق الزمن
          </motion.h1>
          <motion.div
            className="qz-sx-stats"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <span>الحكايات: {stories.length}</span>
            <span className="qz-num">الحقبة: {SPAN}</span>
          </motion.div>
          <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.8 }}>
            <HexButton onClick={() => scrollTo(journeyRef.current)}>
              ادخل الأرشيف
              <ArrowDown className="size-3" aria-hidden="true" />
            </HexButton>
          </motion.div>
        </div>
        <motion.div className="qz-sx-wordmark" style={{ y: wordY }} aria-hidden="true">
          الحكايات
        </motion.div>
      </section>

      <section ref={journeyRef} className="qz-sx-journey" data-structured-surface="ink" aria-label="رحلة اللوحة عبر الحكايات">
        {/* الشجر الأمامي — برّه إطار اللوحة عشان يطلع فوق الكلمة */}
        <div className="qz-sx-trees" aria-hidden="true">
          <motion.img
            className="qz-sx-tree is-l"
            src={TREE_L.src}
            srcSet={TREE_L.srcSet}
            sizes="(max-width: 760px) 56vw, 46vw"
            alt=""
            data-no-tint="true"
            style={{ y: treeY, x: treeLX, scale: treeScale }}
          />
          <motion.img
            className="qz-sx-tree is-r"
            src={TREE_R.src}
            srcSet={TREE_R.srcSet}
            sizes="(max-width: 760px) 56vw, 46vw"
            alt=""
            data-no-tint="true"
            style={{ y: treeY, x: treeRX, scale: treeScale }}
          />
        </div>

        <div className="qz-sx-frame">
          <div className="qz-sx-pbox">
            <img
              ref={paintRef}
              className="qz-sx-painting"
              src={PAINTING.src}
              srcSet={PAINTING.srcSet}
              sizes="(max-width: 760px) 120svh, 100vw"
              alt="لوحة زيتية طويلة: أهرامات الجيزة بين السحاب، والنيل بفلوكته ونخيله، ومعابد بأعمدة البردي، وشلال، وتمثال كاتب فرعوني بين اللوتس والبردي"
              fetchPriority="high"
              data-no-tint="true"
            />
            <NileWater imgRef={paintRef} maskSrc={IMG('nile-water-mask.png')} range={[0.39, 0.985]} className="qz-sx-water" />

            <div className="qz-sx-sprite-lane is-ibis" aria-hidden="true">
              <img className="qz-sx-ibis" src={IMG('ibis.webp')} alt="" data-no-tint="true" />
            </div>
            <div className="qz-sx-sprite-lane is-felucca" aria-hidden="true">
              <img className="qz-sx-felucca" src={IMG('felucca.webp')} alt="" data-no-tint="true" />
            </div>
            <Butterfly style={{ left: '17%', top: '83%' }} path="a" />
            <Butterfly style={{ left: '74%', top: '89%' }} path="b" delay={-3.5} />
            <Butterfly style={{ left: '30%', top: '64%' }} path="c" delay={-6} />
          </div>
        </div>

        <div className="qz-sx-card-track">
          <div className="qz-sx-card-sticky">
            <motion.article
              ref={cardRef}
              className="qz-sx-card"
              data-structured-surface="ink"
              initial={reduce ? false : { clipPath: 'inset(0% 49.4% 0% 49.4% round 9px)' }}
              animate={cardIn ? { clipPath: 'inset(0% 0% 0% 0% round 9px)' } : undefined}
              transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
              aria-live="polite"
            >
              <span className="qz-sx-card-rail" style={{ right: 14 }} aria-hidden="true" />
              <span className="qz-sx-card-rail" style={{ left: 14 }} aria-hidden="true" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={story.id}
                  className="flex min-h-0 flex-1 flex-col"
                  initial={reduce ? false : { opacity: 0, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={reduce ? undefined : { opacity: 0, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <h2 className="qz-sx-card-title">{story.title}</h2>
                  <p className="qz-sx-card-body">{story.caption}</p>
                </motion.div>
              </AnimatePresence>
              <div className="qz-sx-card-foot">
                <span className="qz-sx-latin">SCROLL</span>
                <span className="qz-sx-progress" aria-label={`الحكاية ${step + 1} من ${stories.length}`}>
                  {stories.map((s, i) => (
                    <i key={s.id} data-on={i === step ? 'true' : undefined} />
                  ))}
                </span>
                <span className="qz-num ms-auto">
                  {story.year} · {story.location}
                </span>
              </div>
            </motion.article>
          </div>
        </div>
      </section>
    </>
  )
}

/* ── الخطوط الهندسية (بيت/خيمة بعُقد معيّنة) ── */
function GeoFrame() {
  const nodes = [
    [90, 300],
    [720, 40],
    [1350, 300],
    [90, 1180],
    [1350, 1180],
    [720, 1030],
    [470, 1180],
    [970, 1180],
    [0, 560],
    [1440, 560],
  ]
  return (
    <svg className="qz-sx-geo" viewBox="0 0 1440 1400" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <path d="M90 300 L720 40 L1350 300" />
      <path d="M0 300 H1440 M0 1180 H1440" />
      <path d="M90 300 V1180 M1350 300 V1180" />
      <path d="M720 1030 V1400" />
      <path d="M470 1180 L720 1030 L970 1180" />
      <path d="M0 470 L90 560 L0 650 M1440 470 L1350 560 L1440 650" />
      <path d="M90 940 L190 1180 M1350 940 L1250 1180" />
      {nodes.map(([x, y]) => (
        <rect key={`${x}-${y}`} className="node" x={x - 5} y={y - 5} width="10" height="10" transform={`rotate(45 ${x} ${y})`} />
      ))}
    </svg>
  )
}

function GlyphRow({ word, progress, from, to }) {
  const reduce = useReducedMotion()
  const y = useTransform(progress, [from, to], reduce ? ['0%', '0%'] : ['60%', '0%'])
  // الكشف بيمشي مع اتجاه القراءة (من اليمين)، والكلمة نفسها فاضلة موصولة
  const clip = useTransform(progress, [from, to], reduce ? ['inset(0 0 0 0%)', 'inset(0 0 0 0%)'] : ['inset(-10% 0% -10% 100%)', 'inset(-10% 0% -10% 0%)'])
  return (
    <div className="qz-sx-glyph-row">
      <motion.span style={{ y, clipPath: clip }}>{word}</motion.span>
    </div>
  )
}

/* ══ ٣ + ٤: الغرفة السودا وبرج الحروف ═════════════════════════════════ */
function InkRooms() {
  const towerRef = useRef(null)
  const clothProgress = useRef(0)
  const { scrollYProgress } = useScroll({ target: towerRef, offset: ['start end', 'end start'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    clothProgress.current = v
  })

  return (
    <div className="qz-sx-ink" data-structured-surface="ink">
      <section className="qz-sx-statement" aria-label="الأرشيف">
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-15%' }} transition={{ duration: 1, ease: EASE }}>
          ذاكرةٌ حيّة،
          <span className="is-soft">تُحفظ بالضوء</span>
          وتُروى
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.8 }}>
          أرشيف قاسمز بيجمع صور نادرة من مدن عربية، وكل صورة معاها حكايتها الميدانية — من الثلاثينيات للسبعينيات.
        </motion.p>
      </section>

      <section ref={towerRef} className="qz-sx-tower" aria-label="أرشيف">
        <GeoFrame />
        <div className="qz-sx-glyphs" aria-hidden="true">
          {GLYPH_WORDS.map((w, i) => (
            <GlyphRow key={w} word={w} progress={scrollYProgress} from={0.1 + i * 0.09} to={0.24 + i * 0.09} />
          ))}
        </div>
        <span className="sr-only">أرشيف حكايات المدن</span>
        <ClothRibbon progressRef={clothProgress} className="qz-sx-cloth" />

        <div className="qz-sx-cells">
          <motion.div className="qz-sx-cell" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-20%' }} transition={{ duration: 0.9 }}>
            <h3>
              صورة واحدة،
              <br />
              حكايات لا تنتهي
            </h3>
          </motion.div>
          <motion.div className="qz-sx-cell" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-20%' }} transition={{ delay: 0.15, duration: 0.9 }}>
            <p>الحكاية أكبر من أي لقطة لوحدها. كل صورة في الأرشيف بتفتح باب لمدينة وزمن وناس، والحكايات بتكمّل بعض في مكان واحد.</p>
          </motion.div>
        </div>
      </section>

      <section className="qz-sx-trusted" aria-label="مدن الأرشيف">
        <p className="qz-sx-micro qz-sx-latin" style={{ color: 'rgb(255 255 255 / 0.7)' }}>
          من أرشيف المدن
        </p>
        <div className="qz-sx-trusted-row">
          {stories.map((s) => (
            <span key={s.id}>{s.city}</span>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ══ ٥: مشروحاً + الظروف ══════════════════════════════════════════════ */
function HexPlus({ open, onClick, label }) {
  return (
    <button type="button" className="qz-sx-hexplus" aria-expanded={open} aria-label={label} onClick={onClick}>
      <svg width="38" height="22" viewBox="0 0 38 22" fill="none" aria-hidden="true">
        <path d="M10 1 H28 L37 11 L28 21 H10 L1 11 Z" stroke="currentColor" strokeWidth="1" />
        <path d="M19 7.5 V14.5 M15.5 11 H22.5" stroke="currentColor" strokeWidth="1" />
      </svg>
    </button>
  )
}

function Explained() {
  const [open, setOpen] = useState(-1)
  return (
    <section className="qz-sx-explained" aria-label="الأرشيف مشروحاً">
      <span className="qz-sx-corner qz-sx-latin" style={{ right: 24 }}>
        مدخل إلى الأرشيف
      </span>
      <span className="qz-sx-corner qz-sx-latin" style={{ left: 24 }}>
        ثلاث عدسات
      </span>
      <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE }}>
        الأرشيف
        <br />
        مشروحاً
      </motion.h2>
      <div className="qz-sx-vignettes">
        {VIGNETTES.map((v, i) => (
          <motion.div
            key={v.title}
            className="qz-sx-vignette"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
          >
            <h3>{v.title}</h3>
            <div className="qz-sx-circle">
              <img src={v.img} alt={v.alt} loading="lazy" data-no-tint="true" />
            </div>
            <HexPlus open={open === i} label={`اعرف أكتر عن ${v.title}`} onClick={() => setOpen((o) => (o === i ? -1 : i))} />
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.p
                  className="qz-sx-vignette-more"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 18 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {v.more}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

const FLAP_NODES = [
  [26.5, 31.7],
  [73.5, 31.7],
  [50, 58.3],
  [4, 31.7],
  [96, 31.7],
  [39.3, 46.7],
  [60.7, 46.7],
]

function EnvelopeFlap() {
  return (
    <div className="qz-sx-envelope-flap" aria-hidden="true">
      <svg viewBox="0 0 300 120" preserveAspectRatio="none">
        <path d="M0 2 L150 70 L300 2" />
        <path d="M0 38 H300" />
        <path d="M0 22 L12 38 L0 54 M300 22 L288 38 L300 54" />
      </svg>
      {FLAP_NODES.map(([x, y]) => (
        <i key={`${x}-${y}`} style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
    </div>
  )
}

function Cases({ onOpen }) {
  return (
    <section className="qz-sx-cases" aria-label="اقرأ الحكايات">
      <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        اقرأ الحكايات
      </motion.h2>
      <div className="qz-sx-envelopes">
        {stories.map((s, i) => (
          <motion.button
            key={s.id}
            type="button"
            className="qz-sx-envelope"
            onClick={() => onOpen(i)}
            initial={{ opacity: 0, y: 120 }}
            whileInView={{ opacity: 1, y: i * 10 }}
            viewport={{ once: true, margin: '-8%' }}
            transition={{ duration: 1, ease: EASE, delay: i * 0.12 }}
          >
            <EnvelopeFlap />
            <span className="qz-sx-micro qz-num" style={{ color: 'rgb(255 255 255 / 0.55)' }}>
              {s.year} · {s.location}
            </span>
            <h3 className="mt-3">{s.title}</h3>
            <p>{s.caption}</p>
          </motion.button>
        ))}
      </div>
    </section>
  )
}

/* ── قارئ الحكاية ── */
function Reader({ index, onClose, onMove }) {
  const s = stories[index]
  const closeRef = useRef(null)
  useEffect(() => {
    const lenis = window.__qzLenis
    lenis?.stop?.()
    document.documentElement.style.overflow = 'hidden'
    const prev = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onMove(1)
      if (e.key === 'ArrowRight') onMove(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start?.()
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose, onMove])

  return createPortal(
    <div dir="rtl" className="qz-sx">
      <motion.div className="qz-sx-reader-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={s.title}
        className="qz-sx-reader"
        data-lenis-prevent
        initial={{ opacity: 0, y: 40, clipPath: 'inset(8% 8% 8% 8% round 9px)' }}
        animate={{ opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 9px)' }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <div className="qz-sx-reader-close">
          <HexButton onClick={onClose}>
            <X className="size-3.5" aria-hidden="true" /> إغلاق
          </HexButton>
        </div>
        <div className="qz-sx-reader-inner">
          <div className="qz-sx-reader-media">
            <img className="qz-sx-reader-img" src={s.image} alt={s.title} />
            <p className="qz-sx-micro mt-3" style={{ color: 'var(--sx-graphite)' }}>
              {s.note}
            </p>
          </div>
          <div>
            <p className="qz-sx-micro qz-num" style={{ color: 'var(--sx-graphite)' }}>
              {s.year} · {s.era} · {s.location}
            </p>
            <h2 className="mt-4">{s.title}</h2>
            <p className="mt-6 text-lg leading-9" style={{ color: 'var(--sx-graphite)' }}>
              {s.caption}
            </p>
            <div className="qz-sx-reader-text mt-8 space-y-6">
              <p>{s.story}</p>
              {s.continued && <p>{s.continued}</p>}
            </div>
            <div className="mt-12 flex items-center justify-between gap-4 border-t border-[color:var(--sx-vellum)] pt-6">
              <HexButton onClick={() => onMove(-1)}>الحكاية السابقة</HexButton>
              <span className="qz-num text-sm" style={{ color: 'var(--sx-graphite)' }}>
                {index + 1} / {stories.length}
              </span>
              <HexButton onClick={() => onMove(1)}>الحكاية التالية</HexButton>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}

export default function Stories() {
  const [reader, setReader] = useState(null)
  const close = useRef(() => setReader(null)).current
  const move = useRef((d) => setReader((i) => (i === null ? i : (i + d + stories.length) % stories.length))).current

  return (
    <div className="qz-sx" dir="rtl">
      <HeroAndJourney />
      <InkRooms />
      <div className="qz-sx-ink" data-structured-surface="ink">
        <Explained />
        <Cases onOpen={setReader} />
        <div className="h-16" />
      </div>
      <section className="qz-sx-finale" data-structured-surface="chalk" aria-label="خاتمة">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE }}>
          <span className="is-soft">حكايات</span> حقيقية،
          <br />
          تستحق أن تُروى
        </motion.h2>
      </section>
      <AnimatePresence>{reader !== null && <Reader key="reader" index={reader} onClose={close} onMove={move} />}</AnimatePresence>
    </div>
  )
}
