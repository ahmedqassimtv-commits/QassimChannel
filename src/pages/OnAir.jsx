import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft, Bell, Play } from 'lucide-react'
import { CinemaThumb, useCinema } from '../components/qz/CinemaPlayer.jsx'
import { fmtDate } from '../components/qz/Kit.jsx'
import { assetUrl } from '../utils/assets.js'
import { videos } from '../data/videos.js'
import { YOUTUBE_CONFIG } from '../data/youtubeConfig.js'

/* ══ أون إير — نسخة Fable ═══════════════════════════════════════════
   نفس ترتيب الأصل: شريط أخضر الغابة فيه العنوان والشخصية، حيطة أغلفة
   بتجري في صفين، وبعدين أزرق واحد طويل شايل تلات مشاهد (كروت كريمي +
   موبايل + شخصية مرسومة)، صف «الأكثر مشاهدة»، وفوتر فحمي. */

const EASE = [0.22, 1, 0.36, 1]
const IMG = (n) => assetUrl(`/images/onair/${n}`)
const longs = videos.filter((v) => v.type !== 'short')
const shorts = videos.filter((v) => v.type === 'short')
const latest = longs[0] ?? videos[0]

function In({ children, className, delay = 0, y = 26, once = false, as = 'div' }) {
  const reduce = useReducedMotion()
  const M = motion[as]
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.3 }}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </M>
  )
}

function Stars({ items }) {
  const reduce = useReducedMotion()
  return (
    <div className="qz-fb-stars" aria-hidden="true">
      {items.map(([x, y, s, c, d], i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          style={{ left: x, top: y, width: s, height: s }}
          animate={reduce ? undefined : { scale: [1, 0.7, 1], rotate: [0, 20, 0] }}
          transition={{ duration: 3.2 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: d }}
        >
          <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" fill={c} />
        </motion.svg>
      ))}
    </div>
  )
}

/* ١. أخضر الغابة */
function Hero() {
  const cinema = useCinema()
  return (
    <section className="qz-fb-hero" aria-labelledby="onair-title">
      <div className="qz-fb-hero-in">
        <div className="qz-fb-hero-copy">
          <In as="h1" className="qz-fb-h1" once>
            <span id="onair-title">أون إير:</span> كل جديد
            <br />
            قاسم في مكان واحد
          </In>
          <In as="p" className="qz-fb-hero-lead" delay={0.08} once>
            انضم لناس بتحب الحكايات الحلوة — منشورات يومية، لقطات سريعة، وآخر حلقات القناة.
          </In>
          <In delay={0.14} once>
            <button type="button" className="qz-fb-pill is-white" onClick={() => latest && cinema.open(latest)}>
              شوف آخر حلقة
            </button>
          </In>
        </div>
        <In className="qz-fb-hero-art" delay={0.06} y={40} once>
          <Stars
            items={[
              ['8%', '20%', 22, '#f5c445', 0],
              ['86%', '8%', 18, '#f5c445', 0.8],
              ['92%', '44%', 14, '#f5c445', 1.4],
              ['2%', '58%', 12, '#f5c445', 0.4],
            ]}
          />
          <img src={IMG('hero-character.webp')} alt="رسمة: شاب قاعد فوق برج من بكر الأفلام والكتب وبيصوّر بموبايله" data-no-tint="true" />
        </In>
      </div>
      <CoverWall />
    </section>
  )
}

/* حيطة الأغلفة: صفّين لازقين بيجروا عكس بعض، الغلاف هو العمل الفني */
function WallRow({ list, dir }) {
  const cinema = useCinema()
  return (
    <div className={`qz-fb-wall-row is-${dir}`}>
      {[0, 1].map((dup) => (
        <div key={dup} className="qz-fb-wall-track" aria-hidden={dup === 1 ? 'true' : undefined}>
          {list.map((v, i) => (
            <button
              key={`${v.id}-${i}`}
              type="button"
              tabIndex={dup === 1 ? -1 : undefined}
              className={`qz-fb-wall-tile ${v.type === 'short' ? 'is-short' : ''}`}
              onClick={() => cinema.open(v)}
              aria-label={`شغّل: ${v.title}`}
              data-qz-silent
            >
              <CinemaThumb video={v} scope={`fbw-${dir}-${dup}-${i}`} className="qz-fb-wall-img" />
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

function CoverWall() {
  const base = [...videos, ...videos, ...videos]
  return (
    <div className="qz-fb-wall" aria-label="أغلفة الحلقات">
      <WallRow list={base} dir="a" />
      <WallRow list={[...base].reverse()} dir="b" />
    </div>
  )
}

/* موبايل أبيض بشاشة واجهة حقيقية */
function Phone({ children }) {
  return (
    <div className="qz-fb-phone">
      <div className="qz-fb-phone-bar">
        <span className="qz-num">9:41</span>
        <span className="qz-fb-phone-notch" />
        <span className="qz-fb-phone-dots" />
      </div>
      <div className="qz-fb-phone-body">{children}</div>
    </div>
  )
}

function ListScreen() {
  const cinema = useCinema()
  return (
    <>
      <p className="qz-fb-ui-title">شوف لاحقاً</p>
      <p className="qz-fb-ui-meta">{videos.length} حلقات · من القناة</p>
      <div className="qz-fb-ui-chips">
        <span className="is-on">الكل</span>
        <span>حلقات</span>
        <span>شورتس</span>
      </div>
      {videos.slice(0, 3).map((v, i) => (
        <button key={v.id} type="button" className="qz-fb-ui-row" onClick={() => cinema.open(v)} data-qz-silent>
          <CinemaThumb video={v} scope={`fbl-${i}`} className="qz-fb-ui-thumb" />
          <span>
            <b>{v.title}</b>
            <small>{v.summary}</small>
          </span>
        </button>
      ))}
    </>
  )
}

function ShortScreen() {
  const cinema = useCinema()
  const s = shorts[0] ?? videos[0]
  return (
    <button type="button" className="qz-fb-ui-short" onClick={() => cinema.open(s)} data-qz-silent>
      <CinemaThumb video={s} scope="fbs-0" className="qz-fb-ui-short-img" />
      <span className="qz-fb-ui-short-cap">
        <b>{s.title}</b>
        <small className="qz-num">{fmtDate(s.date)}</small>
      </span>
    </button>
  )
}

const FACES = ['#f08a3c', '#064c37', '#43a1d7', '#f5c445', '#292229']

function ChatScreen() {
  return (
    <div className="qz-fb-ui-chat">
      <p className="qz-fb-ui-title">غرف النقاش</p>
      {['الحلقة الأخيرة', 'كواليس التصوير', 'الحلقة الجاية', 'أسئلة لقاسم'].map((r, i) => (
        <div key={r} className="qz-fb-ui-room">
          <span>{r}</span>
          <span className="qz-fb-ui-faces" aria-hidden="true">
            {FACES.slice(0, 4 - (i % 2)).map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

/* مشهد على الأزرق: نص + شخصية + كارت كريمي كبير فيه موبايل + كارتين صغيرين */
function Scene({ id, title, lead, cta, onCta, character, charClass, bigLabel, screen, minis, reverse }) {
  return (
    <div className={`qz-fb-scene ${reverse ? 'is-reverse' : ''}`} aria-labelledby={id}>
      <In className="qz-fb-scene-copy">
        <h2 id={id} className="qz-fb-h2">
          {title}
        </h2>
        <p className="qz-fb-scene-lead">{lead}</p>
        <button type="button" className="qz-fb-pill is-dark is-sm" onClick={onCta}>
          {cta}
        </button>
      </In>
      <div className="qz-fb-scene-art">
        <In className={`qz-fb-scene-char ${charClass}`} y={40}>
          <img src={IMG(character)} alt="" data-no-tint="true" />
        </In>
        <In className="qz-fb-bigcard" y={60} delay={0.05}>
          <p className="qz-fb-card-label">{bigLabel}</p>
          <Phone>{screen}</Phone>
        </In>
        <div className="qz-fb-minis">
          {minis.map((m, i) => (
            <In key={m.key} className="qz-fb-mini" y={50} delay={0.12 + i * 0.08}>
              <p className="qz-fb-card-label">{m.label}</p>
              {m.body}
            </In>
          ))}
        </div>
      </div>
    </div>
  )
}

function SkyStory() {
  const cinema = useCinema()
  const open = (v) => () => v && cinema.open(v)
  return (
    <section className="qz-fb-sky" aria-label="جوه أون إير">
      <Stars items={[['3%', '1.2%', 26, '#ef8fb0', 0]]} />
      <Scene
        id="fb-s1"
        title={<>كل الحلقات<br />في مكان واحد</>}
        lead="قوايم مرتّبة، آخر ما اتنشر، وكل حلقة فاتتك — من غير ما تدوّر في ألف مكان."
        cta="ابدأ المشاهدة"
        onCta={open(latest)}
        character="char-star.webp"
        charClass="is-a"
        bigLabel={<>قوايم مشاهدة<br />أحلى</>}
        screen={<ListScreen />}
        minis={[
          {
            key: 'a',
            label: 'آخر حلقة',
            body: (
              <button type="button" className="qz-fb-mini-media" onClick={open(latest)} data-qz-silent>
                <CinemaThumb video={latest} scope="fbm-1" className="qz-fb-mini-img" />
              </button>
            ),
          },
          {
            key: 'b',
            label: 'تنبيه بالجديد',
            body: (
              <span className="qz-fb-mini-icon">
                <Bell className="size-6" aria-hidden="true" />
              </span>
            ),
          },
        ]}
      />
      <Scene
        id="fb-s2"
        reverse
        title={<>دقيقة واحدة،<br />حكاية كاملة</>}
        lead="لقطات قصيرة بالطول من الكواليس وتفاصيل اليوم — زي ما الكاميرا شافتها."
        cta="شوف اللقطات"
        onCta={open(shorts[0])}
        character="char-camera.webp"
        charClass="is-b"
        bigLabel={<>اكتشف لقطتك<br />المفضّلة</>}
        screen={<ShortScreen />}
        minis={[
          {
            key: 'a',
            label: 'لقطات الشهر',
            body: (
              <span className="qz-fb-mini-grid">
                {shorts.concat(longs).slice(0, 4).map((v, i) => (
                  <CinemaThumb key={v.id} video={v} scope={`fbg-${i}`} className="qz-fb-mini-cell" />
                ))}
              </span>
            ),
          },
          {
            key: 'b',
            label: 'الأكتر مشاهدة',
            body: (
              <span className="qz-fb-mini-ring" aria-hidden="true">
                <svg viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" />
                  <circle cx="22" cy="22" r="18" className="is-on" />
                </svg>
              </span>
            ),
          },
        ]}
      />
      <Scene
        id="fb-s3"
        title={<>مجتمع لعشاق<br />الحكايات</>}
        lead="اتكلم عن الحلقة مع ناس شبهك، واقترح الحكاية الجاية لقاسم."
        cta="انضم للنقاش"
        onCta={() => window.open(YOUTUBE_CONFIG.channelUrl, '_blank', 'noopener')}
        character="char-wave.webp"
        charClass="is-c"
        bigLabel={<>غرف نقاش<br />من غير حرق</>}
        screen={<ChatScreen />}
        minis={[
          {
            key: 'a',
            label: 'تعليقات عن الحلقات',
            body: <span className="qz-fb-mini-quote">«أول مرة أشوف المدينة بالعين دي»</span>,
          },
          {
            key: 'b',
            label: 'ناس بتحب اللي بتحبه',
            body: (
              <span className="qz-fb-ui-faces is-lg" aria-hidden="true">
                {FACES.map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </span>
            ),
          },
        ]}
      />

      <div className="qz-fb-popular">
        <In as="h3" className="qz-fb-popular-title">
          الأكثر مشاهدة <ArrowUpLeft className="size-4" aria-hidden="true" />
        </In>
        <div className="qz-fb-popular-row">
          {[...videos, ...videos].slice(0, 6).map((v, i) => (
            <In key={`${v.id}-${i}`} delay={i * 0.05} y={30}>
              <button type="button" className="qz-fb-pop" onClick={() => cinema.open(v)} data-qz-silent>
                <CinemaThumb video={v} scope={`fbp-${i}`} className="qz-fb-pop-img" />
                <b>{v.title}</b>
                <small>{v.category}</small>
              </button>
            </In>
          ))}
        </div>
      </div>
    </section>
  )
}

function Foot() {
  return (
    <section className="qz-fb-foot" aria-label="ختام أون إير">
      <span className="qz-fb-foot-mark" aria-hidden="true">
        <Play className="size-4 fill-current" />
      </span>
      <p className="qz-fb-foot-line">
        مكان أهدى للحكايات —
        <br />
        بيتحدّث مع كل حلقة جديدة
      </p>
    </section>
  )
}

export default function OnAir() {
  return (
    <div className="qz-fb" dir="rtl">
      <Hero />
      <SkyStory />
      <Foot />
    </div>
  )
}
