import { useEffect, useRef, useState } from 'react'

/* ══ سلايدر الزجاج (WebGL) ═══════════════════════════════════════════
   مأخوذ من مكوّن «Lumina Interactive List» ومتعاد كتابته للموقع:
   - الانتقال بين الصور: فقاعة زجاج بتكبر من النص وبتكسر الصورة الجديدة
     (refraction + chromatic aberration + حافة منوّرة) — shader واحد.
   - النص العربي بيتحرك كلمة كلمة (مش حرف حرف عشان الحروف ماتتفكّش)،
     و6 حركات مختلفة بالتناوب زي الأصل.
   - refs بدل id فينفع أكتر من نسخة في الصفحة، وتنظيف كامل عند الخروج.
   - بيقف لما يخرج من الشاشة أو التاب يستخبى، ومع تقليل الحركة مفيش
     تشغيل تلقائي. لو WebGL أو السكريبتات ماحملتش: صورة عادية.
   GSAP و Three.js بيتحملوا من cdnjs وقت الحاجة بس (مش في الحزمة). */

const GSAP_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js'
const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'

function loadScript(src, globalName) {
  return new Promise((resolve, reject) => {
    if (window[globalName]) return resolve(window[globalName])
    let s = document.querySelector(`script[src="${src}"]`)
    if (!s) {
      s = document.createElement('script')
      s.src = src
      s.async = true
      document.head.appendChild(s)
    }
    const t = window.setTimeout(() => reject(new Error(`timeout ${globalName}`)), 15000)
    s.addEventListener('load', () => {
      window.clearTimeout(t)
      resolve(window[globalName])
    })
    s.addEventListener('error', () => {
      window.clearTimeout(t)
      reject(new Error(`failed ${src}`))
    })
  })
}

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`

const FRAG = `
precision highp float;
uniform sampler2D uTexture1, uTexture2;
uniform float uProgress, uTime;
uniform vec2 uResolution, uTexture1Size, uTexture2Size;
uniform float uRefraction, uChromatic, uClarity, uEdgeGlow, uFlow;
varying vec2 vUv;

vec2 coverUV(vec2 uv, vec2 size) {
  vec2 s = uResolution / size;
  float scale = max(s.x, s.y);
  vec2 scaled = size * scale;
  vec2 offset = (uResolution - scaled) * 0.5;
  return (uv * uResolution - offset) / scaled;
}

void main() {
  float t = uProgress * 5.0;
  vec2 uv1 = coverUV(vUv, uTexture1Size);
  vec2 uv2 = coverUV(vUv, uTexture2Size);
  float maxR = length(uResolution) * 0.85;
  float br = uProgress * maxR;
  vec2 p = vUv * uResolution;
  vec2 c = uResolution * 0.5;
  float d = length(p - c);
  float nd = d / max(br, 0.001);
  float inside = smoothstep(br + 3.0, br - 3.0, d);

  vec4 img = texture2D(uTexture2, uv2);
  if (inside > 0.0) {
    float ro = 0.08 * uRefraction * pow(smoothstep(0.3 * uClarity, 1.0, nd), 1.5);
    vec2 dir = d > 0.0 ? (p - c) / d : vec2(0.0);
    vec2 duv = uv2 - dir * ro;
    duv += vec2(sin(t + nd * 10.0), cos(t * 0.8 + nd * 8.0)) * 0.015 * uFlow * nd * inside;
    float ca = 0.02 * uChromatic * pow(smoothstep(0.3, 1.0, nd), 1.2);
    img = vec4(
      texture2D(uTexture2, duv + dir * ca * 1.2).r,
      texture2D(uTexture2, duv + dir * ca * 0.2).g,
      texture2D(uTexture2, duv - dir * ca * 0.8).b,
      1.0
    );
    float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
    img.rgb += rim * 0.08 * uEdgeGlow;
  }
  if (uProgress > 0.95) img = mix(img, texture2D(uTexture2, uv2), (uProgress - 0.95) / 0.05);
  gl_FragColor = mix(texture2D(uTexture1, uv1), img, inside);
}
`

/* 6 حركات دخول للعنوان بالتناوب (زي الأصل)، على الكلمات */
const ENTRANCES = [
  { from: { y: 24 }, ease: 'power3.out', stagger: 0.06 },
  { from: { y: -24 }, ease: 'back.out(1.7)', stagger: 0.06 },
  {
    from: { filter: 'blur(10px)', scale: 1.4 },
    ease: 'power2.out',
    stagger: { amount: 0.4, from: 'random' },
  },
  { from: { scale: 0 }, ease: 'back.out(1.5)', stagger: 0.08 },
  { from: { rotationX: 90, transformOrigin: '50% 50%' }, ease: 'power2.out', stagger: 0.07 },
  { from: { x: -30 }, ease: 'power3.out', stagger: 0.06 },
]

const PRESETS = {
  Subtle: { uRefraction: 0.6, uChromatic: 0.5, uClarity: 1.3, uEdgeGlow: 0.7, uFlow: 0.8 },
  Default: { uRefraction: 1.0, uChromatic: 1.0, uClarity: 1.0, uEdgeGlow: 1.0, uFlow: 1.0 },
  Crystal: { uRefraction: 1.5, uChromatic: 1.8, uClarity: 0.7, uEdgeGlow: 1.4, uFlow: 0.5 },
  Liquid: { uRefraction: 0.8, uChromatic: 0.4, uClarity: 1.2, uEdgeGlow: 0.8, uFlow: 1.8 },
}

export default function GlassSlider({
  slides,
  interval = 6000,
  transition = 2.5,
  preset = 'Default',
  label = 'معرض',
  className = '',
}) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const titleRef = useRef(null)
  const descRef = useRef(null)
  const metaRef = useRef(null)
  const api = useRef({ goTo: () => {} })
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!slides?.length) return undefined
    const root = rootRef.current
    const canvas = canvasRef.current
    const titleEl = titleRef.current
    const descEl = descRef.current
    const metaEl = metaRef.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let disposed = false
    let gsap = null
    let THREE = null
    let renderer = null
    let material = null
    let raf = 0
    let tickTimer = 0
    let current = 0
    let busy = false
    let visible = true
    let elapsed = 0
    const textures = []

    const words = (text) =>
      String(text)
        .split(/\s+/)
        .filter(Boolean)
        .map(
          (w) =>
            `<span class="qz-gs-word">${w.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`)}</span>`,
        )
        .join(' ')

    const setText = (i, animate) => {
      const s = slides[i]
      const title = titleEl
      const desc = descEl
      const meta = metaEl
      if (!title || !desc) return
      title.innerHTML = words(s.title)
      title.setAttribute('aria-label', s.title)
      desc.textContent = s.description || ''
      if (meta) meta.textContent = s.meta || ''
      if (!gsap || !animate || reduce) return
      const e = ENTRANCES[i % ENTRANCES.length]
      gsap.fromTo(
        title.children,
        { opacity: 0, ...e.from },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotationX: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: e.ease,
          stagger: e.stagger,
        },
      )
      gsap.fromTo(
        [desc, meta].filter(Boolean),
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.25,
          ease: 'power3.out',
        },
      )
    }

    const swapText = (i) => {
      const title = titleEl
      const desc = descEl
      if (!gsap || reduce || !title) return setText(i, false)
      gsap.to(title.children, {
        y: -18,
        opacity: 0,
        duration: 0.45,
        stagger: 0.03,
        ease: 'power2.in',
      })
      gsap.to([desc, metaEl].filter(Boolean), {
        y: -10,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => !disposed && setText(i, true),
      })
    }

    const goTo = (target) => {
      if (disposed || busy || target === current) return
      const next = ((target % slides.length) + slides.length) % slides.length
      elapsed = 0
      setProgress(0)
      setIndex(next)
      const from = textures[current]
      const to = textures[next]
      if (!material || !from || !to || !gsap) {
        current = next
        setText(next, false)
        return
      }
      busy = true
      const u = material.uniforms
      u.uTexture1.value = from
      u.uTexture2.value = to
      u.uTexture1Size.value = from.userData.size
      u.uTexture2Size.value = to.userData.size
      swapText(next)
      current = next
      gsap.fromTo(
        u.uProgress,
        { value: 0 },
        {
          value: 1,
          duration: reduce ? 0.01 : transition,
          ease: 'power2.inOut',
          onComplete: () => {
            u.uProgress.value = 0
            u.uTexture1.value = to
            u.uTexture1Size.value = to.userData.size
            busy = false
          },
        },
      )
    }
    api.current.goTo = goTo

    // التشغيل التلقائي: عدّاد واحد بيحدّث خط التقدّم
    const STEP = 50
    const startTicker = () => {
      window.clearInterval(tickTimer)
      if (reduce) return
      tickTimer = window.setInterval(() => {
        if (!visible || document.hidden || busy) return
        elapsed += STEP
        setProgress(Math.min(1, elapsed / interval))
        if (elapsed >= interval) goTo(current + 1)
      }, STEP)
    }

    const size = () => {
      if (!renderer || !material) return
      const w = root.clientWidth
      const h = root.clientHeight
      renderer.setSize(w, h, false)
      material.uniforms.uResolution.value.set(w, h)
    }
    const ro = new ResizeObserver(size)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(root)

    const loadTexture = (src) =>
      new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin('anonymous')
        loader.load(
          src,
          (t) => {
            t.minFilter = t.magFilter = THREE.LinearFilter
            t.userData = { size: new THREE.Vector2(t.image.width, t.image.height) }
            resolve(t)
          },
          undefined,
          reject,
        )
      })

    const init = async () => {
      setText(0, false)
      try {
        ;[gsap, THREE] = await Promise.all([
          loadScript(GSAP_SRC, 'gsap'),
          loadScript(THREE_SRC, 'THREE'),
        ])
      } catch {
        startTicker()
        return
      }
      if (disposed) return
      setText(0, true)
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
      } catch {
        startTicker()
        return
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
      material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture1: { value: null },
          uTexture2: { value: null },
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uTexture1Size: { value: new THREE.Vector2(1, 1) },
          uTexture2Size: { value: new THREE.Vector2(1, 1) },
          ...Object.fromEntries(
            Object.entries(PRESETS[preset] || PRESETS.Default).map(([k, v]) => [k, { value: v }]),
          ),
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
      })
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))
      ro.observe(root)
      size()

      for (const s of slides) {
        try {
          textures.push(await loadTexture(s.media))
        } catch {
          textures.push(null)
        }
        if (disposed) return
      }
      const first = textures[0]
      if (!first) {
        startTicker()
        return
      }
      material.uniforms.uTexture1.value = first
      material.uniforms.uTexture2.value = first
      material.uniforms.uTexture1Size.value = first.userData.size
      material.uniforms.uTexture2Size.value = first.userData.size
      setReady(true)
      startTicker()

      const render = () => {
        raf = requestAnimationFrame(render)
        if (!visible || document.hidden) return
        renderer.render(scene, camera)
      }
      render()
    }
    init()

    return () => {
      disposed = true
      window.clearInterval(tickTimer)
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      if (gsap) gsap.killTweensOf([...(titleEl?.children ?? []), descEl, metaEl].filter(Boolean))
      textures.forEach((t) => t?.dispose())
      material?.dispose()
      renderer?.dispose()
    }
  }, [slides, interval, transition, preset])

  if (!slides?.length) return null
  const current = slides[index]

  return (
    <section
      ref={rootRef}
      className={`qz-gs ${className}`}
      data-ready={ready ? 'true' : undefined}
      aria-roledescription="carousel"
      aria-label={label}
    >
      {/* صورة عادية تحت الكانفاس: بتظهر لحد ما WebGL يجهز أو لو فشل */}
      <img className="qz-gs-fallback" src={current.media} alt="" aria-hidden="true" />
      <canvas ref={canvasRef} className="qz-gs-canvas" aria-hidden="true" />
      <div className="qz-gs-scrim" aria-hidden="true" />

      <div className="qz-gs-count qz-latin" dir="ltr" aria-hidden="true">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span className="qz-gs-count-total">/ {String(slides.length).padStart(2, '0')}</span>
      </div>

      <div className="qz-gs-content" aria-live="polite">
        <p ref={metaRef} className="qz-gs-meta" />
        <h2 ref={titleRef} className="qz-gs-title" />
        <p ref={descRef} className="qz-gs-desc" />
      </div>

      <nav className="qz-gs-nav" aria-label={`${label} — اختار صورة`}>
        {slides.map((s, i) => (
          <button
            key={s.media}
            type="button"
            className="qz-gs-nav-item"
            aria-current={i === index ? 'true' : undefined}
            onClick={() => api.current.goTo(i)}
            data-qz-silent
          >
            <span className="qz-gs-line">
              <span
                className="qz-gs-fill"
                style={{ transform: `scaleX(${i === index ? progress : 0})` }}
              />
            </span>
            <span className="qz-gs-nav-title">{s.title}</span>
          </button>
        ))}
      </nav>
    </section>
  )
}
