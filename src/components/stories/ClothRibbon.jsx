import { useEffect, useRef } from 'react'

/* ══ شريط القماش الطائر (قسم الحكايات) ═══════════════════════════════
   زي قماشة Structured اللي بتعدّي فوق الحروف العملاقة: شريط حرير لونه
   طوبي فاتح، بيتلوى ويتطوى، وبيعدّي الشاشة بالقطر على حسب التمرير.

   WebGL خام من غير مكتبات: شبكة طولية (u على الطول، v على العرض)،
   الشيدر بيحسب مكان كل نقطة (خط منحني + لفّة + تموّجات قماش)، والعمودي
   (normal) بيتحسب بفروق صغيرة من نفس الدالة فالإضاءة ناعمة. إضاءة
   انتشار + لمعة حرير على الحواف (sheen) + ظل ناعم في الثنيات.

   progress (0..1) جاي من التمرير: 0 = الشريط برّه يمين تحت، 1 = برّه
   شمال فوق. بيرسم بس وهو ظاهر، وبيقف مع تقليل الحركة. */

const VERT = `
attribute vec2 aUV;
uniform float uTime;
uniform float uProgress;
uniform float uAspect;
varying vec3 vNormal;
varying vec3 vPos;
varying vec2 vUV;

vec3 ribbon(vec2 uv) {
  float u = uv.x;
  float v = uv.y - 0.5;
  // الخط الأساسي: قوس قطري بيعدّي الشاشة، والتمرير بيزحلقه
  float s = u * 2.6 - 1.3 + (uProgress * 2.9 - 1.45);
  vec3 c = vec3(s * 1.15, s * 0.34 - 0.05 + 0.08 * sin(s * 2.4 + uTime * 0.35), 0.0);
  c.y += 0.12 * sin(s * 3.1 + uTime * 0.5);
  // لفّة حوالين الخط + تموّج طولي
  float twist = 1.9 * sin(u * 3.4 + uTime * 0.28 + uProgress * 2.2) + uProgress * 1.6;
  float width = 0.3 * (0.8 + 0.3 * sin(u * 5.0 + 1.3));
  vec3 across = vec3(0.3, -0.95, 0.0);
  vec3 side = normalize(across) * cos(twist) + vec3(0.0, 0.0, 1.0) * sin(twist);
  vec3 p = c + side * v * width * 2.0;
  // ثنيات القماش
  p.z += 0.07 * sin(v * 8.0 + u * 13.0 + uTime * 0.9) * (0.5 + 0.5 * sin(u * 6.0));
  p.z += 0.035 * sin(v * 17.0 - u * 9.0 + uTime * 0.7);
  p.y += 0.02 * sin(v * 7.0 - u * 18.0 + uTime * 0.6);
  return p;
}

void main() {
  vec3 p = ribbon(aUV);
  float e = 0.004;
  vec3 du = ribbon(aUV + vec2(e, 0.0)) - ribbon(aUV - vec2(e, 0.0));
  vec3 dv = ribbon(aUV + vec2(0.0, e)) - ribbon(aUV - vec2(0.0, e));
  vNormal = normalize(cross(du, dv));
  vPos = p;
  vUV = aUV;
  // منظور بسيط
  float persp = 1.0 / (1.0 - p.z * 0.35);
  gl_Position = vec4(p.x * persp / uAspect, p.y * persp, 0.0, 1.0);
}
`

const FRAG = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vPos;
varying vec2 vUV;
void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  vec3 base = vec3(0.86, 0.6, 0.4);
  float diff = max(dot(N, L), 0.0);
  float wrap = (dot(N, L) + 0.45) / 1.45;
  float spec = pow(max(dot(N, H), 0.0), 38.0) * 0.28;
  float sheen = pow(1.0 - abs(dot(N, V)), 2.2) * 0.22;
  vec3 col = base * (0.4 + 0.62 * max(wrap, 0.0) + 0.25 * diff) + vec3(1.0, 0.92, 0.84) * (spec + sheen);
  // ظل ناعم على الحواف الطولية
  float edge = smoothstep(0.0, 0.06, vUV.y) * smoothstep(1.0, 0.94, vUV.y);
  col *= mix(0.78, 1.0, edge);
  float alpha = smoothstep(0.0, 0.015, vUV.y) * smoothstep(1.0, 0.985, vUV.y);
  gl_FragColor = vec4(col * alpha, alpha);
}
`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s)
    gl.deleteShader(s)
    throw new Error(log || 'shader')
  }
  return s
}

export default function ClothRibbon({ progressRef, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true })
    if (!gl) return undefined

    let program
    try {
      program = gl.createProgram()
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link')
    } catch {
      return undefined
    }
    gl.useProgram(program)

    // الشبكة: 220 نقطة على الطول × 18 على العرض
    const NU = 220
    const NV = 18
    const uv = new Float32Array(NU * NV * 2)
    let k = 0
    for (let j = 0; j < NV; j++)
      for (let i = 0; i < NU; i++) {
        uv[k++] = i / (NU - 1)
        uv[k++] = j / (NV - 1)
      }
    const idx = new Uint16Array((NU - 1) * (NV - 1) * 6)
    k = 0
    for (let j = 0; j < NV - 1; j++)
      for (let i = 0; i < NU - 1; i++) {
        const a = j * NU + i
        const b = a + 1
        const c = a + NU
        const d = c + 1
        idx.set([a, c, b, b, c, d], k)
        k += 6
      }
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
    const ibo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
    const aUV = gl.getAttribLocation(program, 'aUV')
    gl.enableVertexAttribArray(aUV)
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0)
    const uTime = gl.getUniformLocation(program, 'uTime')
    const uProgress = gl.getUniformLocation(program, 'uProgress')
    const uAspect = gl.getUniformLocation(program, 'uAspect')
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let visible = false
    let aspect = 1

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      aspect = w / Math.max(1, h)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const t0 = performance.now()
    const draw = (now) => {
      raf = 0
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(uTime, still ? 0 : (now - t0) / 1000)
      gl.uniform1f(uProgress, progressRef?.current ?? 0.5)
      gl.uniform1f(uAspect, aspect)
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0)
      if (visible && !still) raf = requestAnimationFrame(draw)
    }
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !raf) raf = requestAnimationFrame(draw)
    })
    io.observe(canvas)
    // مع تقليل الحركة: فريم واحد ثابت، ويتحدّث مع التمرير بس
    const onScroll = () => {
      if (still && visible && !raf) raf = requestAnimationFrame(draw)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      gl.deleteBuffer(vbo)
      gl.deleteBuffer(ibo)
      gl.deleteProgram(program)
    }
  }, [progressRef])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
