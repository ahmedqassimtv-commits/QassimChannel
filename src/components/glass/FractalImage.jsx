import React, { useId, useRef } from 'react';

/**
 * FractalImage — 4K Optical Reeded Glass & Emerald Refraction Component
 * يطبق تأثير الانكسار الزجاجي المضلّع والهوية الزمردية على أي صورة
 */
export default function FractalImage({
  src,
  alt = 'Fractal Glass Visual',
  className = '',
  mode = 'split', // 'split' = نص الصورة منكسر ونصها حاد زي المرجع | 'full' = الصورة كلها منكسرة
  ribWidth = 34, // عرض كل شريحة زجاجية بالبيكسل
  refraction = 24, // قوة تكسير وتدرج الصورة جوه الشرائح (من 0 إلى 45)
  windowChrome = true, // إظهار شريط النافذة المعماري (o o o و ✳)
  overlayText, // نص اختياري يظهر فوق الزجاج زي التصميم المرجعي
  subText,
}) {
  const rawId = useId();
  const filterId = `fractal-optic-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const boxRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--ix', `${(e.clientX - rect.left).toFixed(1)}px`);
    el.style.setProperty('--iy', `${(e.clientY - rect.top).toFixed(1)}px`);
  };

  return (
    <div
      ref={boxRef}
      onMouseMove={handleMouseMove}
      style={{
        '--rib': `${ribWidth}px`,
        '--ix': '35%',
        '--iy': '50%',
      }}
      className={`group relative overflow-hidden rounded-2xl border border-[color:var(--qz-sage)]/30 bg-[color:var(--qz-ink)] shadow-[0_28px_70px_rgb(var(--qz-ink-rgb)/0.9)] select-none ${className}`}
    >
      {/* فلتر SVG رياضي بدقة 4K لصنع انكسار الشرائح الرأسية على حواف الصورة */}
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${(1.4 / ribWidth).toFixed(4)} 0.0001`}
              numOctaves="1"
              seed="3"
              result="verticalFlutes"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="verticalFlutes"
              scale={refraction}
              xChannelSelector="R"
              yChannelSelector="R"
            />
          </filter>
        </defs>
      </svg>

      {/* 1. شريط النافذة الهندسي العلوي (o o o  &  ✳) */}
      {windowChrome && (
        <div className="relative z-30 flex items-center justify-between border-b border-[color:var(--qz-sage)]/25 bg-[color:var(--qz-ink)]/65 px-5 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border border-[color:var(--qz-mint)]/65" />
            <span className="h-2.5 w-2.5 rounded-full border border-[color:var(--qz-sage)]/65" />
            <span className="h-2.5 w-2.5 rounded-full border border-[color:var(--qz-moss)]" />
          </div>
          <span className="font-mono text-base leading-none text-[color:var(--qz-mint)] transition-transform duration-500 group-hover:rotate-90">
            ✳
          </span>
        </div>
      )}

      {/* 2. حاوية الصورة والتأثيرات البصرية */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[color:var(--qz-ink)]">
        {/* أ. الصورة الأصلية الحادة (أبيض وأسود عالي التباين) */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover object-center grayscale contrast-125 brightness-95 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />

        {/* ب. طبقة الانكسار الزمردي المضلّع (تغطي النصف الأيسر في وضع split أو الصورة كاملة في وضع full) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={
            mode === 'split'
              ? {
                  maskImage:
                    'linear-gradient(90deg, black 0%, black 52%, transparent 56%)',
                  WebkitMaskImage:
                    'linear-gradient(90deg, black 0%, black 52%, transparent 56%)',
                }
              : undefined
          }
        >
          {/* نسخة الصورة المنكسرة بصرياً داخل الشرائح */}
          <img
            src={src}
            alt=""
            aria-hidden="true"
            style={{ filter: `url(#${filterId})` }}
            className="h-full w-full scale-[1.06] object-cover object-center grayscale contrast-150 brightness-110 transition-transform duration-700 ease-out group-hover:scale-[1.09]"
          />

          {/* تلوين الإضاءة المنكسرة بهويتك الزمردية (var(--qz-moss) -> var(--qz-sage) -> var(--qz-mint)) */}
          <div
            className="pointer-events-none absolute inset-0 mix-blend-color"
            style={{
              background:
                'linear-gradient(135deg, var(--qz-deep) 0%, var(--qz-moss) 45%, var(--qz-sage) 80%, var(--qz-mint) 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-65 mix-blend-multiply"
            style={{
              background:
                'radial-gradient(circle at 42% 52%, var(--qz-sage) 0%, var(--qz-forest) 55%, var(--qz-ink) 95%)',
            }}
          />

          {/* وهج الماوس التفاعلي داخل الشرائح المنكسرة */}
          <div
            className="pointer-events-none absolute inset-0 opacity-85 mix-blend-screen transition-opacity duration-300"
            style={{
              background:
                'radial-gradient(340px circle at var(--ix) var(--iy), rgb(var(--qz-mint-rgb)/0.45), rgb(var(--qz-sage-rgb)/0.22) 45%, transparent 75%)',
            }}
          />

          {/* الأعمدة الزجاجية الرأسية وحواف الانعكاس الحادة */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                rgb(var(--qz-mint-rgb)/0.32) 0px,
                rgb(var(--qz-sage-rgb)/0.08) 2px,
                transparent calc(var(--rib) * 0.35),
                rgb(var(--qz-ink-rgb)/0.55) calc(var(--rib) * 0.72),
                rgb(var(--qz-ink-rgb)/0.95) calc(var(--rib) - 1.5px),
                rgb(var(--qz-mint-rgb)/0.25) var(--rib)
              )`,
            }}
          />
        </div>

        {/* ج. خطوط زجاجية خفيفة جداً على باقي الصورة لربط المشهد */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              rgb(var(--qz-mint-rgb)/0.08) 0px,
              transparent 1px,
              transparent calc(var(--rib) - 1px),
              rgb(var(--qz-ink-rgb)/0.85) var(--rib)
            )`,
          }}
        />

        {/* د. تحبيب 4K سينمائي خفيف وتظليل الحواف */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 48%, rgb(var(--qz-ink-rgb)/0.82) 100%)',
          }}
        />

        {/* هـ. النصوص الاختيارية فوق الزجاج */}
        {(overlayText || subText) && (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-10">
            <div />
            {overlayText && (
              <h3 className="max-w-md text-2xl font-light tracking-tight text-[color:var(--qz-mint)] drop-shadow-[0_4px_20px_rgb(var(--qz-ink-rgb)/0.95)] md:text-4xl">
                {overlayText}
              </h3>
            )}
            {subText && (
              <p className="text-xs font-medium tracking-wider text-[color:var(--qz-sage)] md:text-sm">
                {subText}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}