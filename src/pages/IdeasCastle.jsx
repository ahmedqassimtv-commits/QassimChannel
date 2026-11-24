import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BrandLogo from '../components/brand/BrandLogo.jsx'
import { playGlassTap } from '../utils/glassSound.js'

/* ══ قاع الأفكار — Superr Full-Page Notebook Experience ═════════════════
   صفحة كاملة بأرضية الورق الكريمي (#faf7f2) بدون قص أو برواز خارجي،
   تطبّق جميع قواعد وتوكنز Superr — Style Reference المرفقة:
   - Canvas: #faf7f2 (Cream Paper) ممتد بعرض وطول الصفحة بالكامل
   - Headlines: 104px weight 600 Cocoa Ink (#33251a), line-height 1.08, محاذاة لبداية السطر
   - Handwritten Captions: 20-24px Marker Orange (#c86d3b) مع أسهم منحنية 1.5px بلون الحبر الفحمي (#2b2723)
   - Pill Action Buttons: 20px radius, 1.5px Charcoal (#2b2723) border, cream fill (#faf7f2) في كل الحالات
   - Product Notebooks: دفاتر مائلة 5–8 درجات (جلد بني، أزرق بسحب بيضاء، وردي) مع استيكر الاسم المصفّح
   - Sticker Illustrations: استيكرات مسطّحة بحدود 2px داكنة مائلة بزاوية 5–15 درجة بدون ظلال
   - Footer Brand Band: شريط برتقالي (#c86d3b) بعرض الصفحة بالكامل وبحافة علوية 56px. */

const INITIAL_NOTEBOOKS = [
  {
    id: 'nb-hero-brown',
    rollNo: '01',
    studentName: 'أحمد قاسم',
    classLabel: 'فلسفة الصورة · مونتاج',
    category: 'تأملات سينمائية',
    title: 'لماذا نصدّق الكاميرا حين تكذب؟',
    handCaption: 'دفتر الجلد البني الكلاسيكي',
    tilt: '-6deg',
    coverStyle: 'brown-leather',
    pencilColor: '#c86d3b',
    pages: '١٢٠ صفحة مرقّمة · 100 GSM',
    summary:
      'مسودة أولى عن الخداع البصري في السينما الوثائقية: كيف تخلق زاوية العدسة وإيقاع القطع شعوراً بالحقيقة حتى لو كان المشهد مُعاد التمثيل بالكامل.',
    marginNotes: [
      'العدسة الواسعة ٢٤مم تقرّب المتفرج من الحدث لكنها تشوّه المسافة العاطفية.',
      'قاعدة الـ ٣ ثوانٍ: إذا استمرت اللقطة بعد انتهاء الجملة، يبدأ المشاهد في قراءة ما وراء الوجه.',
      'مراجعة افتتاحية فيلم Close-Up لعباس كيارستمي كمثال على التداخل بين الواقع والتمثيل.',
    ],
    sketchQuote:
      '«الحقيقة في السينما ليست ما حدث أمام الكاميرا، بل ما يبقى في ذهن المتفرج بعد إظلام الشاشة.»',
  },
  {
    id: 'nb-blue-parchi',
    rollNo: '02',
    studentName: 'أحمد قاسم',
    classLabel: 'وثائقيات · أرشيف المدن',
    category: 'بذور الحلقات',
    title: 'أطلس الأماكن التي نسيتها الخرائط',
    handCaption: 'دفتر السحاب الأزرق الكبير',
    tilt: '-5.5deg',
    coverStyle: 'blue-clouds',
    pencilColor: '#6b8fae',
    pages: '٩٦ صفحة مسطّرة · هوامش عريضة',
    summary:
      'دفتر ميداني يجمع حكايات المحطات المهجورة ودور السينما الصيفية في المدن العربية: كيف تتحول العمارة إلى شاهد صامت على تحوّلات الناس.',
    marginNotes: [
      'سينما ريو الصيفية: المقاعد الخشبية ما زالت تحمل أرقامها المعدنية منذ ١٩٦٨.',
      'تسجيل صوت الهواء داخل المباني الفارغة كطبقة موسيقية أساسية للحلقة بدل الموسيقى التصويرية.',
      'مقابلة مع آخر خطّاط أفيشات يدوية في وسط البلد.',
    ],
    sketchQuote: '«كل مبنى مهجور هو شريط سينمائي توقّف جهاز العرض عن تدويره.»',
  },
  {
    id: 'nb-cute-pink',
    rollNo: '03',
    studentName: 'أحمد قاسم',
    classLabel: 'الفِردِكت · تشريح مشهد',
    category: 'تأملات سينمائية',
    title: 'هندسة التوتر في المشهد الواحد',
    handCaption: 'مسودات وردية لطيفة',
    tilt: '6.5deg',
    coverStyle: 'rose-pink',
    pencilColor: '#c88a9e',
    pages: '٨٠ صفحة شبكية · رسم كادرات',
    summary:
      'تفكيك بصري للمشاهد الطويلة (Long Takes) التي تحبس الأنفاس دون قطرة دم واحدة: كيف يتصاعد الإيقاع عبر حركة الممثلين داخل الكادر الثابت.',
    marginNotes: [
      'المشهد الافتتاحي في Inglourious Basterds: الكاميرا تتحرك أقل من ٣ مرات خلال ١٨ دقيقة.',
      'توزيع الإضاءة بين الظل والضوء يعمل كمؤشر نفسي لمن يملك السيطرة في الحوار.',
      'الصمت قبل جملة الحُكم في الفِردِكت يضاعف أثر التقييم النهائي.',
    ],
    sketchQuote: '«التوتر لا يصنعه الانفجار، بل يصنعه علم المتفرج بوجود القنبلة تحت الطاولة.»',
  },
  {
    id: 'nb-sprout-green',
    rollNo: '04',
    studentName: 'أحمد قاسم',
    classLabel: 'هندسة صوتية · سيكولوجيا',
    category: 'بذور الحلقات',
    title: 'الصوت الخفي: كيف نسمع الصورة؟',
    handCaption: 'دفتر التجارب الصوتية',
    tilt: '-5deg',
    coverStyle: 'sprout-green',
    pencilColor: '#628b6f',
    pages: '٧٢ صفحة مسطّرة · ورق كريمي',
    summary:
      'بحث في تصميم الصوت السينمائي (Foley & Room Tone): كيف تغيّر ترددات الخلفية المنخفضة تفسيرنا لنفس اللقطة البصرية تماماً.',
    marginNotes: [
      'تجربة عملية: عرض نفس اللقطة بثلاث طبقات صوتية مختلفة (مطر، ساعة حائط، صمت مطلق).',
      'صوت تقليب الورق في أرشيف الحكايات يمنح شعوراً ملموساً بالزمن.',
      'تجهيز مقارنة سمعية بصرية مباشرة داخل الحلقة القادمة.',
    ],
    sketchQuote: '«العين ترى الإطار، لكن الأذن هي التي تقرر حجم الغرفة.»',
  },
  {
    id: 'nb-cocoa-drafts',
    rollNo: '05',
    studentName: 'أحمد قاسم',
    classLabel: 'أرشيف شخصي · قيد البحث',
    category: 'مسودات لم تكتمل',
    title: 'حكايات لم تجد نهايتها بعد',
    handCaption: 'قصاصات وأسئلة مفتوحة',
    tilt: '5.5deg',
    coverStyle: 'brown-leather',
    pencilColor: '#a6562b',
    pages: '٦٤ صفحة مرقّمة · أرشيف حي',
    summary:
      'قصاصات وأسئلة مفتوحة من كتب ومراسلات قديمة لم تتحول بعد إلى فيديو كامل، لكنها تشكّل الخلفية الفكرية للحلقات القادمة.',
    marginNotes: [
      'قصة المصوّر الذي التقط ١٠ آلاف صورة لشارع واحد على مدار ٤٠ عاماً.',
      'هل يمكن صناعة حلقة كاملة تعتمد فقط على قراءة رسائل صوتية قديمة؟',
      'ربط أرشيف الحكايات بمكتبة الكتب بحيث يحيل كل كتاب إلى حكاية مصوّرة.',
    ],
    sketchQuote:
      '«بعض الأفكار تحتاج أن تختمر في الدفتر شهوراً قبل أن تستحق دقيقة واحدة على الشاشة.»',
  },
]

const CATEGORIES = ['كل الدفاتر', 'بذور الحلقات', 'تأملات سينمائية', 'مسودات لم تكتمل']

/* ── Top-left Brand Mark: Small illustrated hand/pointing icon (~32px) in Charcoal ── */
function HandBrandMark() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className="text-[#2b2723]"
    >
      <path
        d="M14 17V7.5C14 6.12 15.12 5 16.5 5C17.88 5 19 6.12 19 7.5V15M19 13.5C19 12.12 20.12 11 21.5 11C22.88 11 24 12.12 24 13.5V16M24 15.5C24 14.12 25.12 13 26.5 13C27.88 13 29 14.12 29 15.5V22.5C29 27.75 24.75 32 19.5 32H16.5C12.5 32 9.5 29.5 8 26L5.5 20.5C4.9 19.2 5.5 17.7 6.8 17.2C8 16.7 9.4 17.3 10 18.5L11.5 21.5V17C11.5 15.62 12.62 14.5 14 14.5"
        stroke="#2b2723"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf7f2"
      />
    </svg>
  )
}

/* ── Marker Highlight: inline word in #c86d3b with rough hand-drawn 2.5px underline ── */
function MarkerHighlight({ children }) {
  return (
    <span className="qz-superr-highlight">
      {children}
      <svg viewBox="0 0 110 10" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M2 6.5 C 24 2.5, 46 8.5, 68 4.5 C 86 2.5, 98 7.5, 108 4.5"
          fill="none"
          stroke="#c86d3b"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

/* ── Hand-drawn Arrow: Thin 1.5px Charcoal (#2b2723) stroke curved arrow, no arrowhead fill ── */
function CharcoalCurvedArrow({ flip = false, className = '' }) {
  return (
    <svg
      width="56"
      height="42"
      viewBox="0 0 56 42"
      fill="none"
      className={className}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <path
        d="M6 7 C 22 3, 38 11, 46 34"
        stroke="#2b2723"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M38 30 C 42 33, 45 35, 47 36 C 48 32, 49 27, 51 23"
        stroke="#2b2723"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── Sticker Illustration: Flat 2D characters with 2px dark outlines, rotated 5-15° ── */
function Sticker({ type = 'bolt', size = 54, rotate = '10deg', className = '' }) {
  return (
    <span
      className={`qz-superr-sticker ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotate})` }}
      aria-hidden="true"
    >
      {type === 'bolt' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <path
            d="M31 6L11 31H27L23 50L45 24H29L31 6Z"
            fill="#6b8fae"
            stroke="#2b2723"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {type === 'bear' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <circle cx="15" cy="15" r="7" fill="#c88a9e" stroke="#2b2723" strokeWidth="2" />
          <circle cx="41" cy="15" r="7" fill="#c88a9e" stroke="#2b2723" strokeWidth="2" />
          <rect
            x="10"
            y="14"
            width="36"
            height="32"
            rx="16"
            fill="#c88a9e"
            stroke="#2b2723"
            strokeWidth="2"
          />
          <circle cx="22" cy="28" r="2.2" fill="#2b2723" />
          <circle cx="34" cy="28" r="2.2" fill="#2b2723" />
          <ellipse cx="28" cy="34" rx="5.5" ry="4" fill="#faf7f2" stroke="#2b2723" strokeWidth="1.8" />
          <circle cx="28" cy="33" r="1.6" fill="#2b2723" />
        </svg>
      )}
      {type === 'heart' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <path
            d="M28 47C28 47 8 34 8 19.5C8 12.5 13.5 8 19.5 8C23.5 8 26.5 10 28 13C29.5 10 32.5 8 36.5 8C42.5 8 48 12.5 48 19.5C48 34 28 47 28 47Z"
            fill="#c86d3b"
            stroke="#2b2723"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="22" cy="23" r="3.2" fill="#faf7f2" stroke="#2b2723" strokeWidth="1.8" />
          <circle cx="34" cy="23" r="3.2" fill="#faf7f2" stroke="#2b2723" strokeWidth="1.8" />
          <circle cx="22" cy="23" r="1.4" fill="#2b2723" />
          <circle cx="34" cy="23" r="1.4" fill="#2b2723" />
        </svg>
      )}
      {type === 'ghost' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <path
            d="M12 46V24C12 14.6 19.2 8 28 8C36.8 8 44 14.6 44 24V46L38.5 41.5L33 46L28 41.5L23 46L17.5 41.5L12 46Z"
            fill="#faf7f2"
            stroke="#2b2723"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="23" cy="24" r="2.4" fill="#2b2723" />
          <circle cx="33" cy="24" r="2.4" fill="#2b2723" />
        </svg>
      )}
      {type === 'sprout' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <path
            d="M28 46V24M28 28C28 19 19 15 13 19C13 26 20 30 28 28ZM28 24C28 15 37 12 43 16C43 23 36 26 28 24Z"
            fill="#628b6f"
            stroke="#2b2723"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

/* ── Name Label Sticker: White card, 1px Charcoal border, 8px radius, 3 fields ── */
function NameLabelSticker({ name, classLabel, rollNo }) {
  return (
    <div className="qz-superr-label" dir="rtl">
      <div className="qz-superr-label-row">
        <span className="qz-superr-label-key">الاسم / Name:</span>
        <span className="qz-superr-label-name">{name}</span>
      </div>
      <div className="qz-superr-label-row">
        <span className="qz-superr-label-key">القسم / Class:</span>
        <span className="qz-superr-label-meta">{classLabel}</span>
      </div>
      <div className="qz-superr-label-row">
        <span className="qz-superr-label-key">رقم الدفتر / Roll no.:</span>
        <span className="qz-superr-label-meta qz-latin">{rollNo}</span>
      </div>
    </div>
  )
}

/* ── غلاف الدفتر حسب النوع (جلد بني / أزرق هادئ / وردي / أخضر) ── */
function getCoverPalette(style) {
  switch (style) {
    case 'blue-clouds':
      return {
        backgroundColor: '#5e7f9d',
        backgroundImage:
          'linear-gradient(145deg, rgba(250, 247, 242, 0.1) 0%, transparent 55%, rgba(43, 39, 35, 0.12) 100%)',
        color: '#faf7f2',
      }
    case 'rose-pink':
      return {
        backgroundColor: '#c88a9e',
        backgroundImage:
          'linear-gradient(145deg, rgba(250, 247, 242, 0.18) 0%, transparent 60%)',
        color: '#2b2723',
      }
    case 'sprout-green':
      return {
        backgroundColor: '#628b6f',
        backgroundImage:
          'linear-gradient(145deg, rgba(250, 247, 242, 0.12) 0%, transparent 60%)',
        color: '#faf7f2',
      }
    case 'brown-leather':
    default:
      return {
        backgroundColor: '#6e4d37',
        backgroundImage:
          'linear-gradient(145deg, rgba(250, 247, 242, 0.08) 0%, transparent 55%, rgba(20, 14, 10, 0.16) 100%)',
        color: '#faf7f2',
      }
  }
}

function ProductNotebookCard({ notebook, onOpen }) {
  const cover = getCoverPalette(notebook.coverStyle)
  return (
    <div
      className="qz-superr-notebook"
      style={{
        ...cover,
        transform: `rotate(${notebook.tilt || '-6deg'})`,
      }}
      onClick={() => {
        playGlassTap()
        onOpen(notebook)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(notebook)
        }
      }}
      aria-label={`افتح دفتر ${notebook.title}`}
    >
      {/* قلم الألوان المرفق بجانب الدفتر */}
      <span
        className="qz-superr-pencil"
        style={{ backgroundColor: notebook.pencilColor || '#c86d3b' }}
        aria-hidden="true"
      />

      <div>
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-block rounded-[20px] border border-[#2b2723] bg-[#faf7f2] px-3 py-0.5 font-[family-name:var(--font-geist)] text-[13px] font-medium text-[#2b2723]"
          >
            {notebook.category}
          </span>
          {/* ختم لوجو قاسمز المحفور بدقة */}
          <span className="qz-superr-stamp" aria-hidden="true" title="ختم قاسمز">
            <BrandLogo variant="solid" className="h-3.5 w-auto" />
          </span>
        </div>

        <h3 className="mt-5 font-[family-name:var(--font-gelica)] text-[25px] font-semibold leading-[1.52]">
          {notebook.title}
        </h3>

        <p className="mt-3 font-[family-name:var(--font-body-ar)] text-[15px] leading-[1.82] opacity-90">
          {notebook.summary}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <NameLabelSticker
          name={notebook.studentName}
          classLabel={notebook.classLabel}
          rollNo={notebook.rollNo}
        />
        <div className="flex items-center justify-between font-[family-name:var(--font-geist)] text-[13px] font-medium opacity-90">
          <span>{notebook.pages}</span>
          <span className="underline underline-offset-4">افتح الدفتر ←</span>
        </div>
      </div>
    </div>
  )
}

export default function IdeasCastle() {
  const [notebooks, setNotebooks] = useState(INITIAL_NOTEBOOKS)
  const [activeCategory, setActiveCategory] = useState('كل الدفاتر')
  const [selectedBook, setSelectedBook] = useState(null)
  const [newIdeaOpen, setNewIdeaOpen] = useState(false)
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaCat, setIdeaCat] = useState('بذور الحلقات')
  const [ideaSummary, setIdeaSummary] = useState('')

  // إيقاف تمرير Lenis الخلفي أثناء فتح نافذة الدفتر ليعمل السكرول داخلها بسلاسة تامة
  useEffect(() => {
    const lenis = window.__qzLenis
    if (!selectedBook) return undefined
    lenis?.stop?.()
    return () => {
      lenis?.start?.()
    }
  }, [selectedBook])

  const heroBrown = notebooks[0]
  const blueBook = notebooks[1] || notebooks[0]
  const pinkBook = notebooks[2] || notebooks[0]

  const filtered = useMemo(() => {
    if (activeCategory === 'كل الدفاتر') return notebooks
    return notebooks.filter((n) => n.category === activeCategory)
  }, [notebooks, activeCategory])

  const handleAddNotebook = (e) => {
    e.preventDefault()
    if (!ideaTitle.trim()) return
    const nextNum = String(notebooks.length + 1).padStart(2, '0')
    const styles = ['blue-clouds', 'rose-pink', 'brown-leather', 'sprout-green']
    const created = {
      id: `nb-${nextNum}`,
      rollNo: nextNum,
      studentName: 'أحمد قاسم',
      classLabel: `${ideaCat} · مسودة جديدة`,
      category: ideaCat,
      title: ideaTitle.trim(),
      handCaption: 'ملاحظة مضافة بخط اليد!',
      tilt: notebooks.length % 2 === 0 ? '-5.5deg' : '5.5deg',
      coverStyle: styles[notebooks.length % styles.length],
      pencilColor: '#c86d3b',
      pages: '٦٤ صفحة مرقّمة · 100 GSM',
      summary:
        ideaSummary.trim() ||
        'فكرة جديدة في قاع الأفكار، جاهزة للتحول إلى حلقة أو تجربة بصرية قادمة.',
      marginNotes: [
        'صياغة السؤال الأساسي للفكرة في جملة واحدة واضحة.',
        'تجميع المراجع البصرية والمشاهد المرتبطة بالموضوع.',
      ],
      sketchQuote: `«${ideaTitle.trim()} — كل حكاية تبدأ بسطر صادق في دفتر.»`,
    }
    setNotebooks((prev) => [created, ...prev])
    setIdeaTitle('')
    setIdeaSummary('')
    setNewIdeaOpen(false)
    setSelectedBook(created)
    playGlassTap()
  }

  return (
    <div className="qz-superr-page" dir="rtl">
      <div className="qz-superr-container">
        {/* ── Top Header Row: 32px hand icon on one side, Pill Action Button on the other ── */}
        <header className="qz-superr-header">
          <div className="flex items-center gap-3">
            <HandBrandMark />
            <span className="qz-superr-caption !text-[20px]">قاع الأفكار · superrbook</span>
          </div>

          <button
            type="button"
            className="qz-superr-btn"
            onClick={() => {
              playGlassTap()
              setNewIdeaOpen((v) => !v)
            }}
          >
            <span>{newIdeaOpen ? 'إغلاق المسودة' : 'دوّن فكرة جديدة!'}</span>
          </button>
        </header>

        {/* ── نموذج تدوين فكرة جديدة في دفتر ── */}
        <AnimatePresence>
          {newIdeaOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddNotebook}
              className="mt-6 overflow-hidden"
            >
              <div className="qz-superr-card">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="qz-superr-caption">افتح صفحة جديدة</span>
                    <h2 className="mt-1 text-[28px] font-semibold text-[#33251a]">
                      أضف دفتراً أو مسودة إلى قاع الأفكار
                    </h2>
                  </div>
                  <Sticker type="heart" size={44} rotate="-8deg" />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[16px] font-medium text-[#33251a]">
                      عنوان الدفتر أو الفكرة
                    </label>
                    <input
                      type="text"
                      required
                      value={ideaTitle}
                      onChange={(e) => setIdeaTitle(e.target.value)}
                      placeholder="مثال: كيف تصنع الإضاءة ذاكرة المشهد؟"
                      className="qz-superr-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[16px] font-medium text-[#33251a]">
                      القسم / التصنيف
                    </label>
                    <select
                      value={ideaCat}
                      onChange={(e) => setIdeaCat(e.target.value)}
                      className="qz-superr-input"
                    >
                      {CATEGORIES.filter((c) => c !== 'كل الدفاتر').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-[16px] font-medium text-[#33251a]">
                    تفاصيل المسودة أو الهوامش
                  </label>
                  <textarea
                    rows={3}
                    value={ideaSummary}
                    onChange={(e) => setIdeaSummary(e.target.value)}
                    placeholder="اكتب الشرارة الأولى أو الفكرة التي تريد حفظها في الدفتر..."
                    className="qz-superr-input"
                  />
                </div>

                <div className="mt-5 flex justify-end">
                  <button type="submit" className="qz-superr-btn">
                    <span>احفظ الدفتر في قاع الأفكار</span>
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── ١. الواجهة الافتتاحية (Asymmetric Two-Column Hero — Prompt 1) ── */}
        <section className="mt-10 grid items-center gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
          {/* العمود النصي: محاذاة لبداية السطر بدون توسيط بعد السطر الأول */}
          <div className="text-right">
            <h1 className="qz-superr-display">
              قاع الأفكار
              <br />
              ودفتر المسودات.
            </h1>

            <p className="qz-superr-caption mt-6">أهلاً بصنّاع الحكايات،</p>

            <p className="qz-superr-body mt-4 max-w-xl">
              هنا تجتمع الأفكار الخام قبل أن تتحول إلى حلقات ومراجعات — دفاتر مرقّمة في كل صفحة،
              هوامش واسعة للشخبطة وتفكيك الكادرات، ومسودات مكتوبة{' '}
              <MarkerHighlight>بجد!</MarkerHighlight> لكل من يفكر بالصورة والقلم.
            </p>

            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="qz-superr-btn"
                  onClick={() => {
                    playGlassTap()
                    setSelectedBook(heroBrown)
                  }}
                >
                  <span>افتح الدفتر الرئيسي!</span>
                </button>
                <button
                  type="button"
                  className="qz-superr-btn"
                  onClick={() => {
                    playGlassTap()
                    setNewIdeaOpen(true)
                  }}
                >
                  <span>أضف فكرتك الخاصة</span>
                </button>
              </div>
              <p className="qz-superr-preorder">
                الطبعة التفاعلية لعام ٢٠٢٦ · جميع الدفاتر مفتوحة للقراءة والتدوين.
              </p>
            </div>
          </div>

          {/* العمود البصري: الدفتر الجلدي البني المائل 5-8° مع استيكر البرق الأزرق والدب الوردي */}
          <div className="qz-superr-notebook-wrap relative py-6">
            <div className="mb-4 flex w-full max-w-[390px] items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Sticker type="bolt" size={50} rotate="-11deg" />
                <Sticker type="bear" size={52} rotate="9deg" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="qz-superr-caption" style={{ transform: 'rotate(-4deg)' }}>
                  {heroBrown.handCaption}
                </span>
                <CharcoalCurvedArrow />
              </div>
            </div>

            <ProductNotebookCard notebook={heroBrown} onOpen={setSelectedBook} />
          </div>
        </section>

        {/* ── ٢. صف عرض الدفاتر المزدوج (Product Showcase Row — Prompt 2) ── */}
        <section className="mt-[64px] pt-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
            {/* الدفتر الأزرق بالسحب البيضاء */}
            <div className="qz-superr-notebook-wrap">
              <div className="mb-3 flex items-center gap-2">
                <span className="qz-superr-caption" style={{ transform: 'rotate(-5deg)' }}>
                  {blueBook.handCaption}
                </span>
                <CharcoalCurvedArrow />
              </div>
              <ProductNotebookCard notebook={blueBook} onOpen={setSelectedBook} />
            </div>

            {/* اللحظة الطباعية المتوسطة بين الدفترين */}
            <div className="mx-auto max-w-xs py-6 text-center">
              <div className="mb-3 flex justify-center gap-3">
                <Sticker type="heart" size={46} rotate="-9deg" />
                <Sticker type="ghost" size={46} rotate="12deg" />
              </div>
              <span className="qz-superr-caption">مثل صناعة</span>
              <h2 className="mt-2 font-[family-name:var(--font-gelica)] text-[34px] font-medium leading-[1.52] text-[#33251a]">
                دفترنا الخاص.
                <br />
                بطريقتنا الخاصة.
              </h2>
              <p className="mt-4 font-[family-name:var(--font-body-ar)] text-[17px] leading-[1.85] text-[#33251a]/85">
                اضغط على أي دفتر لتقرأ الملاحظات المسطّرة على هوامشه.
              </p>
            </div>

            {/* الدفتر الوردي */}
            <div className="qz-superr-notebook-wrap">
              <div className="mb-3 flex items-center gap-2">
                <CharcoalCurvedArrow flip />
                <span className="qz-superr-caption" style={{ transform: 'rotate(4deg)' }}>
                  {pinkBook.handCaption}
                </span>
              </div>
              <ProductNotebookCard notebook={pinkBook} onOpen={setSelectedBook} />
            </div>
          </div>
        </section>

        {/* ── ٣. فكرة قسم قاع الأفكار ولماذا صُنع (Dew Drop #f2ece3 Cards) ── */}
        <section className="mt-[64px]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="qz-superr-caption">فكرة القسم</span>
              <h2 className="mt-2 font-[family-name:var(--font-gelica)] text-[clamp(30px,4vw,44px)] font-semibold leading-[1.48] text-[#33251a]">
                لماذا صُنع «قاع الأفكار»؟
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Sticker type="sprout" size={44} rotate="-8deg" />
              <Sticker type="bolt" size={44} rotate="11deg" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="qz-superr-card">
              <span className="qz-superr-caption !text-[19px]">٠١ · قبل أن تضيء الكاميرا</span>
              <h3 className="mt-3 font-[family-name:var(--font-gelica)] text-[24px] font-semibold leading-[1.52] text-[#33251a]">
                مختبر المسودات الأولى
              </h3>
              <p className="mt-4 font-[family-name:var(--font-body-ar)] text-[17px] leading-[1.85] text-[#33251a]/90">
                قاع الأفكار هو المطبخ الخلفي لقاسمز؛ هنا نجمع الشرارات الأولى والأسئلة التي تخطر في منتصف الليل أو بين سطور الكتب قبل أن تتحول إلى حلقات ومراجعات.
              </p>
            </div>

            <div className="qz-superr-card">
              <span className="qz-superr-caption !text-[19px]">٠٢ · التفكير بصوتٍ مسموع</span>
              <h3 className="mt-3 font-[family-name:var(--font-gelica)] text-[24px] font-semibold leading-[1.52] text-[#33251a]">
                كواليس صناعة الحكاية
              </h3>
              <p className="mt-4 font-[family-name:var(--font-body-ar)] text-[17px] leading-[1.85] text-[#33251a]/90">
                بدل أن ترى النتيجة النهائية فقط على يوتيوب، نشاركك هنا رحلة تطور الفكرة: الهوامش الجانبية، المراجع، والزوايا التي نختبرها حتى تنضج القصة.
              </p>
            </div>

            <div className="qz-superr-card">
              <span className="qz-superr-caption !text-[19px]">٠٣ · مساحة مفتوحة لك أيضاً</span>
              <h3 className="mt-3 font-[family-name:var(--font-gelica)] text-[24px] font-semibold leading-[1.52] text-[#33251a]">
                فكرتك قد تكون الحلقة القادمة
              </h3>
              <p className="mt-4 font-[family-name:var(--font-body-ar)] text-[17px] leading-[1.85] text-[#33251a]/90">
                القسم ليس مغلقاً علينا وحدنا؛ يمكنك فتح دفتر جديد وتدوين سؤال أو زاوية سينمائية ترى أنها تستحق التشريح لتبقى محفوظة في أرشيفنا.
              </p>
            </div>
          </div>
        </section>

        {/* ── ٤. أرشيف كل الدفاتر مع فلاتر الـ 20px Pill Tags ── */}
        <section className="mt-[64px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="qz-superr-caption">تصفّح الرف الكامل</span>
              <h2 className="mt-2 font-[family-name:var(--font-gelica)] text-[34px] font-semibold leading-[1.5] text-[#33251a]">
                جميع دفاتر قاع الأفكار ({filtered.length})
              </h2>
            </div>

            <div className="flex flex-wrap gap-3" role="tablist" aria-label="تصنيفات قاع الأفكار">
              {CATEGORIES.map((cat) => {
                const isAct = activeCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isAct}
                    data-active={isAct ? 'true' : undefined}
                    className="qz-superr-tag"
                    onClick={() => {
                      playGlassTap()
                      setActiveCategory(cat)
                    }}
                  >
                    <span>{cat}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((nb, idx) => (
              <div key={nb.id} className="qz-superr-notebook-wrap">
                <div className="mb-3 flex items-center gap-2">
                  <span className="qz-superr-caption !text-[20px]">{nb.handCaption}</span>
                  <CharcoalCurvedArrow flip={idx % 2 === 1} />
                </div>
                <ProductNotebookCard notebook={nb} onOpen={setSelectedBook} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── ٥. شريط الفوتر البرتقالي بعرض الصفحة بالكامل (Footer Brand Band — 56px top corners) ── */}
      <footer className="qz-superr-footer-band">
        <div className="qz-superr-container">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <Sticker type="bolt" size={44} rotate="-10deg" />
                <Sticker type="heart" size={44} rotate="8deg" />
                <Sticker type="ghost" size={44} rotate="-6deg" />
              </div>
              <h2 className="font-[family-name:var(--font-gelica)] text-[clamp(28px,4vw,42px)] font-semibold leading-[1.52] text-[#2b2723]">
                قاع الأفكار — المكان الذي تبدأ منه كل حكاية في قاسمز.
              </h2>
              <p className="mt-5 font-[family-name:var(--font-body-ar)] text-[18px] leading-[1.85] text-[#2b2723]/88">
                هل لديك فكرة حلقة أو زاوية سينمائية تستحق دفتراً جديداً؟ افتح مسودة ودوّنها الآن.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="qz-superr-btn"
                onClick={() => {
                  playGlassTap()
                  setNewIdeaOpen(true)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                <span>دوّن فكرة جديدة الآن!</span>
              </button>
              <Link to="/" className="qz-superr-btn">
                <span>العودة للرئيسية</span>
              </Link>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#2b2723]/25 pt-6 text-[16px] text-[#2b2723]">
            <span>قاسمز · قاع الأفكار (SuperrBook Edition)</span>
            <span>© {new Date().getFullYear()} جميع الحقوق محفوظة</span>
          </div>
        </div>
      </footer>

      {/* ── نافذة قراءة الدفتر المفتوح (مع دعم كامل للسكرول وتجاوز Lenis) ── */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={selectedBook.title}
            data-lenis-prevent
            className="qz-superr-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBook(null)}
          >
            <motion.div
              data-lenis-prevent
              className="qz-superr-modal-sheet"
              dir="rtl"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2b2723]/20 pb-5">
                <div>
                  <span className="qz-superr-caption !text-[19px]">
                    {selectedBook.handCaption} · رقم #{selectedBook.rollNo}
                  </span>
                  <h2 className="mt-2 font-[family-name:var(--font-gelica)] text-[32px] font-semibold leading-[1.5] text-[#33251a]">
                    {selectedBook.title}
                  </h2>
                </div>

                <button
                  type="button"
                  className="qz-superr-btn"
                  onClick={() => setSelectedBook(null)}
                >
                  <span>إغلاق الدفتر</span>
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <p className="qz-superr-body">{selectedBook.summary}</p>

                <div className="qz-superr-card">
                  <span className="qz-superr-caption !text-[19px]">اقتباس على الهامش</span>
                  <blockquote className="mt-3 font-[family-name:var(--font-body-ar)] text-[22px] font-medium leading-[1.75] text-[#33251a]">
                    {selectedBook.sketchQuote}
                  </blockquote>
                </div>

                <div>
                  <h3 className="font-[family-name:var(--font-gelica)] text-[22px] font-semibold leading-[1.55] text-[#33251a]">
                    الملاحظات المسطّرة داخل الدفتر:
                  </h3>
                  <ul className="mt-4 space-y-3.5">
                    {selectedBook.marginNotes.map((note, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 font-[family-name:var(--font-body-ar)] text-[17px] leading-[1.85] text-[#33251a]"
                      >
                        <span className="mt-1.5 inline-grid size-6 shrink-0 place-items-center rounded-full border border-[#2b2723] bg-[#f2ece3] font-[family-name:var(--font-geist)] text-[13px] font-semibold text-[#2b2723]">
                          {i + 1}
                        </span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <NameLabelSticker
                    name={selectedBook.studentName}
                    classLabel={selectedBook.classLabel}
                    rollNo={selectedBook.rollNo}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
