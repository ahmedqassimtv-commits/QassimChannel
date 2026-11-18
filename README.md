<p align="center">
  <img src="public/images/qassimz-logo.svg" alt="قَاسِمز" width="140" />
</p>

<h1 align="center">قَاسِمز — Qasimz</h1>

<p align="center">
  <strong>منصة محتوى عربية — فيديوهات، مراجعات، حكايات، كتب، ومقالات.</strong><br />
  واجهة RTL بالكامل، نافبار زجاجي بصري (LiquidGlass) بكبسولة ماء سائلة (Waterline)، ثلاثة ثيمات داكنة، وحركات بنوابض فيزيائية.
</p>

<p align="center">
  <a href="https://ahmedqassimtv-commits.github.io/QassimChannel/"><img src="https://img.shields.io/badge/🌐_العرض_الحي-QassimChannel-0F2A44?style=for-the-badge" alt="العرض الحي" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black&style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white&style=flat-square" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Framer_Motion-14-0055FF?logo=framer&logoColor=white&style=flat-square" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white&style=flat-square" alt="React Router" />
  <img src="https://img.shields.io/badge/Node-%3E%3D22.12-339933?logo=node.js&logoColor=white&style=flat-square" alt="Node" />
  <img src="https://img.shields.io/github/license/ahmedqassimtv-commits/QassimChannel?style=flat-square&color=green" alt="License" />
  <img src="https://img.shields.io/github/actions/workflow/status/ahmedqassimtv-commits/QassimChannel/deploy-pages.yml?style=flat-square&label=deploy" alt="Deploy" />
</p>

> [!NOTE]
> **أرشيف** — هذه لقطة من **16 نوفمبر 2026** للموقع القديم المبني بـ React + Vite.
> الموقع الحالي أُعيد بناؤه من الصفر بـ **Astro + GSAP + Lenis + Three.js** في
> [qassimz-platform](https://github.com/ahmedqassimtv-commits/qassimz-platform).
> النسخة هنا كاملة — بكل الخطوط والصور والصوت — وتعمل على
> [GitHub Pages](https://ahmedqassimtv-commits.github.io/QassimChannel/).

---

## 📖 المحتويات

- [✨ المميزات](#-المميزات)
- [🛠️ التقنيات](#️-التقنيات)
- [🗺️ الصفحات والمسارات](#️-الصفحات-والمسارات)
- [🎨 الثيمات](#-الثيمات)
- [🏗️ بنية المشروع](#️-بنية-المشروع)
- [🚀 التشغيل](#-التشغيل)
- [📦 الأوامر المتاحة](#-الأوامر-المتاحة)
- [🌐 النشر](#-النشر)
- [🎨 الأصول والهوية البصرية](#-الأصول-والهوية-البصرية)
- [🤝 المساهمة](#-المساهمة)
- [📄 الرخصة](#-الرخصة)

---

## ✨ المميزات

| الميزة | الوصف |
|---|---|
| 🧊 نافبار LiquidGlass البصري | سطح زجاجي بحواف Lissé Squircle وانكسار ضوئي `<feDisplacementMap>` وتشتت لوني (`Chromatic RGB Dispersion`) وإضاءة حافة (`Specular Rim`) مع تحسين 3-Slice Capsule Baking |
| 💧 كبسولة الماء السائلة (Waterline) | شيدر WebGL بفيزياء جسمين مقترنين — تتمدد القطرة نحو القسم المختار، وتنشطر إلى قطيرات تابعة في القفزات الطويلة ثم تندمج بموجة ارتطام، مع رفع Meniscus تحت المؤشر ومشاهد حركية للأيقونات |
| 🎨 ثلاثة ثيمات متناغمة | أخضر زمردي، أحمر جمري، وذهبي ملكي — محفوظة في `localStorage` وتُطبق قبل أول رسم مع تلون سلس لقطرة الماء السائلة |
| 🎬 الفِردِكت | مراجعات سينمائية ومسلسلات مع مبدّل أقسام مائي (Waterline) وقائمة مشاهدة محفوظة محليًا |
| 🧭 قسم مساحة (`MASAHA`) | قائمة منسدلة تجمع البث الحيّ (`أون إير`)، ومكتبة `الكتب والقصص`، وصفحة `عنّي` التفاعلية |
| 📺 فيديوهات | بطاقات فيديو مع مشغل YouTube خفيف عبر `react-lite-youtube-embed` |
| 🔍 بحث مضمّن سريع | حقل بحث قابل للتمدد داخل النافبار (`⌘K` / `Ctrl+K`) مع مؤشر تمييز مطاطي واقتراحات فورية |
| 🔊 محرك صوت | مؤثرات صوتية بـ Howler + Web Audio API مع نغمات زجاجية تفاعلية وتحكم بمستوى الصوت |
| 📱 RTL كامل | عربي بالكامل، اتجاه من اليمين لليسار، وخطوط عربية مخصصة مع وضع مصغّر تلقائي عند التمرير |
| 🎢 حركات نوابض | انتقالات فيزيائية بنوابض (Springs) عبر Framer Motion وفيزياء نوابض تحليلية |
| 🦥 تحميل كسول | تحميل الصفحات بشكل كسول مع جلب مسبق للمسارات (`prefetchRoute`) وتقسيم ذكي للحزم |
| 📜 تمرير سلس | تمرير ناعم فيزيائي عبر Lenis مع احترام `prefers-reduced-motion` و`prefers-reduced-transparency` |

---

## 🛠️ التقنيات

| الطبقة | التقنية | الغرض |
|---|---|---|
| ⚛️ واجهة | React 19 | مكتبة واجهة المستخدم |
| ⚡ بناء | Vite 8 (Rolldown) | أداة البناء السريعة |
| 🎨 تنسيق | Tailwind CSS 4 | أنماط المرافق (Utility-first CSS) |
| 🧩 مكونات | shadcn/ui + CVA | مكونات واجهة مرنة وقابلة للتخصيص |
| 🎬 حركة | Framer Motion 14 | رسوم متحركة وانتقالات فيزيائية |
| 🗺️ توجيه | React Router 7 | توجيه تطبيق الصفحة الواحدة (SPA) |
| 💎 زجاج بصري & WebGL | LiquidGlass + Waterline GLSL + liquid-gl | انكسار ضوئي بمرشحات SVG وشيدر كبسولة الماء السائلة عبر WebGL |
| 🔊 صوت | Howler + Web Audio | مؤثرات صوتية ومشغل البث |
| 📜 تمرير | Lenis | تمرير سلس فيزيائي |
| 📝 محتوى | react-markdown + remark-gfm | عرض مقالات Markdown |
| 🖼️ معرض | yet-another-react-lightbox | صندوق الضوء للصور |

---

## 🗺️ الصفحات والمسارات

| المسار | الصفحة | المكوّن |
|---|---|---|
| `/` | الرئيسية | `Home` |
| `/verdict/movies` | الفِردِكت — حُكم السينما | `Reviews` |
| `/verdict/series` | الفِردِكت — حُكم المسلسلات | `Reviews` |
| `/reviews` → `/verdict/movies` | إعادة توجيه تلقائية | — |
| `/stories` | أرشيف الحكايات | `Stories` |
| `/videos` | الفيديوهات | `Videos` |
| `/videos/shorts` | المقاطع القصيرة | `Videos` |
| `/articles` | المقالات | `Articles` |
| `/articles/:slug` | عرض مقال | `ArticleView` |
| `/masaha/on-air` | مساحة — أون إير (البث الحيّ) | `OnAir` |
| `/masaha/books` | مساحة — الكتب والقصص | `Books` |
| `/masaha/about` | مساحة — عنّي | `About` |
| `/on-air` → `/masaha/on-air` | إعادة توجيه تلقائية | — |
| `/about` → `/masaha/about` | إعادة توجيه تلقائية | — |
| `*` | إعادة توجيه للرئيسية | — |

---

## 🎨 الثيمات

| الثيم | الوصف | المفتاح | النمط |
|---|---|---|---|
| 🟢 الأخضر | الزمردي — الثيم الأصلي | `green` | داكن |
| 🔴 الأحمر | الجمري — تدرّج أحمر إلى كهرماني | `red` | داكن |
| 🟡 الذهبي | الذهبي الملكي — داكن بلمسات كهرمانية فاخرة | `gold` | داكن |

يُحفظ الاختيار في `localStorage` (المفتاح `qassimz:theme`) ويُطبق من سكربت مضمّن في `index.html` **قبل تحميل React** — بلا وميض (FOUC-free).

---

## 🏗️ بنية المشروع

```
QassimChannel/
├── .github/                    # GitHub Actions + قوالب المشكلات وطلبات السحب
│   ├── workflows/
│   │   └── deploy-pages.yml    # نشر تلقائي على GitHub Pages
│   ├── ISSUE_TEMPLATE/         # قوالب المشكلات (عربي)
│   └── PULL_REQUEST_TEMPLATE.md
│
├── public/                     # أصول ثابتة (لا تُعالج بالبناء)
│   ├── fonts/                  # خطوط عربية (OTF + WOFF2)
│   │   ├── thmanyahsans/       #   ثمانية Sans — 5 أوزان
│   │   ├── thmanyahserifdisplay/   ثمانية Serif Display — 5 أوزان
│   │   ├── thmanyahseriftext/  #   ثمانية Serif Text — 5 أوزان
│   │   ├── A Farhood/          #   خط A Farhood الزخرفي
│   │   └── liftaswash/         #   خط Liftaswash اليدوي
│   ├── fractal/optimized/      # 15 صورة فراكتالية (WebP)
│   ├── images/                 # الشعار + خريطة العدسة
│   └── sounds/                 # صوت البث (ON AIR)
│
├── src/
│   ├── components/
│   │   ├── brand/              # الشعار والهوية
│   │   ├── cards/              # بطاقات المراجعات والفيديوهات
│   │   ├── glass/              # LiquidGlass.tsx + WaterlineCapsule.tsx + طبقات الزجاج
│   │   ├── layout/             # النافبار الزجاجي السائل، التذييل، البحث
│   │   └── ui/                 # مفاتيح الثيم، الأيقونات المتحركة، أدوات التفاعل
│   ├── content/articles/       # المقالات بصيغة Markdown
│   ├── context/                # حالة الصوت العامة (SoundContext)
│   ├── data/                   # البيانات: مراجعات، فيديوهات، مقالات
│   ├── hooks/                  # خطافات الزجاج والعدسة
│   ├── lib/                    # النوابض، محرك الصوت، أدوات مساعدة
│   ├── pages/                  # صفحات التطبيق (9 صفحات شاملة الكتب وعنّي)
│   ├── utils/                  # محرك الزجاج السائل، الثيمات، المؤثرات الصوتية
│   ├── App.jsx                 # المكوّن الرئيسي + التوجيه
│   ├── main.jsx                # نقطة الدخول
│   └── index.css               # كل الأنماط والثيمات الثلاثة ومشاهد أيقونات Waterline
│
├── .editorconfig               # إعدادات المحرر الموحدة
├── .prettierrc.json            # إعدادات Prettier
├── components.json             # إعدادات shadcn/ui
├── index.html                  # HTML الرئيسي (سكربت الثيم + SEO)
├── package.json                # الاعتمادات والأوامر
├── tsconfig.json               # إعدادات TypeScript (paths)
└── vite.config.js              # إعدادات Vite + تقسيم الحزم
```

---

## 🚀 التشغيل

### المتطلبات

- **Node.js** >= 22.12.0 (انظر `.nvmrc`)
- **npm** >= 10

### التثبيت والتشغيل

```bash
# استنساخ المستودع
git clone https://github.com/ahmedqassimtv-commits/QassimChannel.git
cd QassimChannel

# تثبيت الاعتمادات
npm install

# تشغيل بيئة التطوير
npm run dev
# ← يفتح على http://localhost:5173
```

---

## 📦 الأوامر المتاحة

| الأمر | الوصف |
|---|---|
| `npm run dev` | تشغيل بيئة التطوير المحلية |
| `npm run build` | بناء نسخة الإنتاج → `dist/` |
| `npm run preview` | معاينة نسخة الإنتاج محليًا |
| `npm run format` | تنسيق الكود بـ Prettier |
| `npm run format:check` | التحقق من تنسيق الكود |
| `npm run clean` | حذف مجلد البناء والكاش |

---

## 🌐 النشر

المشروع يُنشر تلقائيًا على **GitHub Pages** عند الدفع إلى فرع `main`:

```
main → GitHub Actions → npm ci → vite build → GitHub Pages
```

**رابط النشر:** [ahmedqassimtv-commits.github.io/QassimChannel](https://ahmedqassimtv-commits.github.io/QassimChannel/)

<details>
<summary>📋 تفاصيل خط النشر (CI/CD Pipeline)</summary>

1. **المحفز:** Push إلى `main` أو تشغيل يدوي
2. **البناء:** `npm ci` → `npm run build -- --base=/QassimChannel/`
3. **SPA Fallback:** نسخ `index.html` إلى `404.html` لدعم React Router
4. **النشر:** GitHub Actions → GitHub Pages
5. **Concurrency:** مجموعة `pages` مع منع الإلغاء لضمان نشر مستقر

</details>

---

## 🎨 الأصول والهوية البصرية

الموقع عربي بالكامل، وهويته مبنية على ثلاثة عناصر: **خط عربي مخصوص**، **فن فراكتالي**، و**زجاج سائل**.

| الأصل | الحجم | دوره في الموقع |
|---|---|---|
| **خطوط ثمانية** (Sans + Serif Display + Serif Text) | 5.7 MB | خطوط النصوص والعناوين — 5 أوزان لكل عائلة |
| **A Farhood** | ⊂ أعلاه | خط زخرفي للعناوين المميزة |
| **Liftaswash** | ⊂ أعلاه | خط يدوي للمسات البصرية |
| **فن فراكتالي** (15 صورة WebP) | 4.9 MB | الخلفيات الزجاجية التي تعطي الموقع عمقه |
| **خريطة العدسة** | 20 KB | الصورة التي تحرك انكسار الضوء في عدسة النافبار |
| **شعار قَاسِمز** (SVG) | < 1 KB | الهوية — يعمل على أي مقاس |
| **صوت ON AIR** (MP3) | 3.6 MB | موسيقى هادئة تعمل مع البث |

---

## 📦 المحتوى

محتوى حقيقي من ملفات `src/data/` — بلا محتوى مختلق:

- **🎬 مراجعات (3):** Arrival، Dune: Part Two، Blue Eye Samurai
- **📺 فيديوهات (4):** «حكاية مدينة لا تنام»، «كيف نحكي بالصورة؟»، «ضوء آخر النهار»، «من خلف الكواليس»
- **📝 مقالات وحكايات:** من ملفات البيانات بصيغة Markdown، مع عارض مقالات كامل

---

## 🤝 المساهمة

نرحب بالمساهمات! اقرأ [CONTRIBUTING.md](./CONTRIBUTING.md) للتفاصيل.

ملخص سريع:

1. Fork المستودع
2. أنشئ فرعًا جديدًا: `git checkout -b feature/اسم-الميزة`
3. اعمل تعديلاتك مع التزامات واضحة
4. تأكد من عمل البناء: `npm run build`
5. افتح Pull Request

---

## 📄 الرخصة

هذا المشروع مرخص تحت [رخصة MIT](./LICENSE).

---

<p align="center">
  صُنع بـ ❤️ بواسطة <a href="https://github.com/ahmedqassimtv-commits">Ahmed Qassim</a>
</p>
