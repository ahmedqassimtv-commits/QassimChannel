import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/* ══ المشهد الجوي الموحّد (Midnight Ambient Canvas) ═════════════════════
   خلفية سينمائية موحّدة فائقة النعومة مستوحاة من فلسفة Origin & Apple Midnight:
   - بدون أي شرائح رأسية (Slats/Ribs) تفصل الخلفية أو تكسر الدمج البصري
   - بدون خطوط كنتور مزعجة أو حركات سريعة
   - تدرّج ضوئي حريري هادئ يتنفس ببطء (إيقاع 1.8s–2.2s) ويتبع المؤشر بنعومة
   - يتكيّف لحظياً مع الثيمات الثلاثة (الزمردي / الجمري / الذهبي). */

const MOODS = {
  home: { speed: 0.18, aura: 1.0, light: [0.34, 0.36], depth: 0.95 },
  verdict: { speed: 0.14, aura: 0.82, light: [0.28, 0.28], depth: 1.05 },
  stories: { speed: 0.12, aura: 0.78, light: [0.66, 0.42], depth: 0.9 },
  videos: { speed: 0.16, aura: 0.92, light: [0.46, 0.26], depth: 0.95 },
  articles: { speed: 0.11, aura: 0.68, light: [0.52, 0.44], depth: 0.85 },
  ideas: { speed: 0.15, aura: 0.85, light: [0.42, 0.38], depth: 0.9 },
  masaha: { speed: 0.15, aura: 0.88, light: [0.38, 0.56], depth: 0.92 },
}

function moodFor(pathname) {
  if (pathname.startsWith('/verdict') || pathname.startsWith('/review')) return MOODS.verdict
  if (pathname.startsWith('/stories')) return MOODS.stories
  if (pathname.startsWith('/video')) return MOODS.videos
  if (pathname.startsWith('/article')) return MOODS.articles
  if (pathname.startsWith('/ideas') || pathname.startsWith('/masaha/ideas')) return MOODS.ideas
  if (pathname.startsWith('/masaha') || pathname.startsWith('/on-air') || pathname.startsWith('/ahmed')) return MOODS.masaha
  return MOODS.home
}

const VERT = `#version 300 es
in vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
out vec4 o;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
uniform float uAura;
uniform float uDepth;
uniform vec2 uLight;
uniform vec3 cInk, cDeep, cMoss, cSage, cGlow;

// ضوضاء simplex ثلاثية الأبعاد فائقة النعومة للتدرجات الحريرية المدمجة
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);

  // إزاحة تمرير هادئة جداً بدون قفزات
  p.y -= uScroll * 0.05;

  // تموّج حريري عريض وبطيء جداً (بدون أي خطوط أو تقطيع)
  float n1 = snoise(vec3(p * 0.85, uTime * 0.14));
  float n2 = snoise(vec3(p * 1.45 - n1 * 0.35, uTime * 0.11 + 4.2));
  float silk = smoothstep(-0.65, 0.85, n1 * 0.55 + n2 * 0.45);

  // أرضية ليلية عميقة مدمجة بالكامل
  vec3 col = mix(cInk, cDeep, smoothstep(0.0, 0.9, uv.y * 0.75 + silk * 0.35));
  col = mix(col, cMoss * 0.72, silk * 0.32 * uDepth);

  // بؤرة ضوء جوية رئيسية (Atmospheric Horizon Pool)
  vec2 lp1 = (uLight - 0.5) * vec2(asp, 1.0);
  float d1 = length(p - lp1);
  float pool1 = exp(-d1 * d1 * 1.85) * uAura;
  col += cMoss * pool1 * 0.34;
  col += cGlow * exp(-d1 * d1 * 4.2) * uAura * 0.12;

  // بؤرة ضوء ثانوية متكاملة في العمق
  vec2 lp2 = vec2(-lp1.x * 0.75, -lp1.y * 0.65);
  float d2 = length(p - lp2);
  col += cDeep * exp(-d2 * d2 * 1.6) * 0.42;

  // هالة ضوئية ناعمة تتبع المؤشر بهدوء
  vec2 mp = (uMouse - 0.5) * vec2(asp, 1.0);
  float md = length((uv - 0.5) * vec2(asp, 1.0) - mp);
  float mHalo = exp(-md * md * 4.5);
  col += mix(cMoss, cSage, 0.38) * mHalo * 0.11 * uAura;

  // تعتيم أطراف سينمائي ناعم يحافظ على اندماج كل العناصر والـ Footer
  float vig = smoothstep(1.38, 0.25, length((uv - 0.5) * vec2(1.08, 1.04)));
  col *= mix(0.62, 1.0, vig);

  // dithering خفيف لمنع أي banding في التدرجات الداكنة
  float dith = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (dith - 0.5) / 255.0;

  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

function readRgbVar(style, name, fallback) {
  const raw = style.getPropertyValue(name).trim()
  if (!raw) return fallback
  const parts = raw.split(/[\s,]+/).map(Number)
  if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255]
  }
  return fallback
}

function readPalette() {
  const s = getComputedStyle(document.documentElement)
  return {
    cInk: readRgbVar(s, '--qz-ink-rgb', [5 / 255, 31 / 255, 32 / 255]),
    cDeep: readRgbVar(s, '--qz-deep-rgb', [11 / 255, 43 / 255, 38 / 255]),
    cMoss: readRgbVar(s, '--qz-moss-rgb', [35 / 255, 83 / 255, 71 / 255]),
    cSage: readRgbVar(s, '--qz-sage-rgb', [142 / 255, 182 / 255, 155 / 255]),
    cGlow: readRgbVar(s, '--qz-glow-rgb', [168 / 255, 224 / 255, 184 / 255]),
  }
}

export default function LiquidScene() {
  const canvasRef = useRef(null)
  const moodRef = useRef(MOODS.home)
  const { pathname } = useLocation()

  useEffect(() => {
    moodRef.current = moodFor(pathname)
  }, [pathname])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    })
    if (!gl) {
      canvas.dataset.fallback = 'true'
      return undefined
    }

    const compile = (type, src) => {
      const sh = gl.createShader(type)
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh)
        return null
      }
      return sh
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return undefined

    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const locP = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(locP)
    gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0)

    const U = Object.fromEntries(
      ['uRes', 'uTime', 'uMouse', 'uScroll', 'uAura', 'uDepth', 'uLight', 'cInk', 'cDeep', 'cMoss', 'cSage', 'cGlow'].map(
        (n) => [n, gl.getUniformLocation(prog, n)],
      ),
    )

    let pal = readPalette()
    const curPal = structuredClone(pal)
    const mo = new MutationObserver(() => {
      pal = readPalette()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.floor(window.innerWidth * dpr))
      const h = Math.max(1, Math.floor(window.innerHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }
    const onMove = (e) => {
      mouse.tx = e.clientX / Math.max(window.innerWidth, 1)
      mouse.ty = 1.0 - e.clientY / Math.max(window.innerHeight, 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let scroll = 0
    let targetScroll = 0
    const onScroll = () => {
      targetScroll = window.scrollY / Math.max(window.innerHeight, 1)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const cur = { ...moodRef.current, light: [...moodRef.current.light] }
    let t = 10
    let last = performance.now()
    let raf = 0

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const target = moodRef.current
      const k = 1 - Math.exp(-dt * 2.4)

      cur.speed += (target.speed - cur.speed) * k
      cur.aura += (target.aura - cur.aura) * k
      cur.depth += (target.depth - cur.depth) * k
      cur.light[0] += (target.light[0] - cur.light[0]) * k
      cur.light[1] += (target.light[1] - cur.light[1]) * k

      for (const key of ['cInk', 'cDeep', 'cMoss', 'cSage', 'cGlow']) {
        curPal[key][0] += (pal[key][0] - curPal[key][0]) * k
        curPal[key][1] += (pal[key][1] - curPal[key][1]) * k
        curPal[key][2] += (pal[key][2] - curPal[key][2]) * k
      }

      mouse.x += (mouse.tx - mouse.x) * 0.045
      mouse.y += (mouse.ty - mouse.y) * 0.045
      scroll += (targetScroll - scroll) * 0.06
      if (!reduce) t += dt * cur.speed

      gl.uniform2f(U.uRes, canvas.width, canvas.height)
      gl.uniform1f(U.uTime, t)
      gl.uniform2f(U.uMouse, mouse.x, mouse.y)
      gl.uniform1f(U.uScroll, scroll)
      gl.uniform1f(U.uAura, cur.aura)
      gl.uniform1f(U.uDepth, cur.depth)
      gl.uniform2f(U.uLight, cur.light[0], cur.light[1])
      gl.uniform3fv(U.cInk, curPal.cInk)
      gl.uniform3fv(U.cDeep, curPal.cDeep)
      gl.uniform3fv(U.cMoss, curPal.cMoss)
      gl.uniform3fv(U.cSage, curPal.cSage)
      gl.uniform3fv(U.cGlow, curPal.cGlow)

      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!reduce) raf = requestAnimationFrame(frame)
    }

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf)
      else if (!reduce) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={canvasRef} className="qz-scene" aria-hidden="true" />
}
