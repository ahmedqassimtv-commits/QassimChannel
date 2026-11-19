"use client"

/**
 * Nimbus UI · Liquid Navbar — "Waterline" + Qassim Theme-Aware Engine
 * A pill of water: active drop stretches toward the item you pick, splits into
 * droplets on long jumps and merges back with a ripple. The cursor lifts a meniscus,
 * every tap sends a wave along the pill, and each icon plays its own little scene.
 * Water is drawn by a tiny WebGL shader (only inside the pill, paused off-screen);
 * without WebGL it falls back to a CSS drop. Combined with LiquidGlass optical shell.
 */

import * as React from "react"
import { LiquidGlass } from "./LiquidGlass"

export type NimbusFx = "plane" | "drop" | "spin" | "glow" | "wave" | "pop" | "none"
export type WaterPaletteName = "water" | "green" | "red" | "gold"

export type LiquidNavItem = {
  label: string
  href?: string
  icon?: React.ReactNode
  /** the little scene the icon plays when tapped */
  fx?: NimbusFx
}

export type LiquidNavbarProps = {
  items?: LiquidNavItem[]
  defaultActive?: number
  active?: number
  onChange?: (index: number, item: LiquidNavItem) => void
  /** "light" water for bright backgrounds, "dark" for dark ones */
  tone?: "light" | "dark"
  /** optional Qassim theme palette harmony */
  palette?: WaterPaletteName
  /** icons only */
  compact?: boolean
  /** soft synthesized "plip" on tap (no audio files) */
  sound?: boolean
  className?: string
  style?: React.CSSProperties
}

/* ---------- icons ---------- */
const I = (d: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {d}
  </svg>
)

export const NimbusIcons = {
  home: I(
    <>
      <path d="M3.5 11.2 12 4l8.5 7.2" />
      <path d="M6 9.6V20h12V9.6" />
      <path className="nv-door" d="M10 20v-5h4v5Z" />
    </>
  ),
  globe: I(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17" />
    </>
  ),
  plane: I(<path d="M21 12.2 3.6 5.4l2.7 6.8-2.7 6.4L21 12.2Zm-14.7 0H13" />),
  drop: I(<path d="M12 3.5s6 6.4 6 10.6a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5Z" />),
  user: I(
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.8 20c1.2-3.4 4-5 7.2-5s6 1.6 7.2 5" />
    </>
  ),
  verdict: I(
    <>
      <path d="M12 3v17" />
      <path d="M5 7h14" />
      <path d="m5 7-2.6 5.5a3 3 0 0 0 5.2 0L5 7Z" />
      <path d="m19 7-2.6 5.5a3 3 0 0 0 5.2 0L19 7Z" />
      <path d="M8.5 20h7" />
    </>
  ),
  stories: I(
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.3-5.8L3.5 8.5" />
      <path d="M3.5 4v4.5H8" />
      <path d="M12 7.5v4.8l3.2 2" />
    </>
  ),
  videos: I(
    <>
      <rect x="3" y="5.5" width="13" height="13" rx="3" />
      <path d="m16 10.2 4.6-2.5a.8.8 0 0 1 1.2.7v7.2a.8.8 0 0 1-1.2.7L16 13.8" />
      <path className="nv-door" d="m8.3 9.7 3.8 2.3-3.8 2.3V9.7Z" />
    </>
  ),
  articles: I(
    <>
      <path d="M12 6.2C10.2 4.9 7.4 4.5 4 5v13.2c3.4-.5 6.2-.1 8 1.2 1.8-1.3 4.6-1.7 8-1.2V5c-3.4-.5-6.2-.1-8 1.2Z" />
      <path d="M12 6.2v13.2" />
    </>
  ),
  compass: I(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <polygon className="nv-door" points="15.8 8.2 13.5 13.5 8.2 15.8 10.5 10.5 15.8 8.2" />
    </>
  ),
}

const DEFAULT_ITEMS: LiquidNavItem[] = [
  { label: "Home", icon: NimbusIcons.home, fx: "glow" },
  { label: "Explore", icon: NimbusIcons.globe, fx: "spin" },
  { label: "Flights", icon: NimbusIcons.plane, fx: "plane" },
  { label: "Weather", icon: NimbusIcons.drop, fx: "drop" },
  { label: "Profile", icon: NimbusIcons.user, fx: "wave" },
]

export const WATER_PAD = 14 // canvas bleed around the pill, for shadows and ripples

type RGB = [number, number, number]

const PALETTES: Record<WaterPaletteName, { lightTint: RGB; darkTint: RGB; lightRim: RGB; darkRim: RGB; shadow: RGB }> = {
  water: {
    lightTint: [0.8, 0.95, 1.0],
    darkTint: [0.55, 0.82, 1.0],
    lightRim: [0.0, 0.42, 0.78],
    darkRim: [0.1, 0.55, 0.95],
    shadow: [0.0, 0.14, 0.36],
  },
  green: {
    lightTint: [0.84, 0.98, 0.91],
    darkTint: [0.64, 0.95, 0.84],
    lightRim: [0.08, 0.56, 0.44],
    darkRim: [0.22, 0.82, 0.66],
    shadow: [0.01, 0.13, 0.11],
  },
  red: {
    lightTint: [1.0, 0.9, 0.76],
    darkTint: [1.0, 0.76, 0.52],
    lightRim: [0.88, 0.32, 0.12],
    darkRim: [1.0, 0.48, 0.18],
    shadow: [0.18, 0.04, 0.01],
  },
  gold: {
    lightTint: [1.0, 0.95, 0.78],
    darkTint: [1.0, 0.88, 0.52],
    lightRim: [0.76, 0.56, 0.16],
    darkRim: [0.96, 0.76, 0.26],
    shadow: [0.16, 0.11, 0.02],
  },
}

/* ---------- the water shader ---------- */
const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`
const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uDpr;uniform float uTime;uniform vec4 uPill;
uniform vec4 uBlob[6];uniform float uSy[6];uniform vec4 uRip[6];uniform vec3 uMouse;
uniform float uDark;uniform float uAmb;uniform float uTrackRim;
uniform vec3 uTint;uniform vec3 uRimCol;uniform vec3 uShadowCol;
float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float sdCap(vec2 p,vec4 B,float sy){p-=B.xy;p.y/=sy;p.x=max(abs(p.x)-B.z,0.);return(length(p)-B.w)*min(1.,sy);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float dropD(vec2 p){float d=1e4;for(int i=0;i<6;i++){if(uBlob[i].w>.5){d=smin(d,sdCap(p,uBlob[i],uSy[i]),13.);}}return d;}
float pillD(vec2 p){vec2 h=uPill.zw*.5;return sdRB(p-uPill.xy-h,h,h.y);}
float lens(float d,float w){float t=clamp(-d/w,0.,1.);return sqrt(1.-(1.-t)*(1.-t));}
float waves(vec2 p){float w=0.;
 for(int i=0;i<6;i++){vec4 R=uRip[i];if(R.w>0.){float x=length(p-R.xy)-R.z*240.;w+=R.w*exp(-R.z*1.7)*sin(x*.3)*exp(-x*x/700.);}}
 vec2 m=p-uMouse.xy;w+=uMouse.z*3.6*exp(-dot(m,m)/1000.);
 w+=uAmb*(sin(p.x*.05+uTime*1.2)*.45+sin(p.x*.13-uTime*.85+p.y*.2)*.25);return w;}
float H(vec2 p){float dp=pillD(p);return lens(dp,uPill.w*.36)*2.4*uTrackRim+lens(dropD(p),11.)*7.5+waves(p)*smoothstep(0.,7.,-dp);}
float caus(vec2 p,float t){vec2 q=p;float c=0.;for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.1+t),cos(q.x*1.3-t*.7))*.6;c+=1./(1.+16.*abs(sin(q.x)*sin(q.y)));}return c/3.;}
void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;
 float dp=pillD(p);float dd=dropD(p);
 float h0=H(p);vec3 n=normalize(vec3(h0-H(p+vec2(1.,0.)),h0-H(p+vec2(0.,1.)),1.));
 vec3 V=vec3(0.,0.,1.);
 float spec=pow(max(dot(reflect(-normalize(vec3(-.45,-.8,.85)),n),V),0.),70.);
 float spec2=pow(max(dot(reflect(-normalize(vec3(.6,.75,.7)),n),V),0.),22.)*.3;
 float fres=clamp((1.-n.z)*4.,0.,1.);
 vec3 irid=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+fres*.85+p.x*.0028+uTime*.035));
 float pm=smoothstep(1.,-1.,dp);float dm=smoothstep(1.,-1.,dd)*smoothstep(1.,-2.,dp);
 float sh=smoothstep(9.,-9.,dropD(p-vec2(0.,5.)))*(1.-dm)*pm*(.11+.09*uDark);
 vec3 c=uShadowCol*sh;float a=sh;
 float pa=clamp(pm*(fres*.5*uTrackRim+spec*.9+spec2),0.,1.);
 c=mix(vec3(1.),mix(irid,uTint,.45),.5*fres)*pa+c*(1.-pa);a=pa+a*(1.-pa);
 float th=lens(dd,11.);
 float cs=caus((p+n.xy*th*18.)*.085,uTime*.9);
 float rim=dm*(1.-smoothstep(0.,8.,-dd));
 float cres=dm*smoothstep(.12,.55,dot(n.xy,normalize(vec2(.55,.85))))*smoothstep(0.,3.,-dd);
 float body=.5+.5*clamp(-n.y*3.,-1.,1.);
 float da=dm*(.28+.15*body)*(1.-.22*uDark);vec3 dc=mix(uTint,vec3(1.),body*.52);
 float la=rim*(.26+.14*uDark);dc=uRimCol*la+dc*da*(1.-la);da=la+da*(1.-la);
 la=clamp(cres*.72+smoothstep(.6,1.,cs)*.3*th*dm,0.,1.);dc=mix(vec3(1.),uTint,.18*uDark)*la+dc*(1.-la);da=la+da*(1.-la);
 la=clamp(dm*(spec*1.22+spec2*.52),0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=dm*smoothstep(-2.,0.,dd)*.42;dc=mix(vec3(1.),mix(irid,uTint,.55),.42)*la+dc*(1.-la);da=la+da*(1.-la);
 c=dc+c*(1.-da);a=da+a*(1.-da);
 gl_FragColor=vec4(c,a);
}`

type Body = { x: number; v: number }
type Sat = { x: number; y: number; vx: number; vy: number; r: number; k: number }
type Rip = { x: number; y: number; age: number; amp: number }

interface GLContextHandle {
  gl: WebGLRenderingContext
  u: Record<string, WebGLUniformLocation | null>
  dispose: () => void
}

function makeState() {
  return {
    a: { x: 0, v: 0 } as Body,
    b: { x: 0, v: 0 } as Body,
    sy: { s: 1, v: 0 },
    lead: 0 as 0 | 1,
    lagFrom: 0,
    sats: [] as Sat[],
    rips: [] as Rip[],
    t: { x: 0, cy: 0, q: 0, r: 20 },
    q: 0,
    mouse: { x: 0, y: 0, s: 0, on: false },
    tint: [0.64, 0.95, 0.84] as RGB,
    rimCol: [0.22, 0.82, 0.66] as RGB,
    shadowCol: [0.01, 0.13, 0.11] as RGB,
    colorBusy: false,
    moving: false,
    split: false,
    ready: false,
    w: 0,
    h: 0,
    visible: true,
    reduce: false,
    raf: 0,
    last: 0,
    time: 0,
    glc: null as null | GLContextHandle,
  }
}

function initGL(canvas: HTMLCanvasElement): GLContextHandle | null {
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: true,
    alpha: true,
    antialias: false,
  }) as WebGLRenderingContext | null
  if (!gl) return null
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s)
      return null
    }
    return s
  }
  const vs = sh(gl.VERTEX_SHADER, VERT)
  const fs = sh(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs)
    if (fs) gl.deleteShader(fs)
    return null
  }
  const p = gl.createProgram()!
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    gl.deleteProgram(p)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return null
  }
  gl.useProgram(p)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(p, "a")
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const u: Record<string, WebGLUniformLocation | null> = {}
  for (const n of [
    "uRes",
    "uDpr",
    "uTime",
    "uPill",
    "uBlob",
    "uSy",
    "uRip",
    "uMouse",
    "uDark",
    "uAmb",
    "uTrackRim",
    "uTint",
    "uRimCol",
    "uShadowCol",
  ]) {
    u[n] = gl.getUniformLocation(p, n)
  }
  return {
    gl,
    u,
    dispose() {
      try {
        if (buf) gl.deleteBuffer(buf)
        gl.deleteProgram(p)
        gl.deleteShader(vs)
        gl.deleteShader(fs)
      } catch {
        /* context already lost */
      }
    },
  }
}

export interface UseWaterlineOptions {
  activeIndex: number
  itemCount: number
  tone?: "light" | "dark"
  palette?: WaterPaletteName
  /** Rim strength around the pill track (0 = invisible track rim, 1 = full Nimbus rim). */
  trackRim?: number
  /** Ambient idle water shimmer strength (0..1). */
  ambient?: number
  /** Edge inset in px for droplet bounce walls. */
  wallInset?: number
  sound?: boolean
  /** Pause the WebGL animation loop while keeping the context warm. */
  paused?: boolean
}

export function useWaterline({
  activeIndex,
  itemCount,
  tone = "dark",
  palette = "green",
  trackRim = 0.14,
  ambient = 0.65,
  wallInset = 4,
  sound = false,
  paused = false,
}: UseWaterlineOptions) {
  const trackRef = React.useRef<HTMLElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const dropRef = React.useRef<HTMLSpanElement | null>(null)
  const itemRefs = React.useRef<(HTMLElement | null)[]>([])
  const iconRefs = React.useRef<(HTMLSpanElement | null)[]>([])
  const audioRef = React.useRef<AudioContext | null>(null)
  const dropTimerRef = React.useRef<number | null>(null)
  const st = React.useRef(makeState())

  const [glMode, setGlMode] = React.useState<"on" | "off">("on")
  const [fx, setFx] = React.useState({ i: -1, n: 0 })

  const dark = tone === "dark" ? 1 : 0
  const cfgRef = React.useRef({ dark, palette, trackRim, ambient, wallInset, paused })
  cfgRef.current = { dark, palette, trackRim, ambient, wallInset, paused }

  const draw = React.useCallback(() => {
    const s = st.current
    if (!s.ready || s.w < 4 || s.h < 4) return
    const T = s.t
    const sep = Math.abs(s.a.x - s.b.x)
    const thin = Math.min(sep / (2 * (s.q + T.r) || 1), 1)
    const r = T.r * (1 - 0.3 * thin)
    if (s.glc) {
      const { gl: g, u } = s.glc
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight)
      g.uniform2f(u.uRes, s.w + WATER_PAD * 2, s.h + WATER_PAD * 2)
      g.uniform1f(u.uDpr, dpr)
      g.uniform1f(u.uTime, s.time)
      g.uniform4f(u.uPill, WATER_PAD, WATER_PAD, s.w, s.h)
      const blobs = new Float32Array(24)
      const sy = new Float32Array(6).fill(1)
      const head = s.lead === 0 ? s.a : s.b
      const tail = s.lead === 0 ? s.b : s.a
      blobs.set(
        [
          head.x,
          T.cy,
          s.q * (1 - 0.25 * thin),
          T.r * (1 - 0.12 * thin),
          tail.x,
          T.cy,
          s.q * (1 - 0.8 * thin),
          T.r * (1 - 0.5 * thin),
        ],
        0
      )
      sy[0] = sy[1] = s.sy.s
      s.sats.slice(0, 4).forEach((d, i) => blobs.set([d.x, d.y, 0, d.r], 8 + i * 4))
      g.uniform4fv(u.uBlob, blobs)
      g.uniform1fv(u.uSy, sy)
      const rips = new Float32Array(24)
      s.rips.slice(-6).forEach((p, i) => rips.set([p.x, p.y, p.age, p.amp], i * 4))
      g.uniform4fv(u.uRip, rips)
      g.uniform3f(u.uMouse, s.mouse.x, s.mouse.y, s.mouse.s)
      g.uniform1f(u.uDark, cfgRef.current.dark)
      g.uniform1f(u.uAmb, s.reduce ? 0 : cfgRef.current.ambient)
      g.uniform1f(u.uTrackRim, cfgRef.current.trackRim)
      g.uniform3f(u.uTint, s.tint[0], s.tint[1], s.tint[2])
      g.uniform3f(u.uRimCol, s.rimCol[0], s.rimCol[1], s.rimCol[2])
      g.uniform3f(u.uShadowCol, s.shadowCol[0], s.shadowCol[1], s.shadowCol[2])
      g.clearColor(0, 0, 0, 0)
      g.clear(g.COLOR_BUFFER_BIT)
      g.drawArrays(g.TRIANGLES, 0, 3)
    } else if (dropRef.current) {
      const left = Math.min(s.a.x, s.b.x) - s.q - r - WATER_PAD
      const width = sep + 2 * (s.q + r)
      dropRef.current.style.width = `${width.toFixed(1)}px`
      dropRef.current.style.transform = `translate3d(${left.toFixed(1)}px, 0, 0) scaleY(${s.sy.s.toFixed(4)})`
    }
  }, [])

  const step = React.useCallback((dt: number, now: number) => {
    const s = st.current
    const T = s.t
    const cfg = cfgRef.current
    s.time += dt
    s.q += (T.q - s.q) * Math.min(1, dt * 12)

    // Smooth palette color morphing across theme switches
    const pal = PALETTES[cfg.palette] || PALETTES.water
    const targetTint = cfg.dark ? pal.darkTint : pal.lightTint
    const targetRim = cfg.dark ? pal.darkRim : pal.lightRim
    const colorLerp = Math.min(1, dt * 6)
    let colorBusy = false
    for (let c = 0; c < 3; c++) {
      s.tint[c] += (targetTint[c] - s.tint[c]) * colorLerp
      s.rimCol[c] += (targetRim[c] - s.rimCol[c]) * colorLerp
      s.shadowCol[c] += (pal.shadow[c] - s.shadowCol[c]) * colorLerp
      if (Math.abs(targetTint[c] - s.tint[c]) > 0.003) colorBusy = true
    }
    s.colorBusy = colorBusy

    const bodies = [s.a, s.b]
    let still = true
    if (s.reduce) {
      s.a.x = s.b.x = T.x
      s.a.v = s.b.v = 0
      s.sy.s = 1
      s.sats = []
    } else {
      const inset = cfg.wallInset
      bodies.forEach((B, i) => {
        const lead = i === s.lead
        const k = lead ? 210 : 72
        const c = lead ? 25 : 13
        const f = !lead && now < s.lagFrom ? 0.08 : 1
        B.v += (k * (T.x - B.x) - c * B.v) * dt * f
        B.x += B.v * dt
        const lo = WATER_PAD + inset + s.q + T.r - 3
        const hi = WATER_PAD + s.w - inset - s.q - T.r + 3
        if (hi > lo && (B.x < lo || B.x > hi)) {
          s.sy.v -= Math.min(Math.abs(B.v), 900) * 0.0016
          B.x = Math.max(lo, Math.min(hi, B.x))
          B.v *= -0.25
        }
        if (Math.abs(T.x - B.x) > 0.3 || Math.abs(B.v) > 3) still = false
      })

      const L = bodies[s.lead]
      const syT = 1 - 0.2 * Math.min(Math.abs(L.v) / 1500, 1)
      s.sy.v += (280 * (syT - s.sy.s) - 9 * s.sy.v) * dt
      s.sy.s += s.sy.v * dt
      if (Math.abs(s.sy.s - 1) > 0.002 || Math.abs(s.sy.v) > 0.02) still = false

      // Break the liquid neck: spawn satellite droplets between tail and head on long jumps
      const sep = Math.abs(s.a.x - s.b.x)
      const r = T.r * (1 - 0.3 * Math.min(sep / (2 * (T.q + T.r) || 1), 1))
      if (!s.split && s.moving && sep - 2 * T.q - 2 * r > -6) {
        s.split = true
        const lo = bodies[1 - s.lead]
        const hi = bodies[s.lead]
        ;[0.3, 0.5, 0.72].forEach((t, j) => {
          s.sats.push({
            x: lo.x + (hi.x - lo.x) * t + (Math.random() - 0.5) * 6,
            y: T.cy + (Math.random() - 0.5) * 10,
            vx: (lo.v + hi.v) * 0.45,
            vy: (Math.random() - 0.5) * 60,
            r: 5 + Math.random() * 3 - j * 0.5,
            k: 70 + Math.random() * 90,
          })
        })
      }

      s.sats = s.sats.filter((d) => {
        d.vx += (d.k * (T.x - d.x) - 9 * d.vx) * dt
        d.vy += (90 * (T.cy - d.y) - 7 * d.vy) * dt
        d.x += d.vx * dt
        d.y += d.vy * dt
        d.x = Math.max(WATER_PAD + 6 + d.r, Math.min(WATER_PAD + s.w - 6 - d.r, d.x))
        d.y = Math.max(T.cy - T.r + d.r, Math.min(T.cy + T.r - d.r, d.y))
        if (Math.abs(T.x - d.x) < T.q + T.r * 0.5) d.r -= dt * 26
        return d.r > 0.6
      })
      if (s.sats.length) still = false
    }

    if (s.moving && still) {
      s.moving = false
      if (s.split || !s.reduce) {
        s.rips.push({ x: T.x, y: T.cy, age: 0, amp: s.split ? 1.2 : 0.7 })
      }
    }
    s.rips.forEach((p) => (p.age += dt))
    s.rips = s.rips.filter((p) => p.age < 2.4)
    const target = s.mouse.on ? 1 : 0
    s.mouse.s += (target - s.mouse.s) * Math.min(1, dt * 7)
  }, [])

  const loop = React.useCallback(() => {
    const s = st.current
    if (s.raf) return
    s.last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30)
      s.last = now
      step(dt, now)
      draw()
      const busy =
        s.moving ||
        s.colorBusy ||
        s.rips.length > 0 ||
        s.sats.length > 0 ||
        s.mouse.s > 0.01 ||
        cfgRef.current.ambient > 0.01
      const keepAlive = s.reduce ? s.moving || s.colorBusy : busy
      if (s.visible && keepAlive) s.raf = requestAnimationFrame(tick)
      else s.raf = 0
    }
    s.raf = requestAnimationFrame(tick)
  }, [draw, step])

  const measure = React.useCallback(() => {
    const nav = trackRef.current
    const el = itemRefs.current[activeIndex]
    if (!nav || !el) return
    const w = nav.offsetWidth
    const h = nav.offsetHeight
    const ew = el.offsetWidth
    const eh = el.offsetHeight
    if (w < 4 || h < 4 || ew < 4 || eh < 4) return

    const s = st.current
    s.w = w
    s.h = h
    const T = s.t
    T.r = eh / 2
    T.q = Math.max(0, ew / 2 - T.r)
    T.cy = WATER_PAD + el.offsetTop + eh / 2
    const nx = WATER_PAD + el.offsetLeft + ew / 2

    if (!s.ready) {
      const pal = PALETTES[cfgRef.current.palette] || PALETTES.water
      const initTint = cfgRef.current.dark ? pal.darkTint : pal.lightTint
      const initRim = cfgRef.current.dark ? pal.darkRim : pal.lightRim
      s.tint = [...initTint]
      s.rimCol = [...initRim]
      s.shadowCol = [...pal.shadow]
      s.a.x = s.b.x = nx
      s.q = T.q
      s.ready = true
    } else if (Math.abs(nx - T.x) > 3) {
      s.lead = Math.abs(nx - s.a.x) <= Math.abs(nx - s.b.x) ? 0 : 1
      s.lagFrom = performance.now() + 70
      s.moving = true
      s.split = false
    }
    T.x = nx

    const cv = canvasRef.current
    if (cv) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = s.w + WATER_PAD * 2
      const Hh = s.h + WATER_PAD * 2
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) {
        cv.width = Math.round(W * dpr)
        cv.height = Math.round(Hh * dpr)
        cv.style.width = `${W}px`
        cv.style.height = `${Hh}px`
      }
    }
    draw()
    loop()
  }, [activeIndex, draw, loop])

  React.useEffect(() => {
    const s = st.current
    s.reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const cv = canvasRef.current
    s.glc = cv ? initGL(cv) : null
    if (!s.glc) setGlMode("off")

    const lost = (e: Event) => {
      e.preventDefault()
      s.glc = null
      setGlMode("off")
    }
    cv?.addEventListener("webglcontextlost", lost)

    const io = new IntersectionObserver(([e]) => {
      s.visible = e.isIntersecting
      if (s.visible) loop()
    })
    if (trackRef.current) io.observe(trackRef.current)

    const vis = () => {
      s.visible = document.visibilityState === "visible"
      if (s.visible) loop()
    }
    document.addEventListener("visibilitychange", vis)

    return () => {
      cv?.removeEventListener("webglcontextlost", lost)
      io.disconnect()
      document.removeEventListener("visibilitychange", vis)
      if (dropTimerRef.current) window.clearTimeout(dropTimerRef.current)
      cancelAnimationFrame(s.raf)
      s.raf = 0
      s.glc?.dispose()
      s.glc = null
    }
  }, [loop])

  React.useLayoutEffect(() => {
    measure()
  }, [measure, itemCount])

  const measureRef = React.useRef(measure)
  measureRef.current = measure

  React.useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let lastW = track.offsetWidth
    const ro = new ResizeObserver(() => {
      const w = track.offsetWidth
      if (w < 4) return
      if (Math.abs(w - lastW) > 40 && !st.current.moving) {
        st.current.ready = false
      }
      lastW = w
      measureRef.current()
    })
    ro.observe(track)
    itemRefs.current.forEach((el) => {
      if (el) ro.observe(el)
    })
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => measureRef.current()).catch(() => {})
    }
    return () => ro.disconnect()
  }, [itemCount])

  React.useEffect(() => {
    const s = st.current
    if (paused) {
      if (s.raf) {
        cancelAnimationFrame(s.raf)
        s.raf = 0
      }
      return
    }
    draw()
    loop()
  }, [tone, palette, paused, draw, loop])

  const local = React.useCallback((clientX: number, clientY: number) => {
    const nav = trackRef.current
    if (!nav) return { x: WATER_PAD, y: WATER_PAD }
    const r = nav.getBoundingClientRect()
    return { x: clientX - r.left + WATER_PAD, y: clientY - r.top + WATER_PAD }
  }, [])

  const ripple = React.useCallback(
    (x: number, y: number, amp: number) => {
      const s = st.current
      if (s.reduce) return
      s.rips.push({ x, y, age: 0, amp })
      loop()
    },
    [loop]
  )

  const iconCenter = React.useCallback(
    (i: number) => {
      const el = iconRefs.current[i]
      if (!el) return null
      const b = el.getBoundingClientRect()
      return local(b.left + b.width / 2, b.top + b.height / 2)
    },
    [local]
  )

  const plip = React.useCallback(() => {
    if (!sound) return
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = (audioRef.current ||= new AC())
      const t = ctx.currentTime
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = "sine"
      o.frequency.setValueAtTime(420 + Math.random() * 80, t)
      o.frequency.exponentialRampToValueAtTime(1500, t + 0.07)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + 0.18)
    } catch {
      /* ignore audio restrictions */
    }
  }, [sound])

  const triggerFx = React.useCallback(
    (index: number, kind: NimbusFx = "pop") => {
      setFx((f) => ({ i: index, n: f.n + 1 }))
      plip()
      const c = iconCenter(index)
      if (c && kind === "drop") {
        if (dropTimerRef.current) window.clearTimeout(dropTimerRef.current)
        dropTimerRef.current = window.setTimeout(() => {
          ripple(c.x, st.current.t.cy, 1.4)
        }, 430)
      }
      if (c && kind === "plane") {
        ripple(c.x, c.y, 0.6)
      }
    },
    [iconCenter, plip, ripple]
  )

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return
      const p = local(e.clientX, e.clientY)
      const s = st.current
      s.mouse.x = p.x
      s.mouse.y = p.y
      s.mouse.on = true
      loop()
    },
    [local, loop]
  )

  const onPointerLeave = React.useCallback(() => {
    st.current.mouse.on = false
    loop()
  }, [loop])

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      const p = local(e.clientX, e.clientY)
      ripple(p.x, p.y, 0.8)
    },
    [local, ripple]
  )

  const registerItem = React.useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemRefs.current[index] = el
    },
    []
  )

  const registerIcon = React.useCallback(
    (index: number) => (el: HTMLSpanElement | null) => {
      iconRefs.current[index] = el
    },
    []
  )

  return {
    trackRef,
    canvasRef,
    dropRef,
    itemRefs,
    glMode,
    fx,
    registerItem,
    registerIcon,
    triggerFx,
    ripple,
    onPointerMove,
    onPointerLeave,
    onPointerDown,
  }
}

export function WaterlineLayers({
  canvasRef,
  dropRef,
  glMode,
  dropInsetY = 4,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  dropRef: React.RefObject<HTMLSpanElement | null>
  glMode: "on" | "off"
  dropInsetY?: number
}) {
  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="qz-water-canvas"
        style={{
          display: glMode === "off" ? "none" : "block",
          position: "absolute",
          left: -WATER_PAD,
          top: -WATER_PAD,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <span
        ref={dropRef}
        aria-hidden="true"
        className="qz-water-drop"
        style={{
          display: glMode === "off" ? "block" : "none",
          position: "absolute",
          top: dropInsetY,
          bottom: dropInsetY,
          left: 0,
          right: "auto",
          zIndex: 0,
          borderRadius: 9999,
          pointerEvents: "none",
          willChange: "transform, width",
        }}
      />
    </>
  )
}

export function WaterlineIcon({
  children,
  fx,
  playing,
  playKey,
  iconRef,
  className = "",
}: {
  children: React.ReactNode
  fx?: NimbusFx
  playing?: boolean
  playKey?: number
  iconRef?: React.Ref<HTMLSpanElement>
  className?: string
}) {
  const kind = fx ?? "pop"
  const activeFx = playing && kind !== "none" ? kind : undefined
  return (
    <span
      key={activeFx ? playKey : 0}
      ref={iconRef}
      data-fx={activeFx}
      className={`nv-ico ${className}`}
    >
      {children}
    </span>
  )
}

export function LiquidNavbar({
  items = DEFAULT_ITEMS,
  defaultActive = 0,
  active,
  onChange,
  tone = "light",
  palette = "water",
  compact,
  sound = false,
  className,
  style,
}: LiquidNavbarProps) {
  const [inner, setInner] = React.useState(defaultActive)
  const current = active ?? inner

  const wl = useWaterline({
    activeIndex: current,
    itemCount: items.length,
    tone,
    palette,
    trackRim: 1,
    ambient: 1,
    wallInset: 6,
    sound,
  })

  const select = (i: number) => {
    const kind = items[i]?.fx ?? (items[i]?.icon ? "pop" : "none")
    wl.triggerFx(i, kind)
    if (i !== current) {
      if (active === undefined) setInner(i)
      onChange?.(i, items[i])
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const isRtl =
      typeof document !== "undefined" &&
      wl.trackRef.current?.closest("[dir]")?.getAttribute("dir") === "rtl"
    const stepDir = e.key === "ArrowRight" ? (isRtl ? -1 : 1) : isRtl ? 1 : -1
    const n = (current + stepDir + items.length) % items.length
    select(n)
    wl.itemRefs.current[n]?.focus()
  }

  return (
    <LiquidGlass
      asChild
      appearance={tone}
      material="clear"
      refraction={20}
      dispersion={0.12}
      fallbackBlur={14}
    >
      <nav
        ref={wl.trackRef as React.RefObject<HTMLElement>}
        className={["nimbus-nav", className].filter(Boolean).join(" ")}
        data-tone={tone}
        data-gl={wl.glMode}
        data-compact={compact === undefined ? undefined : String(compact)}
        aria-label="Main"
        onKeyDown={onKeyDown}
        onPointerMove={wl.onPointerMove}
        onPointerLeave={wl.onPointerLeave}
        onPointerDown={wl.onPointerDown}
        style={style}
      >
        <WaterlineLayers canvasRef={wl.canvasRef} dropRef={wl.dropRef} glMode={wl.glMode} dropInsetY={6} />
        {items.map((it, i) => {
          const kind = it.fx ?? "pop"
          const playing = wl.fx.i === i && kind !== "none"
          const itemProps = {
            ref: wl.registerItem(i),
            className: "nimbus-item",
            "aria-current": i === current ? ("page" as const) : undefined,
            onClick: () => select(i),
          }
          const content = (
            <>
              {it.icon && (
                <WaterlineIcon
                  fx={kind}
                  playing={playing}
                  playKey={wl.fx.n}
                  iconRef={wl.registerIcon(i)}
                >
                  {it.icon}
                </WaterlineIcon>
              )}
              <span className="nimbus-label">{it.label}</span>
            </>
          )
          return it.href ? (
            <a key={it.label + i} {...(itemProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)} href={it.href} aria-label={it.label}>
              {content}
            </a>
          ) : (
            <button key={it.label + i} {...(itemProps as React.ButtonHTMLAttributes<HTMLButtonElement>)} type="button" aria-label={it.label}>
              {content}
            </button>
          )
        })}
      </nav>
    </LiquidGlass>
  )
}

/** alias for registries that import { Component } */
export { LiquidNavbar as Component }

export default LiquidNavbar
