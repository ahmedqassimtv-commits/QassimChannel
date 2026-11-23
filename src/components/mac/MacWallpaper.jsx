import { useEffect, useRef } from 'react'

/*
 * خلفية سطح المكتب — حرير داكن بيتحرك.
 * نفس روح خلفية macOS الداكنة (طبقات قماش مطوية فوق بعض بحافة منورة)،
 * بس مرسومة من الصفر بـshader ومتلونة من ألوان الثيم، والطبقات بتموج ببطء
 * وبتميل مع الماوس. بترسم بنص الدقة (الحرير ناعم أصلاً) وبتقف لما التاب يستخبى،
 * ومع تقليل الحركة بترسم فريم واحد ثابت.
 */

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;
uniform vec3 cInk;uniform vec3 cDeep;uniform vec3 cForest;uniform vec3 cMoss;uniform vec3 cGlow;uniform float uLight;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+1.),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
/* طبقة حرير: بتغطي اللي تحت خط القمة، بلمعة ساتان وحافة منورة رفيعة */
vec3 layer(vec3 col,vec2 q,float y,float tone,float t,float k){
  float d=y-q.y;
  float aa=1.6/uRes.y;
  float cover=smoothstep(-aa,aa,d);
  float satin=.5+.5*sin((q.x*1.7-q.y*2.6)*(2.2+k*.6)+t*1.2+k*2.)*(.55+.45*fbm(q*1.6+k+t*.2));
  vec3 lo=mix(cInk,cDeep,.75);
  vec3 hi=mix(cMoss,cGlow,.18+.08*k);
  float lift=exp(-d*(2.6+k*.8));
  vec3 face=mix(lo,mix(cForest,hi,lift),.35+.65*lift)*(.78+.3*satin*lift);
  vec3 shade=col*mix(.35,1.,smoothstep(0.,.18,-d));
  col=mix(shade,face,cover);
  col+=mix(cGlow,vec3(1.),.35)*exp(-abs(d)*uRes.y*.09)*(.5+.25*sin(q.x*3.1+t*1.7+k))*tone;
  return col;
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;
  vec2 p=vec2(uv.x*asp,uv.y);float X=uv.x;
  float t=uTime*.14;
  vec2 q=p+.05*vec2(fbm(p*1.2+t*.35),fbm(p*1.2-t*.3+4.2))+uMouse*vec2(.03,.018);
  float qx=q.x/asp;
  vec3 col=mix(cDeep,cInk,smoothstep(.0,1.,uv.y));
  /* ضباب بنفسجي فوق على الشمال */
  col=mix(col,mix(cForest,cGlow,.25),.55*smoothstep(.9,.0,length((uv-vec2(.1,.75))*vec2(1.,1.4))));
  float w=sin(qx*4.+t)*.025+sin(qx*9.-t*1.4)*.01;
  /* ورا: موجة عالية على اليمين */
  col=layer(col,q,.66+.24*smoothstep(.25,1.15,qx)+w+.03*sin(t*.7),.55,t,0.);
  /* النص: الطية القطرية الكبيرة من تحت شمال لفوق يمين */
  col=layer(col,q,.04+.78*smoothstep(-.15,1.25,qx)+.06*sin(qx*3.-t*.8)+w*1.4,1.,t,1.);
  /* قدّام: تموجة واطية */
  col=layer(col,q,.1+.16*smoothstep(.45,1.3,qx)+.04*sin(qx*5.+t*1.1)-.05*smoothstep(.5,0.,qx),.7,t,2.);
  float v=smoothstep(1.35,.2,length((uv-vec2(.5,.5))*vec2(1.,1.2)));
  col*=mix(mix(.6,.9,uLight),1.05,v);
  col+=(h(gl_FragCoord.xy+fract(uTime))-.5)*.016;
  gl_FragColor=vec4(col,1.);
}`

function readRgb(style, name, fallback) {
  const raw = style.getPropertyValue(name).trim()
  const parts = raw.split(/[\s,]+/).map(Number).filter((v) => !Number.isNaN(v))
  return parts.length >= 3 ? parts.slice(0, 3).map((v) => v / 255) : fallback
}

function readPalette() {
  const s = getComputedStyle(document.documentElement)
  return {
    ink: readRgb(s, '--qz-ink-rgb', [0.03, 0.04, 0.12]),
    deep: readRgb(s, '--qz-deep-rgb', [0.05, 0.08, 0.25]),
    forest: readRgb(s, '--qz-forest-rgb', [0.1, 0.14, 0.44]),
    moss: readRgb(s, '--qz-moss-rgb', [0.2, 0.25, 0.72]),
    glow: readRgb(s, '--qz-glow-rgb', [0.52, 0.59, 1]),
    light: document.documentElement.dataset.theme === 'blue' ? 1 : 0,
  }
}

export default function MacWallpaper() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) {
      canvas.dataset.fallback = 'true'
      return undefined
    }

    const compile = (type, src) => {
      const sh = gl.createShader(type)
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) {
      canvas.dataset.fallback = 'true'
      return undefined
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
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

    const u = (name) => gl.getUniformLocation(prog, name)
    const U = {
      res: u('uRes'), time: u('uTime'), mouse: u('uMouse'), light: u('uLight'),
      ink: u('cInk'), deep: u('cDeep'), forest: u('cForest'), moss: u('cMoss'), glow: u('cGlow'),
    }

    const applyPalette = () => {
      const pal = readPalette()
      gl.uniform3fv(U.ink, pal.ink)
      gl.uniform3fv(U.deep, pal.deep)
      gl.uniform3fv(U.forest, pal.forest)
      gl.uniform3fv(U.moss, pal.moss)
      gl.uniform3fv(U.glow, pal.glow)
      gl.uniform1f(U.light, pal.light)
    }
    applyPalette()

    const scale = 0.5
    const resize = () => {
      const w = Math.max(2, Math.round(window.innerWidth * scale))
      const h = Math.max(2, Math.round(window.innerHeight * scale))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      gl.uniform2f(U.res, w, h)
    }
    resize()

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.ty = (0.5 - e.clientY / window.innerHeight) * 2
    }

    let raf = 0
    let last = 0
    const start = performance.now() - 40000
    const draw = (now) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 1000 / 40) return
      last = now
      mouse.x += (mouse.tx - mouse.x) * 0.04
      mouse.y += (mouse.ty - mouse.y) * 0.04
      gl.uniform1f(U.time, (now - start) / 1000)
      gl.uniform2f(U.mouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const renderOnce = () => {
      gl.uniform1f(U.time, 40)
      gl.uniform2f(U.mouse, 0, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden && !reduce) raf = requestAnimationFrame(draw)
    }
    const onResize = () => {
      resize()
      if (reduce) renderOnce()
    }
    const mo = new MutationObserver(() => {
      applyPalette()
      if (reduce) renderOnce()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    window.addEventListener('resize', onResize)
    if (reduce) renderOnce()
    else {
      window.addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('visibilitychange', onVisibility)
      raf = requestAnimationFrame(draw)
    }
    canvas.dataset.ready = 'true'

    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return (
    <div className="mac-wallpaper" aria-hidden="true">
      <canvas ref={canvasRef} className="mac-wallpaper-canvas" />
    </div>
  )
}
