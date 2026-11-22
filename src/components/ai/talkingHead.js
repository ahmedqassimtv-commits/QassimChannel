/* ══ راس قاسم المتكلّم (WebGL خام، من غير مكتبات) ═════════════════════
   صورة أمامية واحدة متقصوصة بتتحول لشبه-3D:
   - الصورة متقسّمة شبكة، وكل نقطة ليها عمق محسوب من شكل الراس
     (بيضاوي + بروز للمناخير) فلما الراس يلف بتحس بحجم حقيقي.
   - الراس بيبص ناحية الماوس، وبيتمايل لوحده بهدوء، وبيرمش.
   - الكلام: الفك بينزل والفم بيفتح (تشويه في الـ fragment shader)
     ومتزامن مع الكلمات اللي بتتنطق.
   أماكن العين والفم والذقن نسبة من الصورة (LANDMARKS) — لو الصورة
   اتغيرت، عدّل الأرقام دي بس. */

export const LANDMARKS = {
  head: [0.5, 0.43, 0.27, 0.38], // مركز الراس ونصفي القطر (x, y من فوق)
  nose: [0.5, 0.535, 0.04],
  lip: [0.497, 0.631, 0.105], // نص الفم، خط الشفايف، نص عرض الفم
  jaw: [0.5, 0.69, 0.19, 0.11],
  eyeL: [0.37, 0.415],
  eyeR: [0.615, 0.415],
}

const VERT = `
attribute vec2 aUv;
uniform mat4 uProj;
uniform float uAspect, uYaw, uPitch, uRoll;
uniform vec4 uHead;
uniform vec3 uNose;
varying vec2 vUv;

void main() {
  vUv = aUv;
  vec2 t = vec2(aUv.x, 1.0 - aUv.y);
  vec2 h = (t - uHead.xy) / uHead.zw;
  float d = dot(h, h);
  float z = d < 1.0 ? 0.2 * sqrt(1.0 - d) : 0.0;
  vec2 n = (t - uNose.xy) / uNose.z;
  z += 0.05 * exp(-dot(n, n));
  z += 0.04 * smoothstep(0.75, 0.95, t.y);

  vec3 p = vec3((aUv.x - 0.5) * uAspect, aUv.y - 0.5, z);
  float w = mix(0.22, 1.0, smoothstep(1.5, 0.9, d));
  float py = 0.5 - uHead.y;
  p.y -= py;
  float ay = uYaw * w, ax = uPitch * w, az = uRoll * w;
  p = vec3(p.x * cos(ay) + p.z * sin(ay), p.y, -p.x * sin(ay) + p.z * cos(ay));
  p = vec3(p.x, p.y * cos(ax) - p.z * sin(ax), p.y * sin(ax) + p.z * cos(ax));
  p = vec3(p.x * cos(az) - p.y * sin(az), p.x * sin(az) + p.y * cos(az), p.z);
  p.y += py;
  gl_Position = uProj * vec4(p.x, p.y, p.z - 2.05, 1.0);
}
`

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform float uJaw, uBlink;
uniform vec3 uLip;
uniform vec4 uJawE;
uniform vec4 uEyes;
varying vec2 vUv;

void main() {
  vec2 t = vec2(vUv.x, 1.0 - vUv.y);
  vec2 s = t;

  // الفك: كل اللي تحت خط الشفايف بينزل، وأقوى في النص
  vec2 jc = (t - uJawE.xy) / uJawE.zw;
  float f = t.y > uLip.y ? smoothstep(1.0, 0.3, dot(jc, jc)) : 0.0;
  float j = uJaw * 0.03;
  s.y -= j * f;

  // الرمش: الجفن اللي فوق بينزل على العين
  vec2 e1 = (t - uEyes.xy) / vec2(0.047, 0.023);
  vec2 e2 = (t - uEyes.zw) / vec2(0.047, 0.023);
  float em = max(smoothstep(1.0, 0.45, dot(e1, e1)), smoothstep(1.0, 0.45, dot(e2, e2)));
  s.y -= 0.034 * em * uBlink;

  vec4 c = texture2D(uTex, vec2(s.x, 1.0 - s.y));

  // جوه الفم: الفراغ اللي بيتفتح بين الشفايف
  float mw = smoothstep(uLip.z, uLip.z * 0.55, abs(t.x - uLip.x));
  float gap = step(uLip.y, t.y) * step(t.y, uLip.y + j * f);
  float open = gap * mw * smoothstep(0.0, 0.004, j * f);
  c.rgb = mix(c.rgb, vec3(0.17, 0.05, 0.06), open * 0.92);

  c.a *= smoothstep(1.0, 0.86, t.y); // الصدر بيختفي تدريجي تحت
  if (c.a < 0.04) discard;
  gl_FragColor = c;
}
`

function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2)
  const nf = 1 / (near - far)
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ])
}

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) || 'shader')
  return s
}

export class TalkingHead {
  constructor(canvas, { src, imageAspect = 1024 / 1176, landmarks = LANDMARKS } = {}) {
    this.canvas = canvas
    this.aspect = imageAspect
    this.L = landmarks
    this.look = { x: 0, y: 0 }
    this.cur = { yaw: 0, pitch: 0, jaw: 0, blink: 0 }
    this.speaking = false
    this.pulseT = 0
    this.nextBlink = performance.now() + 1800
    this.blinkStart = 0
    this.visible = true
    this.raf = 0
    this.ready = false

    const gl = canvas.getContext('webgl', {
      premultipliedAlpha: false,
      alpha: true,
      antialias: true,
    })
    if (!gl) throw new Error('webgl')
    this.gl = gl
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(prog) || 'link')
    gl.useProgram(prog)
    this.prog = prog

    // شبكة 96×110 مثلث
    const NX = 96
    const NY = 110
    const uv = new Float32Array((NX + 1) * (NY + 1) * 2)
    let k = 0
    for (let y = 0; y <= NY; y++)
      for (let x = 0; x <= NX; x++) {
        uv[k++] = x / NX
        uv[k++] = y / NY
      }
    const idx = new Uint16Array(NX * NY * 6)
    k = 0
    for (let y = 0; y < NY; y++)
      for (let x = 0; x < NX; x++) {
        const a = y * (NX + 1) + x
        const b = a + 1
        const c = a + NX + 1
        const d = c + 1
        idx.set([a, b, c, b, d, c], k)
        k += 6
      }
    this.count = idx.length
    const vb = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vb)
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
    const ib = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aUv')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    this.buffers = [vb, ib]

    const u = (n) => gl.getUniformLocation(prog, n)
    this.u = {
      proj: u('uProj'),
      aspect: u('uAspect'),
      yaw: u('uYaw'),
      pitch: u('uPitch'),
      roll: u('uRoll'),
      head: u('uHead'),
      nose: u('uNose'),
      jaw: u('uJaw'),
      blink: u('uBlink'),
      lip: u('uLip'),
      jawE: u('uJawE'),
      eyes: u('uEyes'),
      tex: u('uTex'),
    }
    const L = this.L
    gl.uniform4f(this.u.head, ...L.head)
    gl.uniform3f(this.u.nose, ...L.nose)
    gl.uniform3f(this.u.lip, ...L.lip)
    gl.uniform4f(this.u.jawE, ...L.jaw)
    gl.uniform4f(this.u.eyes, ...L.eyeL, ...L.eyeR)
    gl.uniform1f(this.u.aspect, this.aspect)
    gl.uniform1i(this.u.tex, 0)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    this.tex = gl.createTexture()
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (!this.gl) return
      gl.bindTexture(gl.TEXTURE_2D, this.tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      this.ready = true
      this.onReady?.()
    }
    img.src = src

    this.resize()
    this.loop = this.loop.bind(this)
    this.raf = requestAnimationFrame(this.loop)
  }

  resize() {
    const { canvas, gl } = this
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0, 0, w, h)
    gl.uniformMatrix4fv(this.u.proj, false, perspective((30 * Math.PI) / 180, w / h, 0.1, 10))
  }

  /** x, y من -1 لـ 1 (مكان الماوس بالنسبة للراس) */
  setLook(x, y) {
    this.look.x = Math.max(-1, Math.min(1, x))
    this.look.y = Math.max(-1, Math.min(1, y))
  }

  setSpeaking(on) {
    this.speaking = on
  }

  /** نبضة لكل كلمة بتتنطق */
  pulse() {
    this.pulseT = performance.now()
  }

  loop(now) {
    this.raf = requestAnimationFrame(this.loop)
    if (!this.ready || !this.visible) return
    const { gl, u, cur } = this
    const t = now / 1000
    const reduce = this.reduceMotion

    const idleYaw = reduce ? 0 : Math.sin(t * 0.45) * 0.06
    const idlePitch = reduce ? 0 : Math.sin(t * 0.7) * 0.025
    const tyaw = this.look.x * 0.42 + idleYaw
    const tpitch = -this.look.y * 0.2 + idlePitch
    cur.yaw += (tyaw - cur.yaw) * 0.08
    cur.pitch += (tpitch - cur.pitch) * 0.08

    let tjaw = 0
    if (this.speaking) {
      const since = (now - this.pulseT) / 1000
      const word = Math.exp(-since * 5)
      tjaw = Math.abs(Math.sin(t * 13.5)) * (0.35 + 0.65 * Math.max(word, 0.35))
    }
    cur.jaw += (tjaw - cur.jaw) * 0.35

    if (now > this.nextBlink && !this.blinkStart) this.blinkStart = now
    if (this.blinkStart) {
      const p = (now - this.blinkStart) / 170
      cur.blink = p < 0.5 ? p * 2 : Math.max(0, 2 - p * 2)
      if (p >= 1) {
        this.blinkStart = 0
        cur.blink = 0
        this.nextBlink = now + 2200 + Math.random() * 3200
      }
    }

    gl.uniform1f(u.yaw, cur.yaw)
    gl.uniform1f(u.pitch, cur.pitch)
    gl.uniform1f(u.roll, reduce ? 0 : Math.sin(t * 0.5) * 0.015)
    gl.uniform1f(u.jaw, cur.jaw)
    gl.uniform1f(u.blink, cur.blink)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    const { gl } = this
    if (!gl) return
    this.buffers.forEach((b) => gl.deleteBuffer(b))
    gl.deleteTexture(this.tex)
    gl.deleteProgram(this.prog)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    this.gl = null
  }
}
