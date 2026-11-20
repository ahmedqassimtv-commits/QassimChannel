import { useEffect, useRef } from 'react'

/* ══ ورقة «أون إير» الزجاجية (مبنية على Folding bill من bencho.dev) ══
   ورقة زجاج تقدر تمسكها: اسحبها فتنحني ورا إيدك، اطوي طرفها فتتكسّر،
   وسيبها فترجع تفرد نفسها وتطفو مكانها.

   ── قماش، مش أنيميشن ───────────────────────────────────────
   الورقة شبكة نقاط مربوطة بزنبركات بتحافظ على طولها (أفقي، رأسي،
   قطري، وكل نقطتين للانحناء) بتكامل Verlet وبتترخى كذا مرة في الفريم.
   امسك نقطة وحرّكها والباقي بيتبعها لأن الزنبركات مابتتمطّش — ده كل
   سر الطيّ.

   ── الحفر هو هوية قاسمز ────────────────────────────────────
   بدل الدولار الأصلي، الحفر مرسوم على canvas وقت التشغيل: إطار مزدوج،
   نقش خطوط ناعم زي العملات، علامة بث، ولوجو قاسمز نفسه (نفس مسار
   qassimz-logo.svg). بيتحوّل لخريطة ارتفاع (bump) فاللوجو بارز من
   الزجاج، وخريطة خشونة فالخطوط «مصنفرة».

   ── لونه من الثيم ──────────────────────────────────────────
   لون الزجاج والأوضة اللي بيعكسها بيتقروا من متغيرات الثيم
   (--qz-mint / --qz-sage / --qz-ink)، وبيتحدّثوا لوحدهم لما الثيم
   يتغير (أخضر / جمري / ذهبي).

   ── أداء ──────────────────────────────────────────────────
   three.js (~600KB) بيتحمّل من CDN أول مرة الورقة تظهر بس — مش مع
   الصفحة. على الموبايل الدقة أقل ومفيش antialias، والحلقة بتنام لما
   الورقة تهدى، وبتقف خالص لما تخرج من الشاشة. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Three = any

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js'
let threePromise: Promise<Three> | null = null
function loadThree(): Promise<Three> {
  if (!threePromise) {
    threePromise = import(/* @vite-ignore */ THREE_URL).catch((error) => {
      threePromise = null
      throw error
    })
  }
  return threePromise
}

export const BILL_W = 340
export const BILL_H = 240
/* الـ canvas أكبر من الصندوق بالمعامل ده عشان الورقة لما تتسحب أو تتطوي
   برّه الصندوق ماتتقصش عند حافة الرسم (كانت 2 وكانت بتتقص) */
const SPILL = 2.8

const SPEC = {
  nx: 46,
  ny: 20,
  w: 3.0,
  h: 3.0 / 2.35,
  cam: 3.95,
  tilt: [-0.32, 0.22, -0.06] as [number, number, number],
  fw: BILL_W,
  fh: BILL_H,
}

type Link = { a: number; b: number; len: number; k: number }

/* أبعد مسافة الإيد تسحب فيها نقطة قبل ما السحب يبقى «مطاط»،
   وأحدّ طيّة مسموحة (كنسبة من طول وصلة الانحناء) */
const REACH = 1.25
const CREASE = 0.55

/* ── ألوان الثيم ──
   الزجاج = لون --qz-mint ممزوج بربع --qz-sage، والأوضة = --qz-ink */
function cssColor(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}
function themeColors(THREE: Three) {
  const glass = new THREE.Color(cssColor('--qz-mint', '#DAF1DE')).lerp(
    new THREE.Color(cssColor('--qz-sage', '#8EB69B')),
    0.25,
  )
  const room = new THREE.Color(cssColor('--qz-ink', '#051F20')).lerp(new THREE.Color(0x101010), 0.35)
  return { glass, room }
}

/* ── الأركان المدوّرة ── */
const CORNER = 0.09
function inset(x: number, y: number, W: number, H: number) {
  const r = CORNER * H
  const qx = Math.max(r - x, x - (W - 1 - r), 0)
  const qy = Math.max(r - y, y - (H - 1 - r), 0)
  if (qx > 0 && qy > 0) return r - Math.hypot(qx, qy)
  return Math.min(x, y, W - 1 - x, H - 1 - y)
}

function outline(W: number, H: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#fff'
  g.beginPath()
  g.roundRect(0, 0, W, H, CORNER * H)
  g.fill()
  return c
}

/* ── حفر «أون إير» ────────────────────────────────────────
   حبر أسود على ورق أبيض بنفس مقاس مسح الدولار الأصلي (1024×437)
   ونفس نسب الإطار، فكل حسابات الإطار والحافة المنفوخة تفضل زي ما هي. */
/* ضعف دقة مسح الدولار الأصلي (1024×437) عشان الحفر يطلع حاد على شاشات الريتنا */
const ART_W = 2048
const ART_H = 874
const FRAME = { l: 0.0234, r: 0.9736, t: 0.0503, b: 0.9474 }

/* مسار لوجو قاسمز (public/images/qassimz-logo.svg، viewBox 1483×558) */
const LOGO_VB = { w: 1483, h: 558 }
const LOGO_PATH =
  'M946,459 L945,456 L940,455 L784,490 L780,494 L781,505 L783,509 L791,510 L928,501 L932,498Z M6,496 L118,551 L124,551 L239,414 L248,418 L429,411 L434,407 L441,292 L443,283 L515,297 L509,327 L504,330 L463,326 L460,329 L458,409 L461,413 L657,420 L708,369 L734,425 L744,422 L814,381 L834,411 L837,413 L1036,400 L1038,396 L1008,255 L1000,207 L997,202 L991,203 L921,244 L921,253 L934,325 L933,330 L877,334 L875,332 L865,243 L861,241 L788,264 L783,267 L782,272 L794,337 L789,340 L762,346 L736,270 L732,270 L638,335 L573,335 L572,334 L601,256 L600,251 L522,223 L423,184 L414,182 L358,240 L357,328 L238,346 L217,298 L212,298 L182,311 L179,316 L166,384 L7,492Z M209,148 L198,153 L126,198 L120,204 L172,266 L179,264 L254,215 L252,207Z M1435,139 L1386,103 L1379,105 L1347,142 L1340,136 L1339,133 L1315,119 L1302,109 L1297,109 L1256,161 L1254,166 L1258,171 L1310,193 L1317,192 L1337,165 L1357,172 L1391,188 L1399,188 L1420,166 L1433,148Z M1064,86 L1063,125 L1069,416 L1072,419 L1473,427 L1476,425 L1448,202 L1444,200 L1257,210 L1191,289 L1187,297 L1263,350 L1227,351 L1136,349 L1135,344 L1167,67 L1165,63Z M1301,283 L1305,281 L1377,270 L1379,275 L1375,346 L1373,347 L1309,292Z M1412,8 L1410,6 L1406,6 L1254,80 L1253,86 L1259,92 L1264,94 L1405,45 L1409,42Z'

function siteArt(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = ART_W
  c.height = ART_H
  const g = c.getContext('2d')!
  const S = ART_W / 1024 // كل المقاسات تحت مكتوبة على مقاس 1024
  g.fillStyle = '#fff'
  g.fillRect(0, 0, ART_W, ART_H)
  g.strokeStyle = '#000'
  g.fillStyle = '#000'
  g.lineCap = 'round'
  g.lineJoin = 'round'

  const l = ART_W * FRAME.l
  const r = ART_W * FRAME.r
  const t = ART_H * FRAME.t
  const b = ART_H * FRAME.b
  const rad = Math.max(4, CORNER * ART_H - t)

  // نقش خطوط رفيعة زي خلفية العملات: موجات أفقية خفيفة (رمادي فاتح = بروز بسيط)
  g.save()
  g.beginPath()
  g.roundRect(l + 26 * S, t + 26 * S, r - l - 52 * S, b - t - 52 * S, Math.max(2, rad - 20 * S))
  g.clip()
  g.strokeStyle = 'rgba(0,0,0,0.5)'
  g.lineWidth = 1.4 * S
  for (let k = 0; k < 34; k++) {
    const y0 = t + 30 * S + k * 11 * S
    g.beginPath()
    for (let x = l; x <= r; x += 6 * S) {
      const y = y0 + Math.sin(x / (38 * S) + k * 0.55) * 5 * S
      if (x === l) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  }
  g.restore()

  // الإطار المزدوج بنفس نسب إطار الورقة
  g.lineWidth = 7 * S
  g.beginPath()
  g.roundRect(l + 4 * S, t + 4 * S, r - l - 8 * S, b - t - 8 * S, rad)
  g.stroke()
  g.lineWidth = 2 * S
  g.beginPath()
  g.roundRect(l + 20 * S, t + 20 * S, r - l - 40 * S, b - t - 40 * S, Math.max(2, rad - 14 * S))
  g.stroke()

  // ميدالية البث على الشمال: دايرة بيضا تقطع النقش، ونقطة وموجات جواها
  const cx = 200 * S
  const cy = ART_H / 2
  g.fillStyle = '#fff'
  g.beginPath()
  g.arc(cx, cy, 138 * S, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#000'
  g.lineWidth = 3 * S
  g.beginPath()
  g.arc(cx, cy, 138 * S, 0, Math.PI * 2)
  g.stroke()
  g.lineWidth = 1.5 * S
  g.beginPath()
  g.arc(cx, cy, 124 * S, 0, Math.PI * 2)
  g.stroke()
  g.beginPath()
  g.arc(cx, cy, 28 * S, 0, Math.PI * 2)
  g.fill()
  g.lineWidth = 12 * S
  for (const radius of [60, 94]) {
    for (const side of [0, Math.PI]) {
      g.beginPath()
      g.arc(cx, cy, radius * S, side - 0.7, side + 0.7)
      g.stroke()
    }
  }

  // لوجو قاسمز في النص، على لوحة بيضا عشان يبان فوق النقش
  const logoW = 560 * S
  const scale = logoW / LOGO_VB.w
  const logoH = LOGO_VB.h * scale
  const lx = 650 * S - logoW / 2
  const ly = cy - logoH / 2
  g.fillStyle = '#fff'
  g.beginPath()
  g.roundRect(lx - 34 * S, ly - 30 * S, logoW + 68 * S, logoH + 60 * S, 26 * S)
  g.fill()
  g.lineWidth = 2 * S
  g.stroke()
  g.save()
  g.translate(lx, ly)
  g.scale(scale, scale)
  g.fillStyle = '#000'
  g.fill(new Path2D(LOGO_PATH), 'evenodd')
  g.restore()

  return c
}

function offFrame(x: number, y: number, W: number, H: number) {
  const l = W * FRAME.l
  const r = W * FRAME.r
  const t = H * FRAME.t
  const b = H * FRAME.b
  const rad = Math.max(4, CORNER * H - t)
  const cx = x < l + rad ? l + rad : x > r - rad ? r - rad : x
  const cy = y < t + rad ? t + rad : y > b - rad ? b - rad : y
  return cx !== x && cy !== y && Math.hypot(x - cx, y - cy) > rad
}

/* الحفر كلون (الخطوط بتغمّق الزجاج) وكخشونة (الخطوط مصنفرة) */
function etching(art: HTMLCanvasElement) {
  const W = art.width
  const H = art.height
  const make = () => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c
  }
  const d = art.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, W, H)
  const color = make()
  const rough = make()
  const cg = color.getContext('2d')!
  const rg = rough.getContext('2d')!
  const cd = cg.createImageData(W, H)
  const rd = rg.createImageData(W, H)
  for (let i = 0; i < d.data.length; i += 4) {
    const p = i / 4
    const ink = offFrame(p % W, Math.floor(p / W), W, H)
      ? 0
      : Math.min(1, Math.max(0, (255 - d.data[i] - 70) / 160))
    const v = 255 * (1 - 0.26 * ink)
    cd.data[i] = cd.data[i + 1] = cd.data[i + 2] = v
    cd.data[i + 3] = 255
    const rr = 255 * (0.2 + 0.4 * ink)
    rd.data[i] = rd.data[i + 1] = rd.data[i + 2] = rr
    rd.data[i + 3] = 255
  }
  cg.putImageData(cd, 0, 0)
  rg.putImageData(rd, 0, 0)
  return { color, rough }
}

/* خريطة الارتفاع: حافة منفوخة + الحفر بارز فوقها */
function engraving(art: HTMLCanvasElement | null): HTMLCanvasElement {
  const W = art ? art.width : ART_W
  const H = art ? art.height : ART_H
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, W, H)
  if (art) g.drawImage(art, 0, 0)
  const d = g.getImageData(0, 0, W, H)
  const RIM = 34 * (W / 1024)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      const ink = offFrame(x, y, W, H) ? 0 : 255 - d.data[i]
      const e = Math.min(1, inset(x, y, W, H) / RIM)
      const puff = e * (2 - e)
      const h = 46 + 84 * puff + ink * 0.42 * puff
      d.data[i] = d.data[i + 1] = d.data[i + 2] = Math.min(255, h)
    }
  g.putImageData(d, 0, 0)
  const out = document.createElement('canvas')
  out.width = W
  out.height = H
  const o = out.getContext('2d')!
  o.filter = `blur(${(0.8 * W) / 1024}px)`
  o.drawImage(c, 0, 0)
  return out
}

/* استوديو يعكسه الزجاج: أوضة غامقة وصناديق إضاءة ناعمة */
function studio(THREE: Three, pmrem: Three, roomColor: Three) {
  const room = new THREE.Scene()
  room.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(40, 40, 40),
      new THREE.MeshBasicMaterial({ color: roomColor, side: THREE.BackSide }),
    ),
  )
  const panel = (w: number, h: number, x: number, y: number, z: number, glow: number) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(glow), side: THREE.DoubleSide }),
    )
    m.position.set(x, y, z)
    m.lookAt(0, 0, 0)
    room.add(m)
  }
  panel(14, 5, -4, 9, 9, 3.2)
  panel(3, 16, 12, 0, 6, 2.4)
  panel(16, 3, 0, -10, 6, 1.2)
  panel(20, 20, 0, 0, 16, 0.55)
  panel(10, 10, -12, 2, 2, 0.8)
  return pmrem.fromScene(room, 0.03).texture
}

export function FoldingBill({
  stiffness = 40,
  settle = 0,
  className = '',
}: {
  stiffness?: number
  settle?: number
  className?: string
}) {
  const host = useRef<HTMLDivElement | null>(null)
  const live = useRef({ stiffness, settle })
  live.current = { stiffness, settle }

  useEffect(() => {
    const el = host.current
    if (!el) return undefined
    let undo = () => {}
    let gone = false
    loadThree()
      .then((THREE) => {
        if (gone) return
        undo = mount(THREE, el)
      })
      .catch(() => {
        // من غير نت/CDN: الصندوق بيفضل فاضي والصفحة شغالة عادي
        el.dataset.failed = 'true'
      })
    return () => {
      gone = true
      undo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function mount(THREE: Three, el: HTMLDivElement) {
    const spec = SPEC
    const light = window.matchMedia('(pointer: coarse), (max-width: 760px)').matches
    /* جودة: antialias دايماً ودقة لحد 2x حتى على الموبايل (كانت 1.25 من غير
       antialias فالحواف والحفر كانوا مشرشرين). الحلقة بتنام لما الورقة تهدى
       فالتكلفة بتبقى وقت اللمس بس. */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(spec.fw * SPILL, spec.fh * SPILL, false)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    const cv: HTMLCanvasElement = renderer.domElement
    cv.className = 'fbill-gl'
    cv.setAttribute('aria-hidden', 'true')
    Object.assign(cv.style, {
      width: `${SPILL * 100}%`,
      height: `${SPILL * 100}%`,
      left: `${(-(SPILL - 1) / 2) * 100}%`,
      top: `${(-(SPILL - 1) / 2) * 100}%`,
    })
    el.appendChild(cv)
    el.dataset.ready = 'true'

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    let colors = themeColors(THREE)
    scene.environment = studio(THREE, pmrem, colors.room)
    const camera = new THREE.PerspectiveCamera(
      (2 * Math.atan(SPILL * Math.tan((15 * Math.PI) / 180)) * 180) / Math.PI,
      spec.fw / spec.fh,
      0.1,
      50,
    )
    camera.position.set(0, 0, spec.cam)
    const { nx: NX, ny: NY, w: BW, h: BH } = spec

    /* ── الورقة ── */
    const geo = new THREE.PlaneGeometry(BW, BH, NX - 1, NY - 1)
    const P = geo.attributes.position
    const N: number = P.count
    const rest = new Float32Array(P.array as Float32Array)
    const pos = new Float32Array(rest)
    const prev = new Float32Array(rest)

    const links: Link[] = []
    const id = (i: number, j: number) => j * NX + i
    const add = (a: number, b: number, k: number) => {
      const dx = rest[a * 3] - rest[b * 3]
      const dy = rest[a * 3 + 1] - rest[b * 3 + 1]
      links.push({ a, b, len: Math.hypot(dx, dy), k })
    }
    for (let j = 0; j < NY; j++)
      for (let i = 0; i < NX; i++) {
        if (i < NX - 1) add(id(i, j), id(i + 1, j), 1)
        if (j < NY - 1) add(id(i, j), id(i, j + 1), 1)
        if (i < NX - 1 && j < NY - 1) {
          add(id(i, j), id(i + 1, j + 1), 0.7)
          add(id(i + 1, j), id(i, j + 1), 0.7)
        }
        if (i < NX - 2) add(id(i, j), id(i + 2, j), -1) // انحناء: قوته من stiffness
        if (j < NY - 2) add(id(i, j), id(i, j + 2), -1)
      }

    const mat = new THREE.MeshPhysicalMaterial({
      color: colors.glass,
      metalness: 0.3,
      roughness: 0.2,
      clearcoat: 0.45,
      clearcoatRoughness: 0.12,
      envMapIntensity: 0.75,
      iridescence: 0.12,
      iridescenceIOR: 1.3,
      bumpScale: 6,
      side: THREE.DoubleSide,
    })
    const anisotropy = renderer.capabilities.getMaxAnisotropy()

    /* أول فريم: زجاج سادة بحافته المنفوخة، وبعدين حفر «أون إير» بيتركّب أول ما يجهز */
    const plain = new THREE.CanvasTexture(engraving(null))
    plain.colorSpace = THREE.NoColorSpace
    plain.anisotropy = anisotropy
    mat.bumpMap = plain

    let disposed = false
    let bump: Three = null
    let ink: Three = null
    let frost: Three = null
    // الحفر بيتعمل بعد أول فريم (مش بيستنى خطوط) عشان مايأخرش ظهور الورقة
    requestAnimationFrame(() => {
      if (disposed) return
      const art = siteArt()
      bump = new THREE.CanvasTexture(engraving(art))
      bump.colorSpace = THREE.NoColorSpace
      bump.anisotropy = anisotropy
      const { color, rough } = etching(art)
      ink = new THREE.CanvasTexture(color)
      ink.colorSpace = THREE.SRGBColorSpace
      ink.anisotropy = anisotropy
      frost = new THREE.CanvasTexture(rough)
      frost.colorSpace = THREE.NoColorSpace
      frost.anisotropy = anisotropy
      mat.bumpMap = bump
      mat.map = ink
      mat.roughnessMap = frost
      mat.roughness = 1 // الخريطة شايلة القيمة: 0.2 لامع و 0.6 في الخطوط
      mat.needsUpdate = true
      wake()
    })

    const cut = new THREE.CanvasTexture(outline(1024, Math.round(1024 / 2.35)))
    cut.colorSpace = THREE.NoColorSpace
    mat.alphaMap = cut
    mat.alphaTest = 0.5
    // حواف ناعمة للأركان المدوّرة مع الـ MSAA بدل حافة مشرشرة
    mat.alphaToCoverage = true
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.set(...spec.tilt)
    scene.add(mesh)

    /* ── الإيد ──
       الـ canvas أكبر من الصندوق وممكن يغطي نصوص وأزرار حواليه، فهو
       pointer-events: none، والسحب بيتسمع على الصندوق نفسه. */
    let held = -1
    let holdZ = 0
    const target = new THREE.Vector3()
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const toNdc = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    }
    const aim = () => {
      ray.setFromCamera(ndc, camera)
      const t = (holdZ - ray.ray.origin.z) / ray.ray.direction.z
      target.copy(ray.ray.direction).multiplyScalar(t).add(ray.ray.origin)
      mesh.worldToLocal(target)
      if (held >= 0) {
        const k = held * 3
        const dx = target.x - rest[k]
        const dy = target.y - rest[k + 1]
        const dz = target.z - rest[k + 2]
        const d = Math.hypot(dx, dy, dz)
        if (d > REACH) {
          const f = (REACH + (d - REACH) * 0.2) / d
          target.set(rest[k] + dx * f, rest[k + 1] + dy * f, rest[k + 2] + dz * f)
        }
      }
    }
    const down = (e: PointerEvent) => {
      toNdc(e)
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObject(mesh)[0]
      if (!hit) return
      e.preventDefault()
      const local = mesh.worldToLocal(hit.point.clone())
      let best = -1
      let bd = Infinity
      for (let n = 0; n < N; n++) {
        const d =
          (pos[n * 3] - local.x) ** 2 + (pos[n * 3 + 1] - local.y) ** 2 + (pos[n * 3 + 2] - local.z) ** 2
        if (d < bd) {
          bd = d
          best = n
        }
      }
      held = best
      holdZ = hit.point.z
      touched = performance.now()
      flutter = 1
      calm = 0
      aim()
      el.dataset.held = 'true'
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* pointer مبرمج */
      }
      wake()
    }
    const move = (e: PointerEvent) => {
      toNdc(e)
      if (held >= 0) aim()
      else {
        ray.setFromCamera(ndc, camera)
        const on = ray.intersectObject(mesh).length > 0
        el.dataset.over = on ? 'true' : ''
        if (on) {
          touched = performance.now()
          calm = 0
          wake()
        }
      }
    }
    const up = (e: PointerEvent) => {
      if (held < 0) return
      held = -1
      el.dataset.held = ''
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ماكانش متمسوك */
      }
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)

    /* ── متابعة الثيم: أول ما data-theme يتغير، الزجاج والأوضة بيتلوّنوا من جديد ── */
    const themeWatch = new MutationObserver(() => {
      colors = themeColors(THREE)
      mat.color.copy(colors.glass)
      const old = scene.environment
      scene.environment = studio(THREE, pmrem, colors.room)
      old?.dispose()
      redraw()
    })
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    /* ── الحلقة ── */
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let seen = true
    let running = false
    let last = performance.now()
    let clock = 0
    const H = 1 / 120
    const PASSES = light ? 9 : 16
    const GRACE = light ? 2 : 6
    let touched = performance.now()
    let flutter = 1
    let calm = 0

    const step = () => {
      const { stiffness: st, settle: se } = live.current
      const bend = 0.04 + (st / 100) * 0.5
      const home = (0.3 + (se / 100) * 7) * (held >= 0 ? 0.04 : 1)
      for (let n = 0; n < N; n++) {
        const k = n * 3
        const rx = rest[k]
        const ry = rest[k + 1]
        const rz =
          Math.sin(rx * 1.25 + 0.6) * 0.16 +
          Math.cos(ry * 2.2) * 0.04 +
          (still ? 0 : Math.sin(clock * 1.3 + rx * 1.7 + ry * 0.8) * 0.035 * flutter)
        for (let c = 0; c < 3; c++) {
          const p = pos[k + c]
          const v = (p - prev[k + c]) * 0.982
          const want = c === 0 ? rx : c === 1 ? ry : rz
          prev[k + c] = p
          pos[k + c] = p + v + (want - p) * home * H * H * 60
        }
      }
      if (held >= 0) {
        const k = held * 3
        pos[k] = target.x
        pos[k + 1] = target.y
        pos[k + 2] = target.z
      }
      for (let it = 0; it < PASSES; it++) {
        for (const l of links) {
          const a = l.a * 3
          const b = l.b * 3
          const dx = pos[b] - pos[a]
          const dy = pos[b + 1] - pos[a + 1]
          const dz = pos[b + 2] - pos[a + 2]
          const d = Math.hypot(dx, dy, dz) || 1e-6
          let w = ((l.k < 0 ? bend : l.k) * 0.5 * (d - l.len)) / d
          if (l.k < 0 && d < l.len * CREASE) w = (0.5 * (d - l.len * CREASE)) / d
          const pa = l.a === held ? 0 : 1
          const pb = l.b === held ? 0 : 1
          const s = pa + pb || 1
          pos[a] += dx * w * ((2 * pa) / s)
          pos[a + 1] += dy * w * ((2 * pa) / s)
          pos[a + 2] += dz * w * ((2 * pa) / s)
          pos[b] -= dx * w * ((2 * pb) / s)
          pos[b + 1] -= dy * w * ((2 * pb) / s)
          pos[b + 2] -= dz * w * ((2 * pb) / s)
        }
      }
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      clock += dt
      if (held >= 0) touched = now
      const idle = (now - touched) / 1000
      flutter = Math.max(0, Math.min(1, 1 - (idle - GRACE) / 1.5))
      if (still) flutter = 0
      const n = Math.max(1, Math.round(dt / H))
      for (let s = 0; s < n; s++) step()
      let moved = 0
      for (let k = 0; k < pos.length; k++) moved = Math.max(moved, Math.abs(pos[k] - prev[k]))
      calm = held < 0 && moved < 2e-4 ? calm + 1 : 0
      ;(P.array as Float32Array).set(pos)
      P.needsUpdate = true
      geo.computeVertexNormals()
      geo.computeBoundingSphere()
      renderer.render(scene, camera)
      // بتنام لما الرفرفة تخلص والورقة تهدى — آخر فريم بيفضل مرسوم
      const sleep = flutter === 0 && calm > 20
      if (seen && !sleep) raf = requestAnimationFrame(frame)
      else running = false
    }
    // رسمة واحدة حتى لو الحلقة نايمة (لتغيير الثيم مثلاً)
    function redraw() {
      if (disposed) return
      if (running) return
      renderer.render(scene, camera)
    }
    function wake() {
      if (running || !seen || disposed) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver(([row]) => {
      seen = row.isIntersecting
      if (seen) wake()
    })
    io.observe(el)
    wake()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      io.disconnect()
      themeWatch.disconnect()
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      geo.dispose()
      mat.dispose()
      plain.dispose()
      bump?.dispose()
      ink?.dispose()
      frost?.dispose()
      cut.dispose()
      scene.environment?.dispose()
      pmrem.dispose()
      renderer.dispose()
      cv.remove()
      delete el.dataset.ready
    }
  }

  return (
    <div
      ref={host}
      className={`fbill ${className}`}
      role="img"
      aria-label="ورقة زجاجية محفور عليها لوجو قاسمز — اسحبها واطويها"
    />
  )
}

export default FoldingBill
