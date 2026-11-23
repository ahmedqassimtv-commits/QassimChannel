# تعليمات Copilot لمشروع قاسمز

- المشروع React 19 + Vite 8 + Tailwind 4 + Framer Motion، والواجهة عربية RTL بالكامل.
- الموقع شغال تحت `/QassimChannel/` على GitHub Pages: أي ملف من `public` يتنادى بـ`assetUrl()` من `src/utils/assets.js` أو `import.meta.env.BASE_URL`، والراوتر عليه `basename`.
- الثيمات: `night` (الافتراضي) و`green` و`red` — كلها داكنة. الألوان من متغيرات CSS (`--qz-ink`, `--qz-mint`, `--qz-glow-rgb`, ...) مش ألوان ثابتة.
- ممنوع تقسيم النص العربي لحروف (بيكسر اتصال الحروف) وممنوع `letter-spacing` على العربي.
- الحركة: نوابض Framer Motion، وحرّك `transform` و`opacity` بس، واحترم `prefers-reduced-motion`.
- مفيش أصوات: دوال `src/utils/glassSound.js` فاضية عن قصد.
- التعليقات في الكود بالعربي المصري.
