import { useEffect, useRef } from 'react'

/* مية النيل والشلال بتتحرك جوه اللوحة (WebGL خفيف):
   بنرسم نفس اللوحة فوق نفسها، بس جوه قناع المية بس، مع إزاحة موجية بطيئة
   ولمعة خفيفة، ونزول متواصل في منطقة الشلال. برّه القناع شفاف تماماً
   فاللوحة الأصلية تحتها هي اللي بتبان. */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uImg;
uniform sampler2D uMask;
uniform float uT;
uniform vec2 uRange;   // y0,y1 (من فوق) لمنطقة المية داخل اللوحة
uniform vec4 uFall;    // x0,x1,y0,y1 للشلال
float hash(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  vec2 uv = vec2(vUv.x, mix(uRange.y, uRange.x, vUv.y));
  float m = texture2D(uMask, uv).r;
  if (m < 0.02) discard;
  float t = uT;
  float w1 = sin(uv.y * 820.0 + t * 1.7 + sin(uv.x * 38.0 + t * 0.6) * 2.4);
  float w2 = sin(uv.y * 470.0 - t * 1.2 + uv.x * 55.0);
  vec2 d = vec2(0.0011 * w1 + 0.0005 * w2, 0.00045 * w2);
  // الشلال: خطوط مية نازلة باستمرار
  float fx = smoothstep(uFall.x, uFall.x + 0.02, uv.x) * (1.0 - smoothstep(uFall.y - 0.02, uFall.y, uv.x));
  float fy = smoothstep(uFall.z, uFall.z + 0.01, uv.y) * (1.0 - smoothstep(uFall.w - 0.012, uFall.w, uv.y));
  float fall = fx * fy;
  float col = floor(uv.x * 260.0);
  float stream = sin(uv.y * 160.0 - t * 7.0 + hash(col) * 6.283);
  d += fall * vec2(0.0006 * sin(t * 3.0 + col), -0.0035 * stream);
  vec3 c = texture2D(uImg, uv + d * m).rgb;
  // لمعة شمس متقطعة على سطح المية
  float sp = max(0.0, sin(uv.x * 260.0 + t * 1.3 + w2 * 1.5) * sin(uv.y * 900.0 - t * 2.1));
  c += vec3(1.0, 0.97, 0.9) * pow(sp, 18.0) * 0.22 * (1.0 - fall);
  c += fall * max(0.0, stream) * 0.07;
  float a = smoothstep(0.02, 0.6, m);
  gl_FragColor = vec4(c * a, a);
}
`

export default function NileWater({ imgRef, maskSrc, range = [0.39, 0.96], fall = [0.62, 0.95, 0.628, 0.725], className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const imgEl = imgRef.current
    if (!canvas || !imgEl) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
    if (!gl) return undefined

    const sh = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    const uT = gl.getUniformLocation(prog, 'uT')
    gl.uniform2f(gl.getUniformLocation(prog, 'uRange'), range[0], range[1])
    gl.uniform4f(gl.getUniformLocation(prog, 'uFall'), fall[0], fall[1], fall[2], fall[3])
    gl.uniform1i(gl.getUniformLocation(prog, 'uImg'), 0)
    gl.uniform1i(gl.getUniformLocation(prog, 'uMask'), 1)

    const makeTex = (unit, source, format) => {
      const tex = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, source)
    }

    let disposed = false
    let ready = 0
    let visible = false
    let raf = 0
    const t0 = performance.now()

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25) * 0.8
      canvas.width = Math.max(2, Math.round(r.width * dpr))
      canvas.height = Math.max(2, Math.round(r.height * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const frame = () => {
      raf = 0
      if (disposed || ready < 2 || !visible) return
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(uT, (performance.now() - t0) / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf && visible && ready >= 2) raf = requestAnimationFrame(frame)
    }

    const load = (src, cb) => {
      const im = new Image()
      im.crossOrigin = 'anonymous'
      im.decoding = 'async'
      im.onload = () => !disposed && cb(im)
      im.src = src
    }
    const paintSrc = () => imgEl.currentSrc || imgEl.src
    const startPaint = () =>
      load(paintSrc(), (im) => {
        makeTex(0, im, gl.RGB)
        ready += 1
        kick()
      })
    if (imgEl.complete && imgEl.currentSrc) startPaint()
    else imgEl.addEventListener('load', startPaint, { once: true })
    load(maskSrc, (im) => {
      makeTex(1, im, gl.LUMINANCE)
      ready += 1
      kick()
    })

    const ro = new ResizeObserver(() => {
      resize()
      kick()
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        if (visible) kick()
      },
      { rootMargin: '120px 0px' },
    )
    io.observe(canvas)
    resize()

    return () => {
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      imgEl.removeEventListener('load', startPaint)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maskSrc])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
