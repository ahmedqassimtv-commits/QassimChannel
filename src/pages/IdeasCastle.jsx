import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pause, Play, Plus, X } from 'lucide-react'
import { playGlassTap } from '../utils/glassSound.js'
import { THEME_META, useTheme } from '../utils/theme.js'

/* ══ قاع الأفكار — Superr Full-Page Experience (DESIGN 9 + Video Walkthrough) ══
   صفحة كاملة بأرضية الورق الكريمي (#fdfbf9) ممتدة بعرض وطول الشاشة بدون قص،
   تطبّق التسلسل البصري الكامل للقالب المرفق:
   1) Hero غير متماثل + دفتر جلد بني مائل واستيكر الاسم + قلم رصاص
   2) وقفة تنفّس طباعية بالمنتصف
   3) بانوراما المرج الأخضر والأزهار البرية + دفتر مفتوح بصفحتين + بطاقة I–V
   4) بانوراما السماء الزرقاء والسحب + مكتبة الدفاتر التفاعلية + بطاقة I–V
   5) بانوراما المفرش المخطط الدافئ وطبق البسكويت + الدفتر الوردي + بطاقة I–V
   6) شبكة الرسومات الحبرية اليدوية (#171717 · 1.5px) حول «بكثييير!»
   7) ورقة «قائمة اللا» المسطّرة بالهامش الأحمر وعلامات ✗ + 4 استيكرات مسطحة
   8) دفاتر العرض الثنائية («دفترنا الخاص. بطريقتنا الخاصة.») + رف الأرشيف الحي + الفوتر البرتقالي 56px. */

const STORAGE_KEY = 'qz-superr-ideas-v2'

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
    pencilColor: '#ff6f1e',
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
    pencilColor: '#3b82f6',
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
    pencilColor: '#ff66cf',
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
    pencilColor: '#22c55e',
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
    pencilColor: '#ce500a',
    pages: '٦٤ صفحة مرقّمة · أرشيف حي',
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
    id: 'nb-sky-cinema',
    rollNo: '06',
    studentName: 'أحمد قاسم',
    classLabel: 'ضوء ولون · تدريج بصري',
    category: 'تأملات سينمائية',
    title: 'ذاكرة الألوان الدافئة في أفلام التسعينيات',
    handCaption: 'ملاحظات الدفتر السماوي',
    tilt: '-6.5deg',
    coverStyle: 'blue-clouds',
    pencilColor: '#3b82f6',
    pages: '٨٨ صفحة خام · رسم لوني',
    summary:
      'تفكيك سيكولوجي لباليتات اللون الترابي والعنبري في أفلام التسعينيات، ولماذا يرتبط تحبّب شريط 35mm في ذاكرتنا بالشجن والدفء.',
    marginNotes: [
      'الظلال لا يجب أن تكون سوداء تماماً — لمسة بنّية أو زيتية دافئة تعطي للجلد حياة.',
      'استخدام التباين اللطيف بدل الحدة الرقمية القاسية يصنع مسافة حالمة.',
      'الربط بين إضاءة النوافذ الجانبية في اللقطة الثابتة وإحساس مرور الوقت.',
    ],
    sketchQuote: '«اللون لا يزيّن المشهد، بل يخبرنا بدرجة حرارة الذكرى قبل أن ينطق الممثل.»',
  },
]

const CATEGORIES = ['كل الدفاتر', 'بذور الحلقات', 'تأملات سينمائية', 'مسودات لم تكتمل']

const ROMAN = ['I', 'II', 'III', 'IV', 'V']

const MEADOW_FEATURES = [
  {
    label: 'التقاط الفكرة لحظة وميضها',
    leftTag: 'فصل ٠١ · شرارة البداية',
    leftTitle: 'كادر مفتوح قبل الفجر',
    leftBody:
      'كل حلقة تبدأ بسطر غير مكتمل على هامش الورق: ملاحظة سمعناها في مقهى أو سؤال غريب عن لقطة مرّت سريعاً في فيلم قديم.',
    rightNote: 'جرّب أن تبدأ الحلقة من اللحظة التي تسبق الحدث بـ ١٠ ثوانٍ فقط.',
    doodleCaption: 'رسم كروكي: زاوية كاميرا منخفضة + ظل شجرة طويل',
  },
  {
    label: 'مؤلفات ومراجع تحب القراءة',
    leftTag: 'فصل ٠٢ · بين الكتب',
    leftTitle: 'هوامش من «نحت الزمن»',
    leftBody:
      'تاركوفسكي كان يصف السينما بأنها جمعٌ للوقت المفقود، وهنا نربط كل مقولة بكتاب حقيقي في مكتبة قاسمز.',
    rightNote: 'ضع إشارة مرجعية عند الصفحة التي أوقفتك عن متابعة القراءة للتأمل.',
    doodleCaption: 'ربط مباشر بين مسودة الدفتر ورفّ الكتب والقصص',
  },
  {
    label: 'خريطة حرة للربط بين الأفكار',
    leftTag: 'فصل ٠٣ · شبكة المعاني',
    leftTitle: 'كيف ترتبط مدينة قديمة بفيلم صامت؟',
    leftBody:
      'المكان الذي يبدو مهمَلاً على الخريطة يحمل في تفاصيله نفس إيقاع السينما الأولى: سكون، ضوء شباك، وذاكرة جمعية.',
    rightNote: 'ارسم خطاً متصلاً بين القصة التاريخية والمراجعة النقدية في الفِردِكت.',
    doodleCaption: 'مسارات يدوية تصل الأسئلة القديمة بالحلقات الجديدة',
  },
  {
    label: 'بناء الإيقاع الصوتي والبصري',
    leftTag: 'فصل ٠٤ · الميزانسين',
    leftTitle: 'الصمت كموسيقى تصويرية',
    leftBody:
      'توزيع فجوات الصمت داخل الحلقة يعطي للكلمة التي تليها وزناً مضاعفاً، تماماً مثل المساحات البيضاء على صفحة الورق.',
    rightNote: 'اترك ٤ ثوانٍ من الهواء النقي قبل كشف النقطة المفصلية.',
    doodleCaption: 'خط موجي هادئ يعادل تنفس المشاهد',
  },
  {
    label: 'اختبار المعنى قبل التصوير',
    leftTag: 'فصل ٠٥ · بروفة أخيرة',
    leftTitle: 'هل تصمد الفكرة في جملة واحدة؟',
    leftBody:
      'إذا احتجت عشر دقائق لشرح قلب الفكرة لصديق، فالدفتر يذكّرك أن تعود للشرارة الأولى وتُصفي الزوائد.',
    rightNote: 'لخّص الروح كلها في اقتباس واضح يوضع أعلى أول صفحة.',
    doodleCaption: 'ختم القبول النهائي بالحبر البرتقالي',
  },
]

const SKY_FEATURES = [
  {
    label: 'رفّ دفاتر مصوّر باليد',
    prompt: 'افتح أي غلاف ملوّن من الشبكة المقابلة لقراءة محتوياته كاملة بالحبر والهامش.',
  },
  {
    label: 'تحديث مع كل حلقة ومراجعة',
    prompt: 'كل فيديو جديد أو مقال ينمو أولاً كمسودة داخل أحد هذه الدفاتر الورقية.',
  },
  {
    label: 'خوارزميات منعدمة الفوضى',
    prompt: 'تتنقل بين الدفاتر بإيقاعك الهادئ بدون إشعارات أو اقتراحات تشتت بصرك.',
  },
  {
    label: 'بحث وتصنيف بالوسوم اللطيفة',
    prompt: 'تميّز الوسوم ببذور الحلقات، تأملات السينما، والمسودات قيد التطوير.',
  },
  {
    label: 'مسودة حية يشارك فيها الزائر',
    prompt: 'بضغطة زر واحدة تضيف دفترك وفكرتك إلى الرف وتُحفظ مباشرة على جهازك.',
  },
]

const PINK_FEATURES = [
  {
    label: 'أسئلة تُخرج الفكرة من صمتها',
    question: '«ما الشيء الصغير في هذا المشهد الذي يلاحظه المخرج ولا ينتبه له البطل؟»',
    hint: 'ابدأ الإجابة بـ ٣ مشاهدات بصرية قصيرة لا تتجاوز سطراً لكل منها.',
  },
  {
    label: 'تحديات قراءة الأسبوع',
    question: '«لو أعدت مونتاج هذا الفيلم بنصف مدته فقط، أي لقطة يستحيل أن تحذفها؟»',
    hint: 'تلك اللقطة بالتحديد هي العمود الفقري لقراءة الفِردِكت القادمة.',
  },
  {
    label: 'ترشيحات كتب ومقالات متصلة',
    question: '«أي كتاب في المكتبة يشرح نفس المزاج العاطفي لهذه القصة؟»',
    hint: 'اجمع بين مقالين أو فقرتين لفتح زاوية مقارنة غير متوقعة.',
  },
  {
    label: 'تدرّج من الهواية نحو الإتقان',
    question: '«ما الخطوة الأبسط التي تجعل النسخة القادمة أصدق بنسبة ٢٠٪؟»',
    hint: 'ركّز على الصدق التعبيري والإضاءة الدافئة بدل المؤثرات الزائدة.',
  },
  {
    label: 'سؤال يومي بسيط في الهوامش',
    question: '«ما اللقطة التي سكنت ذاكرتك اليوم ولماذا لم تغادرها؟»',
    hint: 'دوّنها الآن قبل أن يبتلعها ضجيج الغد في أقل من دقيقتين.',
  },
]

const NO_LIST_PROMISES = [
  'بدون ضجيج خوارزميات أو عدّادات تشتت',
  'بدون إعلانات تقاطع حبل الفكرة',
  'بدون غرف دردشة أو جدل سطحي',
  'بدون قوالب جامدة تفرض شكل النص',
  'بدون اختفاء مفاجئ لهوامشك الأولى',
  'بدون تعقيد يعطّل يدك عن الكتابة',
]

function loadSavedNotebooks() {
  if (typeof window === 'undefined') return INITIAL_NOTEBOOKS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_NOTEBOOKS
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {
    /* ignore */
  }
  return INITIAL_NOTEBOOKS
}

/* ── أيقونة اليد المرسومة بالحبر الفحمي ──────────────────────────────── */
function HandBrandMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path
        d="M14 17V7.5C14 6.12 15.12 5 16.5 5C17.88 5 19 6.12 19 7.5V15M19 13.5C19 12.12 20.12 11 21.5 11C22.88 11 24 12.12 24 13.5V16M24 15.5C24 14.12 25.12 13 26.5 13C27.88 13 29 14.12 29 15.5V22.5C29 27.75 24.75 32 19.5 32H16.5C12.5 32 9.5 29.5 8 26L5.5 20.5C4.9 19.2 5.5 17.7 6.8 17.2C8 16.7 9.4 17.3 10 18.5L11.5 21.5V17C11.5 15.62 12.62 14.5 14 14.5"
        stroke="#171717"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#fdfbf9"
      />
    </svg>
  )
}

/* ── تمييز كلمة بالماركر البرتقالي + خط متموج مرسوم ───────────────── */
function MarkerHighlight({ children }) {
  return (
    <span className="qz-superr-highlight">
      {children}
      <svg viewBox="0 0 110 10" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M2 6.5 C 24 2.5, 46 8.5, 68 4.5 C 86 2.5, 98 7.5, 108 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

/* ── سهم منحني مرسوم باليد 1.5px بالحبر الفحمي #171717 ──────────────── */
function CharcoalCurvedArrow({ flip = false, className = '' }) {
  return (
    <svg
      width="58"
      height="42"
      viewBox="0 0 58 42"
      fill="none"
      className={className}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <path
        d="M6 8 C 22 3, 38 11, 47 34"
        stroke="#171717"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M39 30 C 43 33, 46 35, 48 36 C 49 32, 50 27, 52 23"
        stroke="#171717"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── قلم خشبي أو حبر بجانب الدفتر ──────────────────────────────────── */
function PencilProp({ color = '#facc15', variant = 'pencil', className = '' }) {
  if (variant === 'whitepen') {
    return (
      <svg viewBox="0 0 28 210" width="22" height="170" className={className} aria-hidden="true">
        <rect x="7" y="18" width="14" height="156" rx="7" fill="#fdfbf9" stroke="#171717" strokeWidth="1.8" />
        <path d="M10 174 L14 198 L18 174 Z" fill="#cbd5e1" stroke="#171717" strokeWidth="1.5" />
        <rect x="6" y="34" width="16" height="10" rx="2" fill="#ff66cf" stroke="#171717" strokeWidth="1.5" />
        <path d="M21 42 L26 42 L26 88" fill="none" stroke="#171717" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 28 220" width="24" height="184" className={className} aria-hidden="true">
      <rect x="7" y="10" width="14" height="16" rx="4" fill="#ff8ba7" stroke="#171717" strokeWidth="1.8" />
      <rect x="7" y="25" width="14" height="11" fill="#d4d4d8" stroke="#171717" strokeWidth="1.6" />
      <rect x="7" y="36" width="14" height="148" fill={color} stroke="#171717" strokeWidth="1.8" />
      <line x1="11.5" y1="37" x2="11.5" y2="183" stroke="#171717" strokeWidth="1" opacity="0.35" />
      <line x1="16.5" y1="37" x2="16.5" y2="183" stroke="#171717" strokeWidth="1" opacity="0.35" />
      <polygon points="7,184 21,184 14,210" fill="#fde6c4" stroke="#171717" strokeWidth="1.8" />
      <polygon points="11.8,200 16.2,200 14,210" fill="#171717" />
    </svg>
  )
}

/* ── استيكر الاسم المدرسي المصفّح (Name / Class / Roll no.) ──────────── */
function NameLabelSticker({ name, classLabel, rollNo, cornerHeart = false }) {
  return (
    <div className="qz-superr-label" dir="rtl">
      {cornerHeart && (
        <span
          className="absolute -left-2 -top-2 inline-flex size-6 items-center justify-center rounded-full border-[1.5px] border-[#171717] bg-[#ff66cf] text-[11px] font-bold text-[#171717]"
          aria-hidden="true"
        >
          ♥
        </span>
      )}
      <div className="qz-superr-label-inner">
        <div className="qz-superr-label-row">
          <span className="qz-superr-label-key">الاسم</span>
          <span className="qz-superr-label-name">{name}</span>
        </div>
        <div className="qz-superr-label-row">
          <span className="qz-superr-label-key">القسم</span>
          <span className="qz-superr-label-meta">{classLabel}</span>
        </div>
        <div className="qz-superr-label-row">
          <span className="qz-superr-label-key">رقم الدفتر</span>
          <span className="qz-superr-label-meta qz-latin">{rollNo}</span>
        </div>
      </div>
    </div>
  )
}

/* ── استيكرات مسطّحة بحدود داكنة 2px مائلة 5–15° بدون ظلال ─────────────── */
function Sticker({ type = 'bolt', size = 56, rotate = '10deg', className = '' }) {
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
            fill="#3b82f6"
            stroke="#171717"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {type === 'ribbon' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <path
            d="M28 8C19 8 12 15 12 24C12 31 17 37 22 39V50L28 45L34 50V39C39 37 44 31 44 24C44 15 37 8 28 8Z"
            fill="#3b82f6"
            stroke="#171717"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="28" cy="24" r="6.5" fill="#fdfbf9" stroke="#171717" strokeWidth="1.8" />
        </svg>
      )}
      {type === 'bulb' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <path
            d="M28 8C19.5 8 13 14.5 13 22.8C13 28.4 16.5 32.8 20.5 36.2V42H35.5V36.2C39.5 32.8 43 28.4 43 22.8C43 14.5 36.5 8 28 8Z"
            fill="#facc15"
            stroke="#171717"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="21" y="42" width="14" height="6" rx="2" fill="#fdfbf9" stroke="#171717" strokeWidth="2" />
          <path d="M24 25L28 21L32 25" stroke="#171717" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      {type === 'star' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <path
            d="M28 6L34.5 19.5L49 21.5L38.5 31.8L41 46.5L28 39.5L15 46.5L17.5 31.8L7 21.5L21.5 19.5L28 6Z"
            fill="#fbbf24"
            stroke="#171717"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="26" r="1.6" fill="#171717" />
          <circle cx="32" cy="26" r="1.6" fill="#171717" />
        </svg>
      )}
      {type === 'heart' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <path
            d="M28 47C28 47 8 34 8 19.5C8 12.5 13.5 8 19.5 8C23.5 8 26.5 10 28 13C29.5 10 32.5 8 36.5 8C42.5 8 48 12.5 48 19.5C48 34 28 47 28 47Z"
            fill="#ff6f1e"
            stroke="#171717"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="22" cy="23" r="3.2" fill="#fdfbf9" stroke="#171717" strokeWidth="1.8" />
          <circle cx="34" cy="23" r="3.2" fill="#fdfbf9" stroke="#171717" strokeWidth="1.8" />
          <circle cx="22" cy="23" r="1.4" fill="#171717" />
          <circle cx="34" cy="23" r="1.4" fill="#171717" />
        </svg>
      )}
      {type === 'cloud-buddy' && (
        <svg viewBox="0 0 64 56" fill="none" className="size-full">
          <path
            d="M17 44H47C52.5 44 56 39.5 56 34.5C56 30 52.8 26 48 25.2C46.5 16.5 39 11 31 11C22.2 11 15 17.6 14.5 26C10.4 27 8 30.8 8 35C8 40 12 44 17 44Z"
            fill="#60a5fa"
            stroke="#171717"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="27" cy="29" r="2.2" fill="#171717" />
          <circle cx="38" cy="29" r="2.2" fill="#171717" />
          <path d="M29.5 34C31 36 34 36 35.5 34" stroke="#171717" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      {type === 'bear' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <circle cx="15" cy="15" r="7" fill="#ff6f1e" stroke="#171717" strokeWidth="2" />
          <circle cx="41" cy="15" r="7" fill="#ff6f1e" stroke="#171717" strokeWidth="2" />
          <rect x="10" y="14" width="36" height="32" rx="16" fill="#ff6f1e" stroke="#171717" strokeWidth="2" />
          <circle cx="22" cy="28" r="2.2" fill="#171717" />
          <circle cx="34" cy="28" r="2.2" fill="#171717" />
          <ellipse cx="28" cy="34" rx="5.5" ry="4" fill="#fdfbf9" stroke="#171717" strokeWidth="1.8" />
          <circle cx="28" cy="33" r="1.6" fill="#171717" />
        </svg>
      )}
      {type === 'ghost' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <path
            d="M12 46V24C12 14.6 19.2 8 28 8C36.8 8 44 14.6 44 24V46L38.5 41.5L33 46L28 41.5L23 46L17.5 41.5L12 46Z"
            fill="#262626"
            stroke="#171717"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="23" cy="24" r="2.6" fill="#fdfbf9" />
          <circle cx="33" cy="24" r="2.6" fill="#fdfbf9" />
        </svg>
      )}
      {type === 'sprout' && (
        <svg viewBox="0 0 56 56" fill="none" className="size-full">
          <path
            d="M28 46V24M28 28C28 19 19 15 13 19C13 26 20 30 28 28ZM28 24C28 15 37 12 43 16C43 23 36 26 28 24Z"
            fill="#22c55e"
            stroke="#171717"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

/* ── البطاقة العائمة I–V المشتركة بين المشاهد الثلاثة (منع التكرار) ────── */
function RomanFeatureCard({ prefix, highlight, accent, items, activeIndex, onSelect, paused, onTogglePause }) {
  return (
    <div className="qz-superr-roman-card">
      <div className="qz-superr-roman-head">
        <h3 className="qz-superr-roman-title">
          {prefix}{' '}
          <span style={{ color: accent }}>
            {highlight}
          </span>
        </h3>
        {onTogglePause && (
          <button
            type="button"
            className="qz-superr-pause-btn"
            onClick={onTogglePause}
            aria-label={paused ? 'تشغيل الانتقال التلقائي' : 'إيقاف الانتقال التلقائي'}
            title={paused ? 'تشغيل الانتقال التلقائي' : 'إيقاف الانتقال التلقائي'}
          >
            {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
          </button>
        )}
      </div>

      <div className="qz-superr-roman-list">
        {items.map((item, idx) => {
          const isActive = idx === activeIndex
          return (
            <button
              key={item.label}
              type="button"
              className="qz-superr-roman-row"
              data-active={isActive ? 'true' : undefined}
              style={{ '--row-accent': accent }}
              onClick={() => {
                playGlassTap()
                onSelect(idx)
              }}
            >
              <span className="qz-superr-roman-num">{ROMAN[idx]}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── ألوان أغلفة الدفاتر ─────────────────────────────────────────────── */
function getCoverPalette(style) {
  switch (style) {
    case 'blue-clouds':
      return {
        backgroundColor: '#3b82f6',
        backgroundImage:
          'radial-gradient(circle at 22% 24%, #fdfbf9 0%, #fdfbf9 14%, transparent 15%), radial-gradient(circle at 32% 26%, #fdfbf9 0%, #fdfbf9 11%, transparent 12%), radial-gradient(circle at 76% 72%, #fdfbf9 0%, #fdfbf9 13%, transparent 14%), radial-gradient(circle at 66% 74%, #fdfbf9 0%, #fdfbf9 10%, transparent 11%)',
        color: '#fdfbf9',
      }
    case 'rose-pink':
      return {
        backgroundColor: '#f472b6',
        backgroundImage:
          'radial-gradient(circle at 78% 20%, rgba(253,251,249,0.34) 0%, transparent 38%)',
        color: '#171717',
      }
    case 'sprout-green':
      return {
        backgroundColor: '#22c55e',
        color: '#171717',
      }
    case 'brown-leather':
    default:
      return {
        backgroundColor: '#5c3419',
        backgroundImage:
          'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.08), transparent 55%)',
        color: '#fdfbf9',
      }
  }
}

/* ── شريط الرسومات الحبرية اليدوية 1.5px #171717 (المشهد 6) ───────────── */
const DOODLE_CARDS = [
  {
    id: 'all',
    label: 'كل دفاترك وأفكارك في مكان واحد',
    svg: (
      <svg viewBox="0 0 110 86" className="h-20 w-24" fill="none" aria-hidden="true">
        <rect x="20" y="18" width="46" height="58" rx="6" transform="rotate(-7 20 18)" stroke="#171717" strokeWidth="1.6" fill="#fdfbf9" />
        <rect x="38" y="12" width="46" height="58" rx="6" transform="rotate(6 38 12)" stroke="#171717" strokeWidth="1.6" fill="#f7efe9" />
        <line x1="48" y1="28" x2="72" y2="30" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="47" y1="38" x2="68" y2="40" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'feel',
    label: 'ملمس الورق الحقيقي وحبر الدفاتر',
    svg: (
      <svg viewBox="0 0 110 86" className="h-20 w-24" fill="none" aria-hidden="true">
        <rect x="18" y="18" width="54" height="54" rx="4" stroke="#171717" strokeWidth="1.6" fill="#fdfbf9" />
        <path d="M26 34 C 36 30, 44 38, 60 34" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M26 46 C 40 44, 48 50, 58 46" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M68 20 L88 64 L80 68 L60 24 Z" fill="#fdfbf9" stroke="#171717" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'undo',
    label: 'تعديل ومحو بمرونة تامة',
    svg: (
      <svg viewBox="0 0 110 86" className="h-20 w-24" fill="none" aria-hidden="true">
        <path
          d="M78 52 C 74 26, 36 22, 26 44 M26 44 L22 31 M26 44 L39 43"
          stroke="#171717"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="58" y="54" width="26" height="14" rx="3" transform="rotate(-14 58 54)" fill="#f7efe9" stroke="#171717" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: 'kit',
    label: 'علبة هندسة كاملة للرسم والتخطيط',
    svg: (
      <svg viewBox="0 0 110 86" className="h-20 w-24" fill="none" aria-hidden="true">
        <rect x="16" y="24" width="76" height="44" rx="6" fill="#fdfbf9" stroke="#171717" strokeWidth="1.6" />
        <polygon points="28,58 52,58 28,34" fill="#f7efe9" stroke="#171717" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="70" cy="46" r="11" stroke="#171717" strokeWidth="1.5" />
        <line x1="20" y1="30" x2="88" y2="30" stroke="#171717" strokeWidth="1.2" strokeDasharray="3 3" />
      </svg>
    ),
  },
  {
    id: 'infinite',
    label: 'صفحات ومساحات حرة بلا حدود',
    svg: (
      <svg viewBox="0 0 110 86" className="h-20 w-24" fill="none" aria-hidden="true">
        <rect x="16" y="22" width="36" height="48" rx="4" transform="rotate(-6 16 22)" fill="#fdfbf9" stroke="#171717" strokeWidth="1.6" />
        <rect x="36" y="18" width="36" height="48" rx="4" fill="#f7efe9" stroke="#171717" strokeWidth="1.6" />
        <rect x="56" y="20" width="36" height="48" rx="4" transform="rotate(6 56 20)" fill="#fdfbf9" stroke="#171717" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: 'refs',
    label: 'خزانة متكاملة من المراجع والكتب',
    svg: (
      <svg viewBox="0 0 110 86" className="h-20 w-24" fill="none" aria-hidden="true">
        <rect x="20" y="16" width="16" height="52" rx="2" fill="#fdfbf9" stroke="#171717" strokeWidth="1.6" />
        <rect x="38" y="22" width="16" height="46" rx="2" fill="#f7efe9" stroke="#171717" strokeWidth="1.6" />
        <rect x="56" y="14" width="16" height="54" rx="2" fill="#fdfbf9" stroke="#171717" strokeWidth="1.6" />
        <rect x="74" y="20" width="14" height="48" rx="2" transform="rotate(-5 74 20)" fill="#f7efe9" stroke="#171717" strokeWidth="1.6" />
        <line x1="12" y1="69" x2="98" y2="69" stroke="#171717" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function IdeasCastle() {
  const theme = useTheme()
  const activeMood = THEME_META[theme] || THEME_META.green

  const [notebooks, setNotebooks] = useState(loadSavedNotebooks)
  const [selectedCategory, setSelectedCategory] = useState('كل الدفاتر')

  // حالات المشاهد التفاعلية الثلاثة (I – V)
  const [meadowIdx, setMeadowIdx] = useState(0)
  const [meadowPaused, setMeadowPaused] = useState(false)
  const [skyIdx, setSkyIdx] = useState(0)
  const [pinkIdx, setPinkIdx] = useState(0)

  // حالة نافذة <dialog> الأصلية للقراءة والتدوين
  const dialogRef = useRef(null)
  const [dialogMode, setDialogMode] = useState(null) // 'read' | 'create' | null
  const [activeNotebook, setActiveNotebook] = useState(null)

  const [formTitle, setFormTitle] = useState('')
  const [formClass, setFormClass] = useState('بذور الحلقات')
  const [formSummary, setFormSummary] = useState('')
  const [formQuote, setFormQuote] = useState('')
  const [formCover, setFormCover] = useState('brown-leather')

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks))
    } catch {
      /* ignore */
    }
  }, [notebooks])

  // تشغيل تلقائي هادئ لمشهد المرج يمكن إيقافه بالزر أو مع prefers-reduced-motion
  useEffect(() => {
    if (meadowPaused) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = window.setInterval(() => {
      setMeadowIdx((i) => (i + 1) % MEADOW_FEATURES.length)
    }, 4800)
    return () => window.clearInterval(timer)
  }, [meadowPaused])

  // بديل Safari الرسمي للضغط خارج <dialog> عند غياب closedBy (من دليل light-dismiss-a-dialog)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return undefined

    let pressedOutside = false
    const isOutside = (e) => {
      const rect = dialog.getBoundingClientRect()
      return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom
    }
    const onPointerDown = (e) => {
      pressedOutside = isOutside(e)
    }
    const onPointerUp = (e) => {
      if (pressedOutside && isOutside(e)) dialog.close()
    }
    dialog.addEventListener('pointerdown', onPointerDown)
    dialog.addEventListener('pointerup', onPointerUp)
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown)
      dialog.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  const openReadDialog = useCallback((nb) => {
    playGlassTap()
    setActiveNotebook(nb)
    setDialogMode('read')
    dialogRef.current?.showModal()
  }, [])

  const openCreateDialog = useCallback(() => {
    playGlassTap()
    setDialogMode('create')
    dialogRef.current?.showModal()
  }, [])

  const handleDialogClose = useCallback(() => {
    const dialog = dialogRef.current
    if (dialog) dialog.returnValue = ''
    setDialogMode(null)
    setActiveNotebook(null)
  }, [])

  const filteredNotebooks = useMemo(() => {
    if (selectedCategory === 'كل الدفاتر') return notebooks
    return notebooks.filter((n) => n.category === selectedCategory)
  }, [notebooks, selectedCategory])

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (!formTitle.trim() || !formSummary.trim()) return
    playGlassTap()

    const nextRoll = String(notebooks.length + 1).padStart(2, '0')
    const created = {
      id: `nb-user-${Date.now()}`,
      rollNo: nextRoll,
      studentName: 'أحمد قاسم',
      classLabel: `${formClass} · مسودة جديدة`,
      category: formClass,
      title: formTitle.trim(),
      handCaption: 'مسودة طازجة في قاع الأفكار',
      tilt: notebooks.length % 2 === 0 ? '-5.5deg' : '5.5deg',
      coverStyle: formCover,
      pencilColor: '#ff6f1e',
      pages: '١٢ صفحة بيضاء · مسودة بِكر',
      summary: formSummary.trim(),
      marginNotes: [
        'أُضيفت مباشرة إلى رف دفاتر قاع الأفكار.',
        formQuote.trim() || 'فكرة مفتوحة قابلة للنمو إلى مقال أو حلقة كاملة.',
      ],
      sketchQuote: formQuote.trim() || '«بداية الفكرة أجمل حين تُكتب بخط اليد.»',
    }

    setNotebooks((prev) => [created, ...prev])
    setFormTitle('')
    setFormSummary('')
    setFormQuote('')
    setActiveNotebook(created)
    setDialogMode('read')
  }

  const activeMeadow = MEADOW_FEATURES[meadowIdx]
  const activeSky = SKY_FEATURES[skyIdx]
  const activePink = PINK_FEATURES[pinkIdx]

  return (
    <div className="qz-superr-page" data-superr-mood={theme} dir="rtl">
      {/* ── الشريط الداخلي البسيط + حالة الثيم المندمج ─────────────── */}
      <div className="qz-superr-container">
        <div className="qz-superr-topstrip">
          <Link to="/" className="qz-superr-brandmark" aria-label="العودة للرئيسية — قاسمز">
            <HandBrandMark />
            <span className="font-[family-name:var(--font-geist)] text-sm font-semibold text-[#2b1a07]">
              قاع الأفكار · مسودات الورق
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="qz-superr-mood-badge" title="يمكنك تغيير المزاج من زر التبديل في النافبار العلوي">
              <span className="qz-superr-mood-dot" aria-hidden="true" />
              <span>{activeMood.label}</span>
            </span>
            <button type="button" onClick={openCreateDialog} className="qz-superr-btn">
              <Plus className="size-4" aria-hidden="true" />
              <span>أضف فكرتك</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══ المشهد 1: الافتتاحية غير المتماثلة + الدفتر البني المائل ════ */}
      <section className="qz-superr-container" aria-label="واجهة قاع الأفكار">
        <div className="qz-superr-hero">
          <div className="flex flex-col items-start">
            <span className="qz-superr-caption mb-3 -rotate-2">
              رسالة إلى صُنّاع الحكايات،
            </span>

            <h1 className="qz-superr-display">
              قاع
              <br />
              الأفكار
            </h1>

            <p className="qz-superr-body mt-6 max-w-xl">
              دفاتر ورقية مفتوحة لمسودات الحلقات، بذور السينما، والأسئلة التي تولد على
              الهامش — كُتبت بحبرٍ هادئ وتُقرأ بـ{' '}
              <MarkerHighlight>شغف!</MarkerHighlight>
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button type="button" onClick={openCreateDialog} className="qz-superr-btn">
                دوّن فكرة في الدفتر +
              </button>
              <a href="#ideas-archive-shelf" className="qz-superr-btn">
                تصفّح كل الدفاتر ↓
              </a>
            </div>

            <p className="qz-superr-preorder">
              {notebooks.length} دفاتر مفتوحة للقراءة · تتجدّد مع كل مسودة ومقال وحلقة.
            </p>
          </div>

          {/* الجانب البصري: الدفتر البني المائل + القلم الرصاص + استيكر الاسم */}
          <div className="qz-superr-hero-stage">
            <div className="mb-3 flex items-center gap-2 self-end">
              <span className="qz-superr-caption text-lg">افتح الدفتر الأول</span>
              <CharcoalCurvedArrow className="w-11" />
            </div>

            <button
              type="button"
              className="qz-superr-hero-notebook-shell"
              onClick={() => openReadDialog(notebooks[0])}
              aria-label={`افتح دفتر ${notebooks[0].title}`}
            >
              {/* قلم رصاص متكئ بجانب الدفتر */}
              <PencilProp
                color="#facc15"
                className="pointer-events-none absolute -left-5 top-10 z-20 -rotate-[8deg] drop-shadow-sm max-sm:left-0"
              />

              <div className="qz-superr-leather-cover">
                <div className="flex items-center justify-between text-xs font-semibold text-[#fdfbf9]/80">
                  <span className="qz-latin">QASSIMZ PARCHI</span>
                  <span>{notebooks[0].category}</span>
                </div>

                <NameLabelSticker
                  name={notebooks[0].studentName}
                  classLabel={notebooks[0].classLabel}
                  rollNo={notebooks[0].rollNo}
                />

                <div className="flex items-end justify-between gap-3 pt-2 text-[#fdfbf9]">
                  <div>
                    <p className="text-lg font-semibold leading-snug">{notebooks[0].title}</p>
                    <p className="mt-1 text-xs text-[#fdfbf9]/80">{notebooks[0].pages}</p>
                  </div>
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#fdfbf9]/35 bg-[#fdfbf9]/10 text-xs"
                    aria-hidden="true"
                  >
                    ✋
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* مقتطف الحركة الصغير أسفل الافتتاحية (00:02–00:03 في الفيديو) */}
        <div className="qz-superr-subhero-strip">
          <div className="qz-superr-sketch-frame">
            <svg viewBox="0 0 260 140" className="h-full w-full p-4" fill="none" aria-hidden="true">
              <circle cx="52" cy="56" r="22" stroke="#171717" strokeWidth="1.6" />
              <path d="M52 78 C 52 102, 74 114, 96 114" stroke="#171717" strokeWidth="1.6" strokeLinecap="round" />
              <rect x="122" y="28" width="110" height="80" rx="8" fill="#fdfbf9" stroke="#171717" strokeWidth="1.6" />
              <path d="M138 56 H214 M138 74 H196" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="204" cy="82" r="10" fill="#ff6f1e" stroke="#171717" strokeWidth="1.5" />
            </svg>
          </div>
          <p className="qz-superr-body max-w-lg text-[18px]">
            من كلمة وحيدة مسجّلة على ورقة هامشية، إلى تخطيط كادر وصوت ومقال كامل — كل دفتر هنا
            يفتح لك كواليس الفكرة وهي ما زالت طازجة.
          </p>
        </div>
      </section>

      {/* ══ المشهد 2: وقفة تنفّس طباعية بالمنتصف (00:03–00:05) ═══════════ */}
      <section className="qz-superr-container qz-superr-statement" aria-label="رسالة قاع الأفكار">
        <h2 className="qz-superr-heading-lg">
          كل المسودات التي تبحث عن شرارة.
          <br />
          بلا ضجيجٍ يسرق متعة التفكير.
        </h2>
      </section>

      {/* ══ المشهد 3: بانوراما المرج الأخضر + دفتر الجلد المفتوح + بطاقة I–V */}
      <section className="qz-superr-panorama qz-superr-panorama-meadow" aria-label="أشبه بورق سحري">
        {/* طبقة الأزهار البرية أسفل المشهد */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-90"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 95 Q 160 70 320 92 T 640 88 T 960 95 T 1200 84 V 120 H 0 Z" fill="#1b5e20" />
          {[
            [90, 88, '#fdfbf9'],
            [170, 96, '#fde047'],
            [290, 92, '#ff66cf'],
            [420, 86, '#fdfbf9'],
            [560, 98, '#fde047'],
            [720, 89, '#fdfbf9'],
            [860, 94, '#ff66cf'],
            [1010, 87, '#fdfbf9'],
            [1120, 93, '#fde047'],
          ].map(([cx, cy, fill], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="5.5" fill={fill} stroke="#171717" strokeWidth="1.2" />
              <circle cx={cx} cy={cy} r="1.8" fill="#171717" />
            </g>
          ))}
        </svg>

        <div className="qz-superr-container qz-superr-panorama-grid">
          {/* الدفتر المفتوح ذو الصفحتين */}
          <div className="qz-superr-open-book" data-cover="leather">
            <div className="qz-superr-open-spread">
              <div className="qz-superr-spread-spine" aria-hidden="true" />
              <div className="qz-superr-spread-page">
                <div>
                  <span className="inline-block rounded-full border border-[#171717] bg-[#f7efe9] px-3 py-1 font-[family-name:var(--font-geist)] text-xs font-semibold text-[#171717]">
                    {activeMeadow.leftTag}
                  </span>
                  <h4 className="mt-4 text-2xl font-bold text-[#2b1a07]">{activeMeadow.leftTitle}</h4>
                  <p className="mt-3 text-[16px] leading-relaxed text-[#414141]">{activeMeadow.leftBody}</p>
                </div>
                <p className="font-[family-name:var(--font-geist)] text-xs font-semibold text-[#ce500a]">
                  صفحة ١٤ · دفتر المرج الأخضر
                </p>
              </div>

              <div className="qz-superr-spread-page">
                <div className="rounded-xl border-[1.5px] border-dashed border-[#171717]/40 bg-[#f7efe9]/75 p-4">
                  <p className="text-xs font-bold text-[#22c55e]">ملاحظة هامش باليد</p>
                  <p className="mt-2 text-[16px] font-semibold leading-relaxed text-[#2b1a07]">
                    {activeMeadow.rightNote}
                  </p>
                </div>
                <div className="mt-3 rounded-xl border border-[#171717]/20 bg-[#fdfbf9] p-3 text-center">
                  <Sticker type="sprout" size={38} rotate="-8deg" className="mx-auto" />
                  <p className="mt-1 font-[family-name:var(--font-geist)] text-xs text-[#5b5753]">
                    {activeMeadow.doodleCaption}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <RomanFeatureCard
            prefix="أشبه"
            highlight="بورقٍ سحري"
            accent="#22c55e"
            items={MEADOW_FEATURES}
            activeIndex={meadowIdx}
            onSelect={setMeadowIdx}
            paused={meadowPaused}
            onTogglePause={() => setMeadowPaused((p) => !p)}
          />
        </div>
      </section>

      {/* ══ المشهد 4: بانوراما السماء الزرقاء + مكتبة الأغلفة + بطاقة I–V ═ */}
      <section className="qz-superr-panorama qz-superr-panorama-sky" aria-label="دفاتر أفكار تحاورك">
        <div className="qz-superr-container qz-superr-panorama-grid is-reversed">
          <RomanFeatureCard
            prefix="دفاتر أفكار"
            highlight="تحاورك فعلاً"
            accent="#3b82f6"
            items={SKY_FEATURES}
            activeIndex={skyIdx}
            onSelect={setSkyIdx}
          />

          <div className="qz-superr-open-book" data-cover="sky">
            <div className="qz-superr-open-spread">
              <div className="qz-superr-spread-spine" aria-hidden="true" />
              <div className="qz-superr-spread-page">
                <div>
                  <p className="font-[family-name:var(--font-geist)] text-xs font-bold text-[#3b82f6]">
                    {ROMAN[skyIdx]} · مكتبة قاع الأفكار
                  </p>
                  <h4 className="mt-2 text-2xl font-bold text-[#2b1a07]">رفّ الدفاتر المفتوحة</h4>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#414141]">{activeSky.prompt}</p>
                </div>

                <div className="rounded-xl border border-[#171717] bg-[#f7efe9] p-3 text-xs font-medium text-[#2b1a07]">
                  اضغط على أي غلاف صغير في الصفحة المقابلة لفتح الدفتر بالكامل وقراءة هوامشه.
                </div>
              </div>

              <div className="qz-superr-spread-page">
                <div className="qz-superr-mini-grid">
                  {notebooks.slice(0, 6).map((nb) => {
                    const cov = getCoverPalette(nb.coverStyle)
                    return (
                      <button
                        key={nb.id}
                        type="button"
                        onClick={() => openReadDialog(nb)}
                        className="qz-superr-mini-cover"
                        style={cov}
                        aria-label={`افتح دفتر ${nb.title}`}
                      >
                        <span className="qz-latin text-[10px] font-bold opacity-85">#{nb.rollNo}</span>
                        <span className="line-clamp-3 text-[11px] font-bold leading-tight">{nb.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ المشهد 5: المفرش المخطط الدافئ + بسكويت QASSIMZ + الدفتر الوردي ═ */}
      <section className="qz-superr-panorama qz-superr-panorama-tablecloth" aria-label="رفيق إبداعي يسند خيالك">
        <div className="qz-superr-container qz-superr-panorama-grid">
          <div className="relative">
            {/* طبق البسكويت الزخرفي المرسوم على المفرش بجانب الدفتر */}
            <div
              className="pointer-events-none mb-4 hidden items-center gap-3 md:flex"
              aria-hidden="true"
            >
              <span className="inline-flex size-16 items-center justify-center rounded-full border-[1.5px] border-[#171717] bg-[#e5be8a] text-[10px] font-bold text-[#5c3419] shadow-sm">
                QASSIMZ
              </span>
              <span className="inline-flex size-14 -rotate-6 items-center justify-center rounded-full border-[1.5px] border-[#171717] bg-[#ecc997] text-[10px] font-bold text-[#5c3419] shadow-sm">
                فكرة!
              </span>
              <Sticker type="heart" size={44} rotate="12deg" />
            </div>

            <div className="qz-superr-open-book" data-cover="pink">
              <div className="qz-superr-open-spread">
                <div className="qz-superr-spread-spine" aria-hidden="true" />
                <div className="qz-superr-spread-page">
                  <div>
                    <span className="inline-block rounded-full border border-[#171717] bg-[#fce7f3] px-3 py-1 text-xs font-bold text-[#171717]">
                      سؤال الطاولة · {ROMAN[pinkIdx]}
                    </span>
                    <h4 className="mt-4 text-xl font-bold leading-snug text-[#2b1a07]">
                      {activePink.question}
                    </h4>
                  </div>
                  <p className="font-[family-name:var(--font-geist)] text-xs text-[#5b5753]">
                    رفيق كتابة ومونتاج صامت
                  </p>
                </div>

                <div className="qz-superr-spread-page">
                  <div>
                    <p className="text-xs font-bold text-[#db2777]">إشارة الرفيق</p>
                    <p className="mt-2 text-[16px] leading-relaxed text-[#414141]">{activePink.hint}</p>
                  </div>
                  <button type="button" onClick={openCreateDialog} className="qz-superr-btn w-full">
                    دوّن إجابتك كدفتر جديد +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <RomanFeatureCard
            prefix="رفيق إبداعي"
            highlight="يسند خيالك"
            accent="#ff66cf"
            items={PINK_FEATURES}
            activeIndex={pinkIdx}
            onSelect={setPinkIdx}
          />
        </div>
      </section>

      {/* ══ المشهد 6: شبكة الرسومات الحبرية اليدوية 1.5px #171717 (00:13–00:15) ═ */}
      <section className="qz-superr-container qz-superr-doodles-section" aria-label="تفاصيل أروع بالحبر">
        <div className="text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            <h2 className="qz-superr-heading-lg">وهناك تفاصيل أروع</h2>
            <span className="inline-flex flex-col items-center">
              <span className="qz-superr-caption -rotate-6 text-2xl font-bold">بكثييير!</span>
              <CharcoalCurvedArrow className="-mt-1 w-10" />
            </span>
          </div>
        </div>

        <div className="qz-superr-doodles-stage">
          {DOODLE_CARDS.map((card) => (
            <div key={card.id} className="qz-superr-doodle-item">
              {card.svg}
              <p className="max-w-[200px] text-[17px] font-medium leading-snug text-[#2b1a07]">
                {card.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ المشهد 7: ورقة «قائمة اللا» المسطّرة الممزقة + 4 استيكرات ═════════ */}
      <section className="qz-superr-container qz-superr-nolist-section" aria-label="قائمة الأمان والنقاء">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="qz-superr-heading-lg">مساحة نقية وآمنة للتفكير</h2>
          <p className="qz-superr-body mt-4 text-[18px]">
            صُمّمت من البداية لتكون غرفة قراءة وتجريب هادئة تُشعل الفضول دون ضجيج الشبكات.
          </p>
        </div>

        <div className="qz-superr-nolist-stage">
          <div className="qz-superr-sticker-col">
            <div className="qz-superr-sticker-badge">
              <Sticker type="ribbon" size={56} rotate="-11deg" className="qz-superr-float-soft" />
              <span className="text-sm font-medium text-[#414141]">نقية وخالية تماماً من الإعلانات</span>
            </div>
            <div className="qz-superr-sticker-badge">
              <Sticker type="star" size={54} rotate="12deg" className="qz-superr-float-delayed" />
              <span className="text-sm font-medium text-[#414141]">لصُنّاع الأسئلة والفضوليين</span>
            </div>
          </div>

          {/* الورقة المسطّرة بالهامش الأحمر المزدوج وعلامات ✗ */}
          <div className="qz-superr-ruled-sheet">
            <div className="qz-superr-sheet-holes" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="qz-superr-sheet-hole" />
              ))}
            </div>
            <ul className="space-y-1">
              {NO_LIST_PROMISES.map((line) => (
                <li key={line} className="qz-superr-no-item">
                  <span className="font-bold text-[#ff6f1e]" aria-hidden="true">
                    ✗
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="qz-superr-sticker-col">
            <div className="qz-superr-sticker-badge">
              <Sticker type="bulb" size={56} rotate="9deg" className="qz-superr-float-delayed" />
              <span className="text-sm font-medium text-[#414141]">تُشعل الشرارة الأولى للفكرة</span>
            </div>
            <div className="qz-superr-sticker-badge">
              <Sticker type="heart" size={52} rotate="-9deg" className="qz-superr-float-soft" />
              <span className="text-sm font-medium text-[#414141]">تُحبّها العقول والهوامش</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ المشهد 8: دفاتر العرض الثنائية («دفترنا الخاص. بطريقتنا الخاصة.») ═ */}
      <section className="qz-superr-container qz-superr-dual-showcase" aria-label="اصنع دفترك بطريقتك">
        <div className="qz-superr-dual-grid">
          {/* الدفتر الأزرق بسحبه البيضاء وقلم التخطيط */}
          <div className="flex flex-col items-center">
            <div className="mb-3 flex items-center gap-2 self-end">
              <span className="qz-superr-caption text-lg">دفتر السحاب الأزرق الكبير</span>
              <CharcoalCurvedArrow className="w-10" />
            </div>

            <button
              type="button"
              onClick={() => openReadDialog(notebooks[1] || notebooks[0])}
              className="qz-superr-notebook-tile -rotate-[6.5deg]"
              style={getCoverPalette('blue-clouds')}
              aria-label={`افتح دفتر ${notebooks[1]?.title || ''}`}
            >
              <PencilProp
                color="#3b82f6"
                className="pointer-events-none absolute -right-5 top-10 rotate-[5deg]"
              />
              <span className="qz-latin text-xs font-bold opacity-85">CLOUD PARCHI</span>
              <NameLabelSticker
                name={notebooks[1]?.studentName || 'أحمد قاسم'}
                classLabel={notebooks[1]?.classLabel || 'أرشيف المدن'}
                rollNo={notebooks[1]?.rollNo || '02'}
              />
              <p className="text-lg font-bold leading-snug">{notebooks[1]?.title}</p>
            </button>
          </div>

          {/* الوسط: استيكرات مبعثرة + مثل صناعة / دفترنا الخاص */}
          <div className="relative flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex items-center justify-center gap-5">
              <Sticker type="cloud-buddy" size={56} rotate="-12deg" />
              <Sticker type="bear" size={50} rotate="9deg" />
              <Sticker type="ghost" size={48} rotate="-8deg" />
            </div>
            <span className="qz-superr-caption -rotate-3">مثل صناعة</span>
            <h2 className="qz-superr-heading-lg mt-2">
              دفترنا الخاص.
              <br />
              بطريقتنا الخاصة.
            </h2>
            <button type="button" onClick={openCreateDialog} className="qz-superr-btn mt-6">
              أضف مسودتك الآن +
            </button>
          </div>

          {/* الدفتر الوردي وقلم الحبر الأبيض واستيكر القلب */}
          <div className="flex flex-col items-center">
            <div className="mb-3 flex items-center gap-2 self-start">
              <CharcoalCurvedArrow flip className="w-10" />
              <span className="qz-superr-caption text-lg">وردي لطيف + قلم حبر!</span>
            </div>

            <button
              type="button"
              onClick={() => openReadDialog(notebooks[2] || notebooks[0])}
              className="qz-superr-notebook-tile rotate-[6.5deg]"
              style={getCoverPalette('rose-pink')}
              aria-label={`افتح دفتر ${notebooks[2]?.title || ''}`}
            >
              <PencilProp
                variant="whitepen"
                className="pointer-events-none absolute -left-5 top-12 -rotate-[4deg]"
              />
              <span className="qz-latin text-xs font-bold opacity-80">PINK DRAFTS</span>
              <NameLabelSticker
                name={notebooks[2]?.studentName || 'أحمد قاسم'}
                classLabel={notebooks[2]?.classLabel || 'تشريح مشهد'}
                rollNo={notebooks[2]?.rollNo || '03'}
                cornerHeart
              />
              <p className="text-lg font-bold leading-snug">{notebooks[2]?.title}</p>
            </button>
          </div>
        </div>
      </section>

      {/* ══ رف الأرشيف التفاعلي الكامل (فلترة وقراءة جميع الدفاتر) ═════════ */}
      <section id="ideas-archive-shelf" className="qz-superr-container qz-superr-shelf-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="qz-superr-caption text-lg">الأرشيف المفتوح</span>
            <h2 className="qz-superr-heading mt-1">تصفّح كل الدفاتر والمسودات</h2>
          </div>

          <div className="flex flex-wrap gap-2.5" role="group" aria-label="تصنيفات الدفاتر">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className="qz-superr-tag"
                data-active={selectedCategory === cat ? 'true' : undefined}
                onClick={() => {
                  playGlassTap()
                  setSelectedCategory(cat)
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="qz-superr-grid">
          {filteredNotebooks.map((nb) => {
            const cover = getCoverPalette(nb.coverStyle)
            return (
              <button
                key={nb.id}
                type="button"
                onClick={() => openReadDialog(nb)}
                className="qz-superr-notebook-tile"
                style={{ ...cover, transform: `rotate(${nb.tilt || '-4deg'})` }}
              >
                <div className="flex items-center justify-between text-xs font-semibold opacity-80">
                  <span>{nb.category}</span>
                  <span className="qz-latin">#{nb.rollNo}</span>
                </div>

                <NameLabelSticker
                  name={nb.studentName}
                  classLabel={nb.classLabel}
                  rollNo={nb.rollNo}
                />

                <div>
                  <h3 className="text-xl font-bold leading-snug">{nb.title}</h3>
                  <p className="mt-1.5 text-xs opacity-80">{nb.pages}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ══ الفوتر البرتقالي الممتد 56px Top Asymmetric Radius ══════════════ */}
      <footer className="qz-superr-footer-band" dir="rtl">
        <div className="qz-superr-container flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-3 rounded-2xl border-[1.5px] border-[#171717] bg-[#fdfbf9] px-4 py-2 text-[#171717]">
              <HandBrandMark />
              <span className="font-bold">قاع الأفكار — قاسمز</span>
            </div>
            <h2 className="mt-5 text-3xl font-bold leading-snug text-[#fdfbf9] sm:text-4xl">
              خلصنا القراءة… ولسّه في الدفتر صفحات كتير.
            </h2>
            <p className="mt-3 text-base text-[#fdfbf9]/90">
              كل فكرة تُولد هنا تُختم بحبر الورق وتكمل رحلتها في الفيديوهات والمقالات والحكايات.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end">
            <nav aria-label="روابط سريعة" className="flex flex-wrap gap-x-6 gap-y-2">
              <Link to="/" className="qz-superr-footer-link">
                الرئيسية
              </Link>
              <Link to="/stories" className="qz-superr-footer-link">
                الحكايات
              </Link>
              <Link to="/articles" className="qz-superr-footer-link">
                المقالات
              </Link>
              <Link to="/verdict/movies" className="qz-superr-footer-link">
                الفِردِكت
              </Link>
              <Link to="/masaha/ahmed" className="qz-superr-footer-link">
                عن أحمد
              </Link>
            </nav>
            <p className="font-[family-name:var(--font-geist)] text-xs font-medium text-[#fdfbf9]/85">
              © {new Date().getFullYear()} قاسمز — قاع الأفكار
            </p>
          </div>
        </div>
      </footer>

      {/* ══ النافذة الحوارية الأصلية <dialog> (ShowModal + Light Dismiss) ════ */}
      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby="superr-dialog-title"
        className="superr-dialog"
        onClose={handleDialogClose}
        dir="rtl"
      >
        {dialogMode === 'read' && activeNotebook && (
          <div className="superr-dialog-scroll">
            <div className="flex items-start justify-between gap-4 border-b border-[#171717]/15 pb-4">
              <div>
                <span className="inline-block rounded-full border border-[#171717] bg-[#f7efe9] px-3 py-1 text-xs font-bold text-[#171717]">
                  دفتر رقم #{activeNotebook.rollNo} · {activeNotebook.category}
                </span>
                <h1 id="superr-dialog-title" className="mt-3 text-2xl font-bold text-[#2b1a07] sm:text-3xl">
                  {activeNotebook.title}
                </h1>
              </div>
              <form method="dialog">
                <button
                  type="submit"
                  autoFocus
                  className="qz-superr-pause-btn"
                  aria-label="إغلاق الدفتر"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </form>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-[240px_1fr]">
              <div className="space-y-4">
                <NameLabelSticker
                  name={activeNotebook.studentName}
                  classLabel={activeNotebook.classLabel}
                  rollNo={activeNotebook.rollNo}
                />
                <div className="rounded-xl border-[1.5px] border-[#171717] bg-[#f7efe9] p-4">
                  <p className="text-xs font-bold text-[#ff6f1e]">اقتباس مفتاحي</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#2b1a07]">
                    {activeNotebook.sketchQuote}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-[#171717]/20 bg-[#ffffff] p-5">
                  <h2 className="text-base font-bold text-[#2b1a07]">ملخص المسودة</h2>
                  <p className="mt-2 text-[17px] leading-relaxed text-[#414141]">
                    {activeNotebook.summary}
                  </p>
                </div>

                <div className="rounded-xl border border-[#171717]/20 bg-[#fdfbf9] p-5">
                  <h2 className="text-base font-bold text-[#2b1a07]">هوامش الحبر والملاحظات</h2>
                  <ul className="mt-3 space-y-2.5 text-[16px] leading-relaxed text-[#414141]">
                    {activeNotebook.marginNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-[#ff6f1e]" aria-hidden="true" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {dialogMode === 'create' && (
          <div className="superr-dialog-scroll">
            <div className="flex items-start justify-between gap-4 border-b border-[#171717]/15 pb-4">
              <div>
                <span className="qz-superr-caption text-base">دفتر جديد</span>
                <h1 id="superr-dialog-title" className="mt-1 text-2xl font-bold text-[#2b1a07]">
                  دوّن فكرة جديدة في قاع الأفكار
                </h1>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="qz-superr-pause-btn"
                aria-label="إغلاق النموذج"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="superr-idea-title" className="mb-1.5 block text-sm font-bold text-[#2b1a07]">
                  عنوان الدفتر أو الشرارة الأولى
                </label>
                <input
                  id="superr-idea-title"
                  type="text"
                  autoFocus
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: لماذا يبدو المطر أهدأ في عدسة السينما؟"
                  className="qz-superr-input"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="superr-idea-cat" className="mb-1.5 block text-sm font-bold text-[#2b1a07]">
                    التصنيف
                  </label>
                  <select
                    id="superr-idea-cat"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="qz-superr-input"
                  >
                    <option value="بذور الحلقات">بذور الحلقات</option>
                    <option value="تأملات سينمائية">تأملات سينمائية</option>
                    <option value="مسودات لم تكتمل">مسودات لم تكتمل</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="superr-idea-cover" className="mb-1.5 block text-sm font-bold text-[#2b1a07]">
                    لون غلاف الدفتر
                  </label>
                  <select
                    id="superr-idea-cover"
                    value={formCover}
                    onChange={(e) => setFormCover(e.target.value)}
                    className="qz-superr-input"
                  >
                    <option value="brown-leather">الجلد البني الكلاسيكي</option>
                    <option value="blue-clouds">السحاب الأزرق</option>
                    <option value="rose-pink">الوردي اللطيف</option>
                    <option value="sprout-green">الأخضر النابض</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="superr-idea-summary" className="mb-1.5 block text-sm font-bold text-[#2b1a07]">
                  تفاصيل الفكرة أو المسودة
                </label>
                <textarea
                  id="superr-idea-summary"
                  required
                  rows={4}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="اكتب كل ما يخطر ببالك بحرية كاملة..."
                  className="qz-superr-input"
                />
              </div>

              <div>
                <label htmlFor="superr-idea-quote" className="mb-1.5 block text-sm font-bold text-[#2b1a07]">
                  جملة هامشية أو اقتباس مفتاحي (اختياري)
                </label>
                <input
                  id="superr-idea-quote"
                  type="text"
                  value={formQuote}
                  onChange={(e) => setFormQuote(e.target.value)}
                  placeholder="جملة قصيرة تلخص مزاج الفكرة..."
                  className="qz-superr-input"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="qz-superr-btn"
                >
                  إلغاء
                </button>
                <button type="submit" className="qz-superr-btn">
                  حفظ في قاع الأفكار ✓
                </button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </div>
  )
}
