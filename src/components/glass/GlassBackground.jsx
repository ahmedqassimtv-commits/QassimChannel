import React, { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { assetUrl } from '../../utils/assets.js';

const PALETTE = {
  obsidian: 'var(--qz-ink)',
  deepPine: 'var(--qz-deep)',
  emeraldSlate: 'var(--qz-forest)',
  richTeal: 'var(--qz-moss)',
  sageMist: 'var(--qz-sage)',
  frostMint: 'var(--qz-mint)',
};

const SECTIONS_CONFIG = {
  home: {
    fractal4k: '/fractal/optimized/08.webp',
    customImage: '',
    darkness: 0.60,
    ribWidth: 44,
    refraction: 24,
    tint: 'linear-gradient(150deg, var(--qz-ink) 0%, var(--qz-deep) 40%, var(--qz-forest) 75%, var(--qz-moss) 100%)',
  },
  movies: {
    fractal4k: '/fractal/optimized/51.webp',
    customImage: '',
    darkness: 0.62,
    ribWidth: 40,
    refraction: 24,
    tint: 'linear-gradient(145deg, var(--qz-ink) 0%, var(--qz-deep) 45%, var(--qz-x1) 100%)',
  },
  series: {
    fractal4k: '/fractal/optimized/01.webp',
    customImage: '',
    darkness: 0.63,
    ribWidth: 36,
    refraction: 22,
    tint: 'linear-gradient(160deg, var(--qz-ink) 0%, var(--qz-x4) 50%, var(--qz-moss) 100%)',
  },
  stories: {
    fractal4k: '/fractal/optimized/106.webp',
    customImage: '',
    darkness: 0.64,
    ribWidth: 52,
    refraction: 20,
    tint: 'linear-gradient(150deg, var(--qz-ink) 0%, var(--qz-x5) 45%, var(--qz-x2) 100%)',
  },
  videos: {
    fractal4k: '/fractal/optimized/01.webp',
    customImage: '',
    darkness: 0.63,
    ribWidth: 38,
    refraction: 24,
    tint: 'linear-gradient(150deg, var(--qz-ink) 0%, var(--qz-deep) 40%, var(--qz-moss) 100%)',
  },
  articles: {
    fractal4k: '/fractal/optimized/106.webp',
    customImage: '',
    darkness: 0.70,
    ribWidth: 52,
    refraction: 18,
    tint: 'linear-gradient(150deg, var(--qz-ink) 0%, var(--qz-deep) 65%, var(--qz-forest) 100%)',
  },
  social: {
    fractal4k: '/fractal/optimized/51.webp',
    customImage: '',
    darkness: 0.60,
    ribWidth: 42,
    refraction: 22,
    tint: 'linear-gradient(135deg, var(--qz-ink) 0%, var(--qz-x3) 50%, var(--qz-moss) 100%)',
  },
};

// ✅ أداء: نسخ 1200px خفيفة (~30KB) للموبايل والشاشات الصغيرة بدل 2400px (~600KB)
const RESPONSIVE_FRACTALS = new Set(['01', '08', '51', '106']);
function fractalSrcSet(src) {
  const m = /\/fractal\/optimized\/(\d+)\.webp$/.exec(src || '');
  if (!m || !RESPONSIVE_FRACTALS.has(m[1])) return undefined;
  return `${src.replace(/\.webp$/, '-1200.webp')} 1200w, ${src} 2400w`;
}

// اتصال بطيء أو وضع توفير البيانات → مانحمّلش خلفيات باقي الأقسام مسبقاً
function isConstrainedNetwork() {
  const c = typeof navigator !== 'undefined' ? navigator.connection : null;
  if (!c) return false;
  return Boolean(c.saveData) || /(^|-)(2g|3g)$/.test(c.effectiveType || '');
}

// نفس الصورة اللي المتصفح هيختارها من الـ srcset (عشان التحميل المسبق مايجيبش نسخة غلط)
function pickVariant(src) {
  const set = fractalSrcSet(src);
  if (!set) return src;
  const needed = Math.max(window.innerWidth, window.innerHeight) * 1.08 * (window.devicePixelRatio || 1);
  return needed <= 1200 ? src.replace(/\.webp$/, '-1200.webp') : src;
}

export default function GlassBackground({ section }) {
  const { pathname } = useLocation();
  const containerRef = useRef(null);
  const mouseLayerRef = useRef(null);
  const rawId = useId();
  const filterId = `fractal-prism-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const getSectionKey = () => {
    if (section && SECTIONS_CONFIG[section]) return section;
    if (pathname.startsWith('/verdict/series')) return 'series';
    if (pathname.startsWith('/verdict/movies') || pathname.startsWith('/review')) return 'movies';
    if (pathname.startsWith('/stories')) return 'stories';
    if (pathname.startsWith('/video')) return 'videos';
    if (pathname.startsWith('/article')) return 'articles';
    if (pathname.startsWith('/social')) return 'social';
    return 'home';
  };

  const activeConfig =
    SECTIONS_CONFIG[getSectionKey()] || SECTIONS_CONFIG.home;

  const hasCustomImage = Boolean(
    activeConfig.customImage && activeConfig.customImage.trim() !== ''
  );
  const targetSource = assetUrl(
    hasCustomImage ? activeConfig.customImage : activeConfig.fractal4k
  );

  const [resolvedSrc, setResolvedSrc] = useState(targetSource);

  // ✅ أداء: الصورة الجديدة بتتحمّل وتتفك (decode) في الخلفية الأول،
  // وبعدين بس بتتبدّل — فالتنقل بين الأقسام مايقفش وهو بيفك صورة كبيرة.
  useEffect(() => {
    if (targetSource === resolvedSrc) return undefined;
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.src = pickVariant(targetSource);
    const apply = () => {
      if (!cancelled) setResolvedSrc(targetSource);
    };
    (img.decode ? img.decode() : Promise.resolve()).then(apply, apply);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSource]);

  // ✅ أداء: تحميل خلفيات كل الأقسام مسبقاً في وقت فراغ المتصفح (مش على النت البطيء)
  useEffect(() => {
    if (isConstrainedNetwork()) return undefined;
    const sources = [
      ...new Set(
        Object.values(SECTIONS_CONFIG).map((c) =>
          assetUrl(
            c.customImage && c.customImage.trim() !== '' ? c.customImage : c.fractal4k
          )
        )
      ),
    ];
    const run = () =>
      sources.forEach((src) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = pickVariant(src);
      });
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 1200);
    return () => window.clearTimeout(t);
  }, []);

  // حركة المؤشر الهادئة الأصلية (معامل 0.06 وإزاحة خفيفة -18px)
  useEffect(() => {
    const el = containerRef.current;
    const mouseLayer = mouseLayerRef.current;
    if (!el || !mouseLayer) return;

    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.5;
    let curX = targetX;
    let curY = targetY;
    let rafId = null;
    let running = false;

    const animate = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;

      const shiftX = (curX / window.innerWidth - 0.5) * -18;
      const shiftY = (curY / window.innerHeight - 0.5) * -18;

      el.style.setProperty('--mx', `${curX.toFixed(1)}px`);
      el.style.setProperty('--my', `${curY.toFixed(1)}px`);
      mouseLayer.style.transform = `translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0)`;

      // ✅ أداء: الحلقة بتقف لما الحركة توصل لمكانها، بدل ما تفضل شغالة 60 مرة في الثانية
      // على طول وتجبر كل طبقات الزجاج (والنوف بار) تتعاد رسمتها كل فريم
      if (Math.abs(targetX - curX) < 0.3 && Math.abs(targetY - curY) < 0.3) {
        running = false;
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(animate);
    };

    const onMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(animate);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    running = true;
    animate();
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fh-dark-bg pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      style={{
        backgroundColor: PALETTE.obsidian,
        '--rib': `${activeConfig.ribWidth}px`,
        '--darkness': activeConfig.darkness,
        '--mx': '50vw',
        '--my': '50vh',
      }}
    >
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${(1.35 / activeConfig.ribWidth).toFixed(4)} 0.0001`}
              numOctaves="1"
              seed="5"
              result="prismStrips"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="prismStrips"
              scale={activeConfig.refraction}
              xChannelSelector="R"
              yChannelSelector="R"
            />
          </filter>
        </defs>
      </svg>

      <style>{`
        .fh-dark-bg {
          isolation: isolate;
          contain: layout paint style;
        }

        /* حركة تلقائية هادئة وبطيئة مثل الكود الأصلي تماماً */
        @keyframes fhCalmDrift {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1.06);
          }
          50% {
            transform: translate3d(-1.2%, -0.8%, 0) scale(1.11);
          }
        }

        @keyframes fhSubtleGlow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.48; transform: scale(1.06); }
        }

        .fh-calm-layer {
          animation: fhCalmDrift 22s ease-in-out infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .fh-calm-layer {
            animation: none !important;
            transform: scale(1.04) !important;
          }
        }
      `}</style>

      {/* 1. طبقة المؤشر الهادئة + طبقة الانسياب البطيء */}
      <div ref={mouseLayerRef} className="absolute inset-[-4%] z-[1] will-change-transform">
        <div className="fh-calm-layer h-full w-full">
          <img
            key={resolvedSrc}
            src={resolvedSrc}
            srcSet={fractalSrcSet(resolvedSrc)}
            sizes="108vmax"
            fetchPriority="high"
            onError={() => {
              const fallback = assetUrl(activeConfig.fractal4k);
              if (resolvedSrc !== fallback) {
                setResolvedSrc(fallback);
              }
            }}
            alt=""
            decoding="async"
            // الصور المحسّنة متجهزة مسبقاً بالأبيض والأسود والتباين، فالفلتر بيتطبق بس على الصور المخصصة
            className={`h-full w-full object-cover object-center transition-opacity duration-700 ${
              hasCustomImage ? 'grayscale contrast-125 brightness-75' : ''
            }`}
          />

          {hasCustomImage && (
            <img
              src={resolvedSrc}
              alt=""
              style={{ filter: `url(#${filterId})` }}
              className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-center grayscale contrast-150 brightness-95 opacity-90"
            />
          )}
        </div>
      </div>

      {/* 2. صبغة الهوية الزمردية */}
      <div
        className="absolute inset-0 z-[2] mix-blend-color transition-all duration-700"
        style={{ background: `var(--qz-bg-tint, ${activeConfig.tint})` }}
      />

      {/* 3. توهج زمردي خافت في العمق */}
      <div
        className="absolute -bottom-[18%] right-[8%] z-[3] h-[70vh] w-[70vw] rounded-full mix-blend-screen will-change-[opacity,transform]"
        style={{
          // ✅ أداء: شلنا blur-[110px] (كان بيتحسب كل فريم مع الأنيميشن) وعوضناه بتدرج أنعم بنفس الشكل تقريباً
          background:
            'radial-gradient(closest-side, rgb(var(--qz-moss-rgb)/0.38) 0%, rgb(var(--qz-forest-rgb)/0.22) 45%, rgb(var(--qz-forest-rgb)/0.08) 75%, transparent 100%)',
          animation: 'fhSubtleGlow 16s ease-in-out infinite',
        }}
      />

      {/* 4. إضاءة الماوس الهادئة */}
      <div
        className="absolute inset-0 z-[4] mix-blend-screen"
        style={{
          background:
            'radial-gradient(480px circle at var(--mx) var(--my), rgb(var(--qz-sage-rgb)/0.16), rgb(var(--qz-moss-rgb)/0.08) 45%, transparent 75%)',
        }}
      />

      {/* 5. شرائح الزجاج المضلّع الرأسية */}
      <div
        className="absolute inset-0 z-[5] transition-all duration-700"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            rgb(var(--qz-sage-rgb)/0.11) 0px,
            rgb(var(--qz-sage-rgb)/0.03) 1.5px,
            transparent calc(var(--rib) * 0.35),
            rgb(var(--qz-ink-rgb)/0.62) calc(var(--rib) * 0.72),
            rgb(var(--qz-ink-rgb)/0.94) calc(var(--rib) - 1.5px),
            rgb(var(--qz-sage-rgb)/0.09) var(--rib)
          )`,
        }}
      />

      {/* 6. طبقة التعتيم الفحمي */}
      <div
        className="absolute inset-0 z-[6] transition-colors duration-700"
        style={{
          backgroundColor: `rgb(var(--qz-ink-rgb)/var(--darkness))`,
          backgroundImage:
            'radial-gradient(ellipse at center, transparent 35%, rgb(var(--qz-ink-rgb)/0.85) 100%)',
        }}
      />
    </div>
  );
}