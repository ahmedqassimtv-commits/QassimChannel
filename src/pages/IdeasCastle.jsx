import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft, BookMarked, Lightbulb, PenTool, Plus, Sparkles, Tag, X } from 'lucide-react'
import { playGlassTap } from '../utils/glassSound.js'

/* ══ قلع الأفكار — Superr Tactile Notebook & Sketchbook (DESIGN 3) ═════
   مساحة دفاتر أحمد قاسم ومسودات الأفكار والتجارب البصرية قبل تحوّلها إلى حلقات:
   - بطاقات دفاتر مائلة (5–8 درجات) مع استيكر الاسم المصفّح (Name / Class / Roll no.)
   - تعليقات قلم الماركر البرتقالي (#ff6f1e) مع أسهم مرسومة باليد (SVG Curved Arrows)
   - استيكرات كرتونية مبعثرة بحدود حبر 2px داكنة (#171717)
   - إمكانية فتح أي دفتر وتصفّح هوامشه المسطّرة أو إضافة شرارة فكرة جديدة. */

const INITIAL_NOTEBOOKS = [
  {
    id: 'nb-01',
    rollNo: 'QF-01',
    title: 'لماذا نصدّق الكاميرا حين تكذب؟',
    category: 'تأملات سينمائية',
    classLabel: 'فلسفة الصورة · مونتاج',
    date: 'نوفمبر ٢٠٢٦',
    pages: '٦٤ صفحة مرقّمة',
    tilt: '-6deg',
    coverBg: '#ff6f1e',
    coverText: '#fdfbf9',
    accentSticker: 'bolt',
    handCaption: 'مترقّم في كل صفحة مع هوامش للمونتاج!',
    summary:
      'مسودة أولى عن الخداع البصري في السينما الوثائقية: كيف تخلق زاوية العدسة وإيقاع القطع شعوراً بالحقيقة حتى لو كان المشهد مُعاد التمثيل بالكامل.',
    marginNotes: [
      'العدسة الواسعة ٢٤مم تقرّب المتفرج من الحدث لكنها تشوّه المسافة العاطفية.',
      'قاعدة الـ 3 ثوانٍ: إذا استمرت اللقطة بعد انتهاء الجملة، يبدأ المشاهد في قراءة ما وراء الوجه.',
      'مراجعة افتتاحية فيلم Close-Up لعباس كيارستمي كمثال على التداخل بين الواقع والتمثيل.',
    ],
    sketchQuote: '«الحقيقة في السينما ليست ما حدث أمام الكاميرا، بل ما يبقى في ذهن المتفرج بعد إظلام الشاشة.»',
  },
  {
    id: 'nb-02',
    rollNo: 'QF-02',
    title: 'أطلس الأماكن التي نسيتها الخرائط',
    category: 'بذور الحلقات',
    classLabel: 'وثائقيات · أرشيف المدن',
    date: 'أكتوبر ٢٠٢٦',
    pages: '٨٠ صفحة مسطّرة',
    tilt: '5.5deg',
    coverBg: '#3b82f6',
    coverText: '#fdfbf9',
    accentSticker: 'sprout',
    handCaption: 'بذرة سلسلة وثائقية جديدة!',
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
    id: 'nb-03',
    rollNo: 'QF-03',
    title: 'هندسة التوتر في المشهد الواحد',
    category: 'تأملات سينمائية',
    classLabel: 'الفِردِكت · تشريح مشهد',
    date: 'سبتمبر ٢٠٢٦',
    pages: '٤٨ صفحة شبكية',
    tilt: '-5deg',
    coverBg: '#22c55e',
    coverText: '#171717',
    accentSticker: 'pink',
    handCaption: 'رسوم حركة الكاميرا باليد!',
    summary:
      'تفكيك بصري للمشاهد الطويلة (Long Takes) التي تحبس الأنفاس دون قطرة دم واحدة: كيف يتصاعد الإيقاع عبر حركة الممثلين داخل الكادر الثابت.',
    marginNotes: [
      'المشهد الافتتاحي في Inglourious Basterds: الكاميرا تتحرك أقل من ٣ مرات خلال ١٨ دقيقة.',
      'توزيع الإضاءة بين الظل والضوء يعمل كمؤشر نفسي لمن يملك السيطرة في الحوار.',
      'الصمت قبل جملة الحكم في الفِردِكت يضاعف أثر التقييم النهائي.',
    ],
    sketchQuote: '«التوتر لا يصنعه الانفجار، بل يصنعه علم المتفرج بوجود القنبلة تحت الطاولة.»',
  },
  {
    id: 'nb-04',
    rollNo: 'QF-04',
    title: 'دفتر التجارب اللونية والزجاج السائل',
    category: 'تجارب بصرية',
    classLabel: 'هوية قاسمز · تصميم تفاعلي',
    date: 'نوفمبر ٢٠٢٦',
    pages: '٩٦ صفحة كروكي',
    tilt: '6.5deg',
    coverBg: '#ff66cf',
    coverText: '#171717',
    accentSticker: 'sun',
    handCaption: 'معمل الهوية البصرية للموقع!',
    summary:
      'ملاحظات تصميم واجهة قاسمز: الدمج بين الزمرد الليلي الدافئ، انكسار الزجاج السائل، وتناسق أوزان خط ثمانية بين العناوين والنصوص الطويلة.',
    marginNotes: [
      'خط ثمانية للعناوين (Display Black 900) مع الكشيدة المائلة ss01 يعطي هيبة المجلات الثقافية.',
      'في النصوص الطويلة نوقف البدائل الزخرفية تماماً لراحة العين أثناء القراءة.',
      'الحركة الفخمة تأخذ وقتها (1.8 ثانية) بدون ارتداد مبالغ فيه.',
    ],
    sketchQuote: '«التصميم الجيد لا يصرخ ليقول أنا هنا، بل يفسح الطريق للحكاية.»',
  },
  {
    id: 'nb-05',
    rollNo: 'QF-05',
    title: 'حكايات لم تجد نهايتها بعد',
    category: 'مسودات لم تكتمل',
    classLabel: 'أرشيف شخصي · قيد البحث',
    date: 'أغسطس ٢٠٢٦',
    pages: '٥٢ صفحة مرقّمة',
    tilt: '-6.5deg',
    coverBg: '#facc15',
    coverText: '#171717',
    accentSticker: 'bolt',
    handCaption: 'أفكار تنتظر الشرارة الأخيرة!',
    summary:
      'قصاصات وأسئلة مفتوحة من كتب ومراسلات قديمة لم تتحول بعد إلى فيديو كامل، لكنها تشكّل الخلفية الفكرية للحلقات القادمة.',
    marginNotes: [
      'قصة المصوّر الذي التقط ١٠ آلاف صورة لشارع واحد على مدار ٤٠ عاماً.',
      'هل يمكن صناعة حلقة كاملة تعتمد فقط على قراءة رسائل صوتية قديمة؟',
      'ربط أرشيف الحكايات بمكتبة الكتب بحيث يحيل كل كتاب إلى حكاية مصوّرة.',
    ],
    sketchQuote: '«بعض الأفكار تحتاج أن تختمر في الدفتر شهوراً قبل أن تستحق دقيقة واحدة على الشاشة.»',
  },
  {
    id: 'nb-06',
    rollNo: 'QF-06',
    title: 'الصوت الخفي: كيف نسمع الصورة؟',
    category: 'بذور الحلقات',
    classLabel: 'هندسة صوتية · سيكولوجيا',
    date: 'نوفمبر ٢٠٢٦',
    pages: '٧٢ صفحة مسطّرة',
    tilt: '5deg',
    coverBg: '#171717',
    coverText: '#fdfbf9',
    accentSticker: 'sprout',
    handCaption: 'ورق كريمي سميك لا يشفّ الحبر!',
    summary:
      'بحث في تصميم الصوت السينمائي (Foley & Room Tone): كيف تغيّر ترددات الخلفية المنخفضة تفسيرنا لنفس اللقطة البصرية تماماً.',
    marginNotes: [
      'تجربة عملية: عرض نفس اللقطة بثلاث طبقات صوتية مختلفة (مطر، ساعة حائط، صمت مطلق).',
      'صوت تقليب الورق في أرشيف الحكايات يمنح شعوراً ملموساً بالزمن.',
      'تجهيز مقارنة سمعية بصرية مباشرة داخل الحلقة القادمة.',
    ],
    sketchQuote: '«العين ترى الإطار، لكن الأذن هي التي تقرر حجم الغرفة.»',
  },
]

const CATEGORIES = ['كل الدفاتر', 'بذور الحلقات', 'تأملات سينمائية', 'تجارب بصرية', 'مسودات لم تكتمل']

/* ── خط متعرج مرسوم باليد تحت الكلمات المميزة بالماركر ── */
function MarkerWord({ children }) {
  return (
    <span className="qz-sp-marker">
      {children}
      <svg
        className="qz-sp-marker-wave"
        viewBox="0 0 120 14"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M2 9 C 22 2, 42 13, 62 7 C 82 2, 100 12, 118 6"
          fill="none"
          stroke="#ff6f1e"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

/* ── سهم منحني مرسوم باليد (1.5px stroke) ── */
function HandCurvedArrow({ flip = false, className = '' }) {
  return (
    <svg
      width="54"
      height="38"
      viewBox="0 0 54 38"
      fill="none"
      className={className}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <path
        d="M4 8 C 18 2, 36 8, 46 28"
        stroke="#ff6f1e"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="1 0"
      />
      <path
        d="M37 26 L 47 30 L 49 19"
        stroke="#ff6f1e"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── استيكرات كرتونية مسطّحة بحدود حبر 2px داكنة (#171717) ── */
function StickerGraphic({ type = 'bolt', size = 46, rotate = '8deg' }) {
  return (
    <span
      className="qz-sp-sticker"
      style={{ width: size, height: size, transform: `rotate(${rotate})` }}
      aria-hidden="true"
    >
      {type === 'bolt' && (
        <svg viewBox="0 0 48 48" fill="none" className="size-full">
          <circle cx="24" cy="24" r="21" fill="#3b82f6" stroke="#171717" strokeWidth="2.4" />
          <path
            d="M26 9L14 26H24L21 39L35 21H25L26 9Z"
            fill="#facc15"
            stroke="#171717"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {type === 'pink' && (
        <svg viewBox="0 0 48 48" fill="none" className="size-full">
          <rect
            x="5"
            y="7"
            width="38"
            height="34"
            rx="14"
            fill="#ff66cf"
            stroke="#171717"
            strokeWidth="2.4"
          />
          <circle cx="18" cy="22" r="2.6" fill="#171717" />
          <circle cx="30" cy="22" r="2.6" fill="#171717" />
          <path
            d="M19 29C21 32 27 32 29 29"
            stroke="#171717"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      )}
      {type === 'sprout' && (
        <svg viewBox="0 0 48 48" fill="none" className="size-full">
          <circle cx="24" cy="24" r="21" fill="#22c55e" stroke="#171717" strokeWidth="2.4" />
          <path
            d="M24 36V20M24 24C24 17 17 14 13 17C13 22 18 25 24 24ZM24 21C24 14 31 12 35 15C35 20 30 22 24 21Z"
            fill="#fdfbf9"
            stroke="#171717"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {type === 'sun' && (
        <svg viewBox="0 0 48 48" fill="none" className="size-full">
          <path
            d="M24 4L29.5 15.5L42 17.5L33 26.5L35 39L24 33L13 39L15 26.5L6 17.5L18.5 15.5L24 4Z"
            fill="#facc15"
            stroke="#171717"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="22" r="2" fill="#171717" />
          <circle cx="28" cy="22" r="2" fill="#171717" />
          <path d="M21 27C22.5 28.5 25.5 28.5 27 27" stroke="#171717" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </span>
  )
}

/* ── استيكر الاسم المصفّح على غلاف كل دفتر (Name / Class / Roll no.) ── */
function NameLabelSticker({ title, classLabel, rollNo }) {
  return (
    <div className="qz-sp-name-label" dir="rtl">
      <div className="qz-sp-name-row">
        <span className="qz-sp-name-key">الاسم / الدفتر:</span>
        <span className="qz-sp-name-val truncate">{title}</span>
      </div>
      <div className="qz-sp-name-row">
        <span className="qz-sp-name-key">الفئة:</span>
        <span className="qz-sp-name-val">{classLabel}</span>
      </div>
      <div className="qz-sp-name-row">
        <span className="qz-sp-name-key">رقم الأرشيف:</span>
        <span className="qz-sp-name-val qz-latin">{rollNo}</span>
      </div>
    </div>
  )
}

export default function IdeasCastle() {
  const reduce = useReducedMotion()
  const [notebooks, setNotebooks] = useState(INITIAL_NOTEBOOKS)
  const [activeCategory, setActiveCategory] = useState('كل الدفاتر')
  const [selectedBook, setSelectedBook] = useState(null)
  const [newIdeaOpen, setNewIdeaOpen] = useState(false)
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaCat, setIdeaCat] = useState('بذور الحلقات')
  const [ideaSummary, setIdeaSummary] = useState('')

  const filtered = useMemo(() => {
    if (activeCategory === 'كل الدفاتر') return notebooks
    return notebooks.filter((n) => n.category === activeCategory)
  }, [notebooks, activeCategory])

  const heroBook = notebooks[0]

  const handleAddNotebook = (e) => {
    e.preventDefault()
    if (!ideaTitle.trim()) return
    const nextNum = String(notebooks.length + 1).padStart(2, '0')
    const palettes = [
      { bg: '#ff6f1e', fg: '#fdfbf9', st: 'bolt', tilt: '-5.5deg' },
      { bg: '#3b82f6', fg: '#fdfbf9', st: 'sprout', tilt: '5.5deg' },
      { bg: '#22c55e', fg: '#171717', st: 'pink', tilt: '-5deg' },
      { bg: '#ff66cf', fg: '#171717', st: 'sun', tilt: '6deg' },
    ]
    const pick = palettes[notebooks.length % palettes.length]
    const created = {
      id: `nb-${nextNum}`,
      rollNo: `QF-${nextNum}`,
      title: ideaTitle.trim(),
      category: ideaCat,
      classLabel: `${ideaCat} · مسودة حية`,
      date: 'الآن · ٢٠٢٦',
      pages: '٣٢ صفحة مرقّمة',
      tilt: pick.tilt,
      coverBg: pick.bg,
      coverText: pick.fg,
      accentSticker: pick.st,
      handCaption: 'شرارة مضافة للتو في الدفتر!',
      summary:
        ideaSummary.trim() ||
        'فكرة جديدة قيد التطوير في معمل قلع الأفكار، جاهزة للتحول إلى سيناريو أو مقال قادم.',
      marginNotes: [
        'تحديد السؤال المحوري للفكرة في سطر واحد قبل كتابة السكريبت.',
        'اختيار التكوين البصري والمراجع السينمائية المرتبطة بالموضوع.',
      ],
      sketchQuote: `«${ideaTitle.trim()} — كل حلقة كبيرة بدأت بسطر سريع على هامش دفتر.»`,
    }
    setNotebooks((prev) => [created, ...prev])
    setIdeaTitle('')
    setIdeaSummary('')
    setNewIdeaOpen(false)
    setSelectedBook(created)
    playGlassTap()
  }

  return (
    <div className="qz-ideas-page" dir="rtl">
      <div className="qz-ideas-canvas">
        {/* الشريط العلوي داخل الدفتر الورقي */}
        <div className="qz-ideas-topbar">
          <div className="flex flex-wrap items-center gap-3">
            <span className="qz-ideas-brand-pill">
              <Sparkles className="size-4 text-[#ff6f1e]" aria-hidden="true" />
              <span>قلع الأفكار · SUPERR SKETCHBOOK EDITION</span>
            </span>
            <span className="text-xs font-bold text-[#5b5753]">
              ورق كريمي 100 GSM · مرقّم ومسطّر للشخبطة الحرة
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="qz-sp-pill-btn"
              onClick={() => {
                playGlassTap()
                setSelectedBook(heroBook)
              }}
            >
              <BookMarked className="size-4" aria-hidden="true" />
              <span>تصفّح دفتر العدد</span>
            </button>
            <button
              type="button"
              className="qz-sp-pill-btn qz-sp-pill-btn-primary"
              onClick={() => {
                playGlassTap()
                setNewIdeaOpen((v) => !v)
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>دوّن شرارة فكرة</span>
            </button>
          </div>
        </div>

        {/* ── الواجهة الافتتاحية (Hero Section — DESIGN 3) ── */}
        <section className="relative mt-8 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div>
            <div className="mb-4 inline-flex items-center gap-3">
              <StickerGraphic type="bolt" size={44} rotate="-10deg" />
              <span className="qz-sp-handnote">
                دفاتر حقيقية للمفكرين بعمق — والمشخبطين بحرية!
              </span>
              <StickerGraphic type="pink" size={42} rotate="12deg" />
            </div>

            <h1
              className="font-[family-name:var(--font-display)] text-[clamp(2.4rem,5.4vw,4.5rem)] font-black leading-[1.08] tracking-[-0.03em] text-[#171717]"
            >
              قلع الأفكار: حيث تولد{' '}
              <MarkerWord>الحكايات</MarkerWord>{' '}
              قبل أن تضيء الكاميرا.
            </h1>

            <p className="mt-6 max-w-2xl font-[family-name:var(--font-text)] text-[clamp(1.05rem,1.4vw,1.25rem)] leading-[1.75] text-[#414141]">
              هنا لا توجد نصوص نهائية مصقولة؛ هنا{' '}
              <MarkerWord>المسودات الأولى</MarkerWord>، الأسئلة المعلّقة على الهوامش،
              ورسوم الكادرات التي تتحوّل لاحقاً إلى حلقات وثائقية ومراجعات في «الفِردِكت».
              افتح أي دفتر لتقرأ الهوامش كما كُتبت.
            </p>

            {/* بطاقات المواصفات الثلاث من DESIGN (3).md */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="qz-sp-dew-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-wider text-[#ff6f1e]">SPEC 01</span>
                  <StickerGraphic type="sprout" size={32} rotate="-8deg" />
                </div>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-black text-[#171717]">
                  مترقّم بالكامل
                </p>
                <p className="mt-1 text-xs leading-6 text-[#5b5753]">
                  كل فكرة لها رقم أرشيف وفهرس واضح للرجوع إليها وقت التصوير.
                </p>
              </div>

              <div className="qz-sp-dew-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-wider text-[#3b82f6]">SPEC 02</span>
                  <StickerGraphic type="sun" size={32} rotate="10deg" />
                </div>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-black text-[#171717]">
                  هوامش حرة
                </p>
                <p className="mt-1 text-xs leading-6 text-[#5b5753]">
                  مساحات جانبية مخصّصة لتفكيك المشاهد وتدوين اقتباسات الكتب.
                </p>
              </div>

              <div className="qz-sp-dew-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-wider text-[#22c55e]">SPEC 03</span>
                  <StickerGraphic type="bolt" size={32} rotate="6deg" />
                </div>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-black text-[#171717]">
                  تفاعلي ١٠٠٪
                </p>
                <p className="mt-1 text-xs leading-6 text-[#5b5753]">
                  اضغط على أي دفتر لفتحه وقراءة مسوداته أو أضف فكرتك الخاصة.
                </p>
              </div>
            </div>
          </div>

          {/* عرض الدفتر الرئيسي المائل مع السهم اليدوي واستيكر الاسم المصفّح */}
          <div className="qz-sp-notebook-stage mx-auto w-full max-w-md">
            <div className="mb-3 flex items-center justify-end gap-2">
              <span className="qz-sp-handnote">اضغط على الدفتر لفتح صفحاته المسطّرة!</span>
              <HandCurvedArrow />
            </div>

            <motion.div
              whileHover={reduce ? undefined : { rotate: 0, y: -6 }}
              className="qz-sp-notebook"
              style={{
                '--nb-tilt': '-6deg',
                backgroundColor: heroBook.coverBg,
                color: heroBook.coverText,
              }}
              onClick={() => {
                playGlassTap()
                setSelectedBook(heroBook)
              }}
            >
              <div className="qz-sp-notebook-spine" aria-hidden="true" />

              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-[#171717] bg-[#fdfbf9] px-3 py-1 text-xs font-extrabold text-[#171717]">
                  دفتر العدد المميّز · {heroBook.rollNo}
                </span>
                <StickerGraphic type="sun" size={40} rotate="12deg" />
              </div>

              <h2 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-black leading-snug sm:text-3xl">
                {heroBook.title}
              </h2>

              <p className="mt-3 text-sm leading-7 opacity-95">
                {heroBook.summary}
              </p>

              <div className="mt-6">
                <NameLabelSticker
                  title="أحمد قاسم — دفتر المونتاج"
                  classLabel={heroBook.classLabel}
                  rollNo={heroBook.rollNo}
                />
              </div>

              <div className="mt-5 flex items-center justify-between text-xs font-bold">
                <span>{heroBook.pages}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#171717] bg-[#fdfbf9] px-3 py-1 text-[#171717]">
                  افتح الدفتر
                  <ArrowUpLeft className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── نموذج إضافة شرارة فكرة جديدة ── */}
        <AnimatePresence>
          {newIdeaOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddNotebook}
              className="mt-8 overflow-hidden"
            >
              <div className="qz-sp-dew-card border-2 border-[#171717]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <PenTool className="size-5 text-[#ff6f1e]" aria-hidden="true" />
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-black text-[#171717]">
                      تدوين دفتر أو شرارة فكرة جديدة
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewIdeaOpen(false)}
                    className="qz-sp-pill-btn !px-3 !py-1.5 text-xs"
                  >
                    إغلاق
                  </button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#414141]">
                      عنوان الفكرة أو السؤال
                    </label>
                    <input
                      type="text"
                      required
                      value={ideaTitle}
                      onChange={(e) => setIdeaTitle(e.target.value)}
                      placeholder="مثال: كيف تصنع الإضاءة الخافتة ذاكرة المشهد؟"
                      className="w-full rounded-xl border-[1.5px] border-[#171717] bg-[#fdfbf9] px-3.5 py-2.5 text-sm font-bold text-[#171717] outline-none focus:border-[#ff6f1e]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#414141]">
                      تصنيف الدفتر
                    </label>
                    <select
                      value={ideaCat}
                      onChange={(e) => setIdeaCat(e.target.value)}
                      className="w-full rounded-xl border-[1.5px] border-[#171717] bg-[#fdfbf9] px-3.5 py-2.5 text-sm font-bold text-[#171717] outline-none focus:border-[#ff6f1e]"
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
                  <label className="mb-1.5 block text-xs font-bold text-[#414141]">
                    ملخص الفكرة أو الهوامش الأولية
                  </label>
                  <textarea
                    rows={3}
                    value={ideaSummary}
                    onChange={(e) => setIdeaSummary(e.target.value)}
                    placeholder="اكتب الشرارة الأولى أو الملاحظة التي تريد حفظها في الدفتر..."
                    className="w-full rounded-xl border-[1.5px] border-[#171717] bg-[#fdfbf9] p-3.5 text-sm text-[#171717] outline-none focus:border-[#ff6f1e]"
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <button type="submit" className="qz-sp-pill-btn qz-sp-pill-btn-primary">
                    <Sparkles className="size-4" aria-hidden="true" />
                    <span>إضافة الدفتر إلى قلع الأفكار</span>
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── شريط تصفية الدفاتر بأزرار الكبسولة (20px Pill Buttons) ── */}
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="qz-sp-handnote">اختر الرف أو التصنيف المناسب</span>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-black text-[#171717] sm:text-3xl">
                رفوف الدفاتر والمسودات ({filtered.length})
              </h2>
            </div>

            <div className="flex flex-wrap gap-2" role="tablist" aria-label="تصنيفات قلع الأفكار">
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-active={active ? 'true' : undefined}
                    className="qz-sp-pill-btn text-xs sm:text-sm"
                    onClick={() => {
                      playGlassTap()
                      setActiveCategory(cat)
                    }}
                  >
                    <Tag className="size-3.5" aria-hidden="true" />
                    <span>{cat}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* شبكة الدفاتر المائلة (Tilted Notebook Grid 3-col) */}
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((nb, idx) => (
              <div key={nb.id} className="qz-sp-notebook-stage flex flex-col justify-between">
                {/* التعليق اليدوي بالماركر البرتقالي + السهم المرسوم باليد */}
                <div className="mb-3 flex items-center justify-between gap-2 px-2">
                  <span className="qz-sp-handnote text-base">{nb.handCaption}</span>
                  <HandCurvedArrow flip={idx % 2 === 1} />
                </div>

                <div
                  className="qz-sp-notebook flex h-full flex-col justify-between"
                  style={{
                    '--nb-tilt': nb.tilt,
                    backgroundColor: nb.coverBg,
                    color: nb.coverText,
                  }}
                  onClick={() => {
                    playGlassTap()
                    setSelectedBook(nb)
                  }}
                >
                  <div className="qz-sp-notebook-spine" aria-hidden="true" />

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-[#171717] bg-[#fdfbf9] px-2.5 py-0.5 text-[11px] font-extrabold text-[#171717]">
                        {nb.category}
                      </span>
                      <StickerGraphic
                        type={nb.accentSticker}
                        size={38}
                        rotate={idx % 2 === 0 ? '10deg' : '-10deg'}
                      />
                    </div>

                    <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-black leading-snug">
                      {nb.title}
                    </h3>

                    <p className="mt-2.5 text-sm leading-6 opacity-90">
                      {nb.summary}
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    <NameLabelSticker
                      title="أحمد قاسم"
                      classLabel={nb.classLabel}
                      rollNo={nb.rollNo}
                    />

                    <div className="flex items-center justify-between pt-1 text-xs font-extrabold">
                      <span>{nb.pages} · {nb.date}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#171717] bg-[#fdfbf9] px-3 py-1 text-[#171717]">
                        اقرأ الهوامش
                        <ArrowUpLeft className="size-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── شريط الفوتر البرتقالي بزاوية 56px العلوية (Footer Brand Band — DESIGN 3) ── */}
        <section className="qz-sp-footer-band">
          <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#171717] bg-[#fdfbf9] px-3.5 py-1 text-xs font-extrabold text-[#171717]">
                <Lightbulb className="size-3.5 text-[#ff6f1e]" aria-hidden="true" />
                <span>معمل الأفكار المفتوح · QASSIMZ SUPERBOOK</span>
              </div>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.9rem,3.6vw,3rem)] font-black leading-tight text-[#fdfbf9]">
                الأفكار الكبيرة تبدأ بشخبطة صغيرة على طرف الصفحة.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#fdfbf9]/90 sm:text-base">
                كل دفتر هنا يتحدث باستمرار مع تقدّم البحث والتصوير. شاركنا فكرة أو زاوية
                تحب أن نفتح لها دفتراً خاصاً في الحلقات القادمة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StickerGraphic type="sun" size={52} rotate="-12deg" />
              <button
                type="button"
                className="qz-sp-pill-btn !px-6 !py-3 text-base"
                onClick={() => {
                  playGlassTap()
                  setNewIdeaOpen(true)
                  window.scrollTo({ top: 180, behavior: 'smooth' })
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                <span>افتح دفتراً جديداً الآن</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── نافذة الدفتر المفتوح (Ruled Notebook Pages Reader) ── */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={selectedBook.title}
            className="qz-sp-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBook(null)}
          >
            <motion.div
              className="qz-sp-open-book"
              dir="rtl"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, rotate: -2 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="qz-sp-margin-line" aria-hidden="true" />

              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#171717] pb-4">
                <div className="flex items-center gap-3">
                  <StickerGraphic type={selectedBook.accentSticker} size={42} rotate="-6deg" />
                  <div>
                    <span className="text-xs font-extrabold text-[#ff6f1e]">
                      {selectedBook.category} · رقم الدفتر {selectedBook.rollNo}
                    </span>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl font-black text-[#171717] sm:text-3xl">
                      {selectedBook.title}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="qz-sp-pill-btn !px-3.5 !py-2"
                  aria-label="إغلاق الدفتر"
                >
                  <X className="size-4" aria-hidden="true" />
                  <span>إغلاق الدفتر</span>
                </button>
              </div>

              <div className="mt-6 pr-6 sm:pr-10">
                <p className="qz-sp-handnote mb-4">{selectedBook.handCaption}</p>
                <p className="font-[family-name:var(--font-text)] text-lg leading-[2.1] text-[#171717]">
                  {selectedBook.summary}
                </p>

                <div className="mt-6 rounded-2xl border-2 border-[#171717] bg-[#f7efe9] p-5 shadow-[4px_4px_0_0_#171717]">
                  <p className="text-xs font-extrabold tracking-wider text-[#ff6f1e]">
                    اقتباس مرسوم على الهامش
                  </p>
                  <blockquote className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold leading-relaxed text-[#171717]">
                    {selectedBook.sketchQuote}
                  </blockquote>
                </div>

                <h3 className="mt-8 font-[family-name:var(--font-display)] text-xl font-black text-[#171717]">
                  الملاحظات المسطّرة داخل الدفتر:
                </h3>
                <ul className="mt-4 space-y-3">
                  {selectedBook.marginNotes.map((note, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 font-[family-name:var(--font-text)] text-base leading-[2] text-[#171717]"
                    >
                      <span className="mt-1.5 inline-grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] border-[#171717] bg-[#ff6f1e] text-xs font-black text-[#fdfbf9]">
                        {i + 1}
                      </span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t-[1.5px] dashed border-[#171717]/25 pt-5 text-xs font-bold text-[#5b5753]">
                  <span>الكاتب: أحمد قاسم · {selectedBook.classLabel}</span>
                  <span>{selectedBook.pages} · {selectedBook.date}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
