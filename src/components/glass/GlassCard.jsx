import React, { useRef } from 'react';
import { assetUrl } from '../../utils/assets.js';

/**
 * GlassCard — 4K Fractal Haze & Botanical Emerald Edition
 * Palette: var(--qz-ink) | var(--qz-deep) | var(--qz-forest) | var(--qz-moss) | var(--qz-sage) | var(--qz-mint)
 */
export default function GlassCard({
  children,
  className = '',
  hover = true,
  windowChrome = false, // اجعلها true في البطاقات المميزة لإظهار شريط (o o o و ✳)
  fractalTexture = '/fractal/optimized/02.webp', // ✅ أداء: نسخة خفيفة (20KB بدل 16MB) متجهزة بالأبيض والأسود والتباين
  onClick,
  ...props
}) {
  const cardRef = useRef(null);
  const resolvedTexture = fractalTexture ? assetUrl(fractalTexture) : '';

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--cx', `${(e.clientX - rect.left).toFixed(1)}px`);
    el.style.setProperty('--cy', `${(e.clientY - rect.top).toFixed(1)}px`);
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--cx', '-500px');
    el.style.setProperty('--cy', '-500px');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={hover ? handleMouseMove : undefined}
      onMouseLeave={hover ? handleMouseLeave : undefined}
      onClick={onClick}
      style={{ '--cx': '-500px', '--cy': '-500px' }}
      className={`group relative overflow-hidden rounded-2xl border border-[color:var(--qz-sage)]/20 bg-[color:var(--qz-ink)]/72 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_22px_55px_rgb(var(--qz-ink-rgb)/0.85),inset_0_1px_0_0_rgb(var(--qz-mint-rgb)/0.16)] transition-all duration-300 ease-out ${
        hover
          ? 'hover:-translate-y-1 hover:border-[color:var(--qz-sage)]/40 hover:bg-[color:var(--qz-deep)]/80 hover:shadow-[0_28px_65px_rgb(var(--qz-ink-rgb)/0.95),0_0_32px_rgb(var(--qz-moss-rgb)/0.3)]'
          : ''
      } ${className}`}
      {...props}
    >
      {/* 1. إطار ضوئي حاد بدقة 4K يضيء حافة البطاقة عند موضع الماوس (var(--qz-mint) & var(--qz-sage)) */}
      {hover && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(280px circle at var(--cx) var(--cy), rgb(var(--qz-mint-rgb)/0.7), rgb(var(--qz-sage-rgb)/0.28) 45%, transparent 75%)',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '1px',
          }}
        />
      )}

      {/* 2. شريط النافذة الهندسي الاختياري (o o o  &  ✳) المستوحى من التصميم المرجعي */}
      {windowChrome && (
        <div className="relative z-20 flex items-center justify-between border-b border-[color:var(--qz-sage)]/20 bg-[color:var(--qz-deep)]/45 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border border-[color:var(--qz-mint)]/55 transition-colors duration-300 group-hover:border-[color:var(--qz-mint)] group-hover:bg-[color:var(--qz-mint)]/25" />
            <span className="h-2.5 w-2.5 rounded-full border border-[color:var(--qz-sage)]/55 transition-colors duration-300 group-hover:border-[color:var(--qz-mint)] group-hover:bg-[color:var(--qz-sage)]/25" />
            <span className="h-2.5 w-2.5 rounded-full border border-[color:var(--qz-moss)]/75 transition-colors duration-300 group-hover:border-[color:var(--qz-sage)]" />
          </div>
          <span className="font-mono text-sm leading-none text-[color:var(--qz-sage)] transition-transform duration-500 group-hover:rotate-90 group-hover:text-[color:var(--qz-mint)]">
            ✳
          </span>
        </div>
      )}

      {/* 3. لمعة انكسار الزجاج العلوية (var(--qz-mint)) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-[color:var(--qz-mint)]/45 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* 4. خامة Fractal Haze الـ 4K محفورة بنعومة داخل سطح الزجاج */}
      {resolvedTexture && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-[0.045] mix-blend-screen transition-opacity duration-500 group-hover:opacity-[0.095] ${
            resolvedTexture.includes('/optimized/') ? '' : 'grayscale contrast-150'
          }`}
          style={{
            backgroundImage: `url('${resolvedTexture}')`,
          }}
        />
      )}

      {/* 5. شرائح انكسار رأسية دقيقة تظهر بنعومة عند تمرير الماوس */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.02] transition-opacity duration-500 group-hover:opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            rgb(var(--qz-mint-rgb)/0.35) 0px,
            transparent 1px,
            transparent 18px,
            rgb(var(--qz-ink-rgb)/0.85) 20px
          )`,
        }}
      />

      {/* 6. وهج الماوس الداخلي الناعم (var(--qz-sage) & var(--qz-moss)) */}
      {hover && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(360px circle at var(--cx) var(--cy), rgb(var(--qz-mint-rgb)/0.11), rgb(var(--qz-moss-rgb)/0.14) 45%, transparent 80%)',
          }}
        />
      )}

      {/* 7. خط انعكاس سفلي خافت عند الوقوف على البطاقة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 bottom-0 z-0 h-px bg-gradient-to-r from-transparent via-[color:var(--qz-sage)]/45 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* 8. محتوى البطاقة الفعلي */}
      <div className="relative z-20">{children}</div>
    </div>
  );
}