// محرك الزجاج السائل (Chromatic RGB Refraction + LRU Cache + Safe Prefetcher)

const MAX_CACHE_ENTRIES = 64;
const displacementCache = new Map();
const prefetchedRoutes = new Set();

function getCachedMap(key) {
  if (!displacementCache.has(key)) return null;
  const value = displacementCache.get(key);
  displacementCache.delete(key);
  displacementCache.set(key, value);
  return value;
}

function setCachedMap(key, value) {
  if (displacementCache.has(key)) {
    displacementCache.delete(key);
  } else if (displacementCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = displacementCache.keys().next().value;
    displacementCache.delete(oldestKey);
  }
  displacementCache.set(key, value);
}

function squircleProfile(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return Math.sqrt(1 - Math.pow(1 - clamped, 4));
}

// خريطة عدسة Apple: تكبير بصري خفيف جداً يحافظ على وضوح النصوص والصور + انكسار RGB على الحواف
export function getSquircleDisplacementMap(width = 360, height = 52, bevel = 15) {
  if (typeof document === 'undefined') return '';

  const w = Math.max(64, Math.round(width / 4) * 4);
  const h = Math.max(32, Math.round(height / 4) * 4);
  const b = Math.max(6, Math.round(bevel));
  const cacheKey = `chromatic_lens_${w}x${h}x${b}`;

  const cached = getCachedMap(cacheKey);
  if (cached) return cached;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    const radius = h / 2;
    const centerX = w / 2;
    const centerY = h / 2;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cx = Math.max(radius, Math.min(w - radius, x));
        const cy = radius;
        const dx = x - cx;
        const dy = y - cy;
        const distFromCenter = Math.hypot(dx, dy);
        const distFromEdge = Math.max(0, radius - distFromCenter);

        // انحناء عدسي لطيف جداً في القلب لتكبير الخلفية بوضوح دون تشويه
        const normX = (x - centerX) / centerX;
        const normY = (y - centerY) / centerY;
        let offsetX = -normX * 10;
        let offsetY = -normY * 14;

        // انكسار قوي على الحافة المنحنية لإبراز تشتت Chromatic RGB
        if (distFromEdge < b && distFromCenter > 0.001) {
          const normalizedEdge = distFromEdge / b;
          const profile = squircleProfile(normalizedEdge);
          const slope = Math.pow(1 - profile, 1.4);

          const nx = dx / distFromCenter;
          const ny = dy / distFromCenter;

          offsetX -= nx * slope * 88;
          offsetY -= ny * slope * 88;
        }

        const rChannel = Math.round(Math.max(0, Math.min(255, 128 + offsetX)));
        const gChannel = Math.round(Math.max(0, Math.min(255, 128 + offsetY)));

        const idx = (y * w + x) * 4;
        data[idx] = rChannel;
        data[idx + 1] = gChannel;
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    setCachedMap(cacheKey, dataUrl);
    return dataUrl;
  } catch {
    return '';
  }
}

const availablePages = import.meta.glob('../pages/*.jsx');

// ✅ إصلاح: الأسماء لازم تطابق ملفات src/pages الفعلية والمسارات الحالية (/masaha/*)
// قبل كده /verdict/* و /masaha/* ماكانوش بيتحمّلوا مسبقاً خالص
const routeToPageName = {
  '/': 'Home',
  '/stories': 'Stories',
  '/videos': 'Videos',
  '/videos/shorts': 'Videos',
  '/articles': 'Articles',
  '/verdict/movies': 'Reviews',
  '/verdict/series': 'Reviews',
  '/masaha/on-air': 'OnAir',
  '/masaha/books': 'Books',
  '/masaha/about': 'About',
  '/on-air': 'OnAir',
};

export function prefetchRoute(path) {
  // تحميل موسيقى أون إير مسبقاً عشان تبدأ فوراً لما تفتح الصفحة
  if (!path || prefetchedRoutes.has(path)) return;
  prefetchedRoutes.add(path);

  const pageName = routeToPageName[path];
  if (!pageName) return;

  const matchedKey = Object.keys(availablePages).find((key) =>
    key.toLowerCase().endsWith(`/${pageName.toLowerCase()}.jsx`)
  );

  const importer = matchedKey ? availablePages[matchedKey] : null;
  if (typeof importer === 'function') {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => importer().catch(() => {}), { timeout: 300 });
    } else {
      window.setTimeout(() => importer().catch(() => {}), 16);
    }
  }
}