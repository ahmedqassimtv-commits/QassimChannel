import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/* ══ المشهد الحي (خلفية 3D) ══════════════════════════════════════════
   شيدر WebGL2 واحد بيرسم الخلفية كلها، من غير أي مكتبة:

   ── حرير سائل ──────────────────────────────────────────────
   حقل ضوء بيتلوّى (domain-warped fbm) بألوان الثيم نفسه: الحبر في
   العمق، الطحلب في الطيات، والوهج على الحواف. له عمق حقيقي: 3 طبقات
   بسرعات وإزاحات مختلفة (parallax) بتتحرك مع الماوس والتمرير.

   ── ورا زجاج مضلّع ─────────────────────────────────────────
   هوية قاسمز القديمة (الزجاج المضلّع فوق الفراكتال) بقت جزء من المشهد:
   كل ضلع بيكسر الضوء اللي وراه بزاوية (refraction حقيقي في الشيدر)،
   ومعاه لمعة على حافة كل ضلع وتشتت ألوان خفيف (RGB split).

   ── بيتشكّل مع كل قسم ──────────────────────────────────────
   كل قسم له «مزاج» (عرض الأضلاع، سرعة، كثافة الطيات، زاوية الضوء)،
   وعند الانتقال بين الصفحات القيم بتنساب لبعض بنابض ناعم — فالخلفية
   نفسها جزء من الانتقال. الألوان بتتقري من متغيرات الثيم وبتتبدّل بنعومة.

   ── أداء ──────────────────────────────────────────────────
   بيترسم بدقة أقل من الشاشة (الحقل ناعم أصلاً)، وبيقف لما التبويب
   يستخبى، وبيرسم فريم ثابت واحد مع prefers-reduced-motion أو
   Save-Data. من غير WebGL2 بيرجع لتدرّج CSS بنفس الألوان. */

const MOODS = {
  home: { rib: 46, speed: 0.55, warp: 1.0, fold: 2.2, light: [0.62, 0.3], glow: 1.0 },
  verdict: { rib: 30, speed: 0.4, warp: 1.25, fold: 2.8, light: [0.25, 0.25], glow: 0.85 },
  stories: { rib: 64, speed: 0.3, warp: 0.8, fold: 1.6, light: [0.75, 0.6], glow: 0.7 },
  videos: { rib: 38, speed: 0.7, warp: 1.15, fold: 2.5, light: [0.45, 0.2], glow: 1.1 },
  articles: { rib: 80, speed: 0.25, warp: 0.65, fold: 1.4, light: [0.55, 0.5], glow: 0.6 },
  masaha: { rib: 52, speed: 0.45, warp: 0.95, fold: 2.0, light: [0.35, 0.65], glow: 0.9 },
}

function moodFor(pathname) {
  if (pathname.startsWith('/verdict') || pathname.startsWith('/review')) return MOODS.verdict
  if (pathname.startsWith('/stories')) return MOODS.stories
  if (pathname.startsWith('/video')) return MOODS.videos
  if (pathname.startsWith('/article')) return MOODS.articles
  if (pathname.startsWith('/masaha') || pathname.startsWith('/on-air')) return MOODS.masaha
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
uniform vec2 uMouse;     // 0..1
uniform float uScroll;   // px
uniform float uRib;      // px
uniform float uWarp;
uniform float uFold;
uniform vec2 uLight;
uniform float uGlow;
uniform vec3 cInk, cDeep, cMoss, cSage, cGlow;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++){ v += a*noise(p); p = r*p*2.03 + 7.1; a *= 0.5; }
  return v;
}

// شرايط حرير: موجات طويلة بيلويها حقل ضوضاء بطيء، ولمعة ساتان على القمم.
// ترجع (شدة الشريط، اللمعة)
vec2 ribbons(vec2 uv, float t, float scale, float seed){
  vec2 q = uv*scale;
  float w1 = fbm(q*0.55 + vec2(seed, t*0.07));
  float w2 = fbm(q*0.55 + vec2(3.7 - t*0.05, seed*1.3));
  float phase = q.x*0.55 + q.y*1.25 + uWarp*(3.2*w1 + 1.6*w2) + t*0.22 + seed;
  float band = sin(phase*uFold);
  float sheen = pow(0.5 + 0.5*band, 7.0);
  return vec2(0.5 + 0.5*band, sheen);
}

vec3 field(vec2 uv, float t){
  vec2 m = (uMouse - 0.5);
  // طبقتين عمق: البعيدة أكبر وأبطأ وبتتحرك أقل مع الماوس (parallax)
  vec2 far = ribbons(uv + m*0.04 + vec2(0.0, uScroll*0.00010), t*0.7, 0.75, 1.3);
  vec2 near = ribbons(uv + m*0.11 + vec2(0.6, uScroll*0.00022), t, 1.25, 6.1);
  vec3 col = mix(cInk, cDeep, far.x*0.9);
  col = mix(col, cMoss, near.x*near.x*0.55);
  col += cSage * far.y * 0.16;
  col += cMoss * near.y * 0.5;
  col += cGlow * pow(near.y, 2.5) * 0.16 * uGlow;
  // ضوء ناعم ناحية مصدر الضوء والماوس
  vec2 L = mix(uLight, uMouse, 0.35) - 0.5;
  vec2 P = uv / vec2(uRes.x/uRes.y, 1.0) * 0.5;
  float d = length(P - L);
  col += cGlow * uGlow * 0.16 * exp(-d*d*5.0);
  return col;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float aspect = uRes.x/uRes.y;
  float t = uTime;

  // ── الأضلاع: x جوه الضلع من 0 لـ 1 ──
  float ribPx = uRib * (uRes.x/1440.0) * 1.6 + 6.0;
  float k = fract(frag.x/ribPx);
  float slope = cos(k*3.14159);                 // ميل سطح الضلع (محدّب)
  float edge = smoothstep(0.86, 1.0, k) + smoothstep(0.14, 0.0, k);
  // الانكسار: كل ضلع بيزيح اللي وراه أفقياً حسب ميله، والقنوات اللونية بنسب مختلفة
  float bend = slope * 0.045;
  vec2 uv = (frag/uRes - 0.5) * vec2(aspect, 1.0) * 2.0;
  vec3 col = field(uv + vec2(bend, 0.0), t);
  // تشتت ألوان خفيف على حواف الأضلاع (بديل رخيص لقراءة الحقل 3 مرات)
  col.r *= 1.0 + edge*0.06;
  col.b *= 1.0 - edge*0.04;

  // الضلع نفسه: ظل ناحية جانب ولمعة رفيعة على الحافة
  col *= 0.9 + 0.1*slope;
  col += cGlow * edge * 0.035;
  float spec = pow(max(0.0, 1.0 - abs(k - mix(0.3, 0.7, uMouse.x))*7.0), 3.0);
  col += cSage * spec * 0.05;

  // تعتيم الأطراف عشان النص يفضل مقروء + حبيبات فيلم
  vec2 v = frag/uRes - 0.5;
  col *= 1.0 - dot(v, v)*1.15;
  col = mix(col, cInk, 0.18);
  col += (hash(frag + fract(t)*100.0) - 0.5) * 0.008; // حبيبات أخف (كانت 0.028)
  o = vec4(max(col, 0.0), 1.0);
}`

function cssRgb(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const s = raw || fallback
  if (s.startsWith('#')) {
    const n = parseInt(s.slice(1), 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }
  const parts = s.split(/[\s,/]+/).map(Number).filter((x) => !Number.isNaN(x))
  return parts.length >= 3 ? parts.slice(0, 3).map((x) => x / 255) : [0, 0, 0]
}

function readPalette() {
  return {
    cInk: cssRgb('--qz-ink', '#051F20'),
    cDeep: cssRgb('--qz-deep', '#0B2B26'),
    cMoss: cssRgb('--qz-moss', '#235347'),
    cSage: cssRgb('--qz-sage', '#8EB69B'),
    cGlow: cssRgb('--qz-glow-rgb', '142 240 210'),
  }
}

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error(log || 'shader compile failed')
  }
  return sh
}

export default function LiquidScene() {
  const canvasRef = useRef(null)
  const { pathname } = useLocation()
  const targetMood = useRef(moodFor(pathname))
  targetMood.current = moodFor(pathname)
  const kick = useRef(null)

  // تغيير القسم بيصحّي الحلقة (لو كانت نايمة في reduced-motion)
  useEffect(() => {
    kick.current?.()
  }, [pathname])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) {
      canvas.dataset.fallback = 'true'
      return undefined
    }
    let prog
    try {
      prog = gl.createProgram()
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link failed')
    } catch (error) {
      if (import.meta.env?.DEV) console.warn('LiquidScene fallback:', error)
      canvas.dataset.fallback = 'true'
      return undefined
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const U = (n) => gl.getUniformLocation(prog, n)
    const u = {
      res: U('uRes'), time: U('uTime'), mouse: U('uMouse'), scroll: U('uScroll'),
      rib: U('uRib'), warp: U('uWarp'), fold: U('uFold'), light: U('uLight'), glow: U('uGlow'),
      cInk: U('cInk'), cDeep: U('cDeep'), cMoss: U('cMoss'), cSage: U('cSage'), cGlow: U('cGlow'),
    }

    const coarse = window.matchMedia('(pointer: coarse), (max-width: 760px)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = Boolean(navigator.connection?.saveData)
    const still = reduce || saveData
    // الحقل ناعم، فدقة أقل من الشاشة مش باينة وبتوفر كتير
    const scale = coarse ? 0.42 : 0.6

    const resize = () => {
      const w = Math.max(1, Math.round(window.innerWidth * scale))
      const h = Math.max(1, Math.round(window.innerHeight * scale))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    resize()

    // القيم الحالية بتنساب ناحية القيم المطلوبة (مزاج القسم + ألوان الثيم)
    const cur = { ...targetMood.current, light: [...targetMood.current.light] }
    let pal = readPalette()
    let palTarget = pal
    const mouse = [0.5, 0.5]
    const mouseTarget = [0.5, 0.5]
    let scrollY = window.scrollY

    const onMove = (e) => {
      mouseTarget[0] = e.clientX / window.innerWidth
      mouseTarget[1] = 1 - e.clientY / window.innerHeight
      wake()
    }
    const onScroll = () => {
      scrollY = window.scrollY
      wake()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', resize)
    const themeWatch = new MutationObserver(() => {
      palTarget = readPalette()
      wake()
    })
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    let raf = 0
    let last = performance.now()
    let clock = 8 // بداية من نقطة فيها حركة حلوة بدل الصفر
    let running = false
    const approach = (a, b, k) => a + (b - a) * k

    const draw = () => {
      const m = targetMood.current
      const k = 0.045
      cur.rib = approach(cur.rib, m.rib, k)
      cur.speed = approach(cur.speed, m.speed, k)
      cur.warp = approach(cur.warp, m.warp, k)
      cur.fold = approach(cur.fold, m.fold, k)
      cur.glow = approach(cur.glow, m.glow, k)
      cur.light[0] = approach(cur.light[0], m.light[0], k)
      cur.light[1] = approach(cur.light[1], m.light[1], k)
      mouse[0] = approach(mouse[0], mouseTarget[0], 0.05)
      mouse[1] = approach(mouse[1], mouseTarget[1], 0.05)
      const next = {}
      for (const key of Object.keys(pal)) next[key] = pal[key].map((v, i) => approach(v, palTarget[key][i], 0.06))
      pal = next

      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.time, clock)
      gl.uniform2f(u.mouse, mouse[0], mouse[1])
      gl.uniform1f(u.scroll, scrollY)
      gl.uniform1f(u.rib, cur.rib)
      gl.uniform1f(u.warp, cur.warp)
      gl.uniform1f(u.fold, cur.fold)
      gl.uniform2f(u.light, cur.light[0], cur.light[1])
      gl.uniform1f(u.glow, cur.glow)
      for (const key of Object.keys(pal)) gl.uniform3fv(u[key], pal[key])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    // في الوضع الثابت: بنرسم لحد ما الانتقال (لون/مزاج) يخلص وبعدين ننام
    let settleFrames = 0
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!still) clock += dt * cur.speed
      draw()
      if (still) {
        settleFrames += 1
        if (settleFrames > 90) {
          running = false
          return
        }
      }
      raf = requestAnimationFrame(frame)
    }
    function wake() {
      if (still) settleFrames = 0
      if (running || document.hidden) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    kick.current = wake
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        running = false
      } else wake()
    }
    document.addEventListener('visibilitychange', onVisibility)
    wake()
    canvas.dataset.ready = 'true'

    return () => {
      cancelAnimationFrame(raf)
      kick.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      themeWatch.disconnect()
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    }
  }, [])

  return (
    <div className="qz-scene" aria-hidden="true">
      <canvas ref={canvasRef} className="qz-scene-canvas" />
      <div className="qz-scene-fallback" />
      <div className="qz-scene-veil" />
    </div>
  )
}
