# قاسم الافتراضي — Worker

من غير الـ Worker ده، قاسم الافتراضي بيشتغل بالوضع المحلي: بيرد من محتوى الموقع بكلمات مفتاحية (ببلاش ومن غير أي سيرفر).
الـ Worker بيخلّيه يتكلم بذكاء اصطناعي حقيقي، والمفتاح يفضل سرّي.

## التشغيل (مرة واحدة)

```bash
cd workers/qz-ai
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY   # الصق مفتاح Claude API
npx wrangler deploy
```

هيطلعلك رابط زي `https://qz-ai.<حسابك>.workers.dev`.

## ربطه بالموقع

GitHub › الريبو › Settings › Secrets and variables › Actions › **Variables** › New variable:

- الاسم: `QZ_AI_ENDPOINT`
- القيمة: رابط الـ Worker

وبعدين اعمل deploy للموقع تاني. للتجربة على جهازك: حط `VITE_QZ_AI_ENDPOINT=...` في ملف `.env.local`.

## ملاحظات

- حط حد صرف شهري للمفتاح من لوحة Anthropic.
- الـ Worker بيقبل طلبات من الدومينات اللي في `ALLOWED_ORIGINS` بس.
- تقدر تغيّر الموديل من غير ما تلمس الكود: `npx wrangler secret put MODEL` أو `[vars] MODEL = "..."`.
