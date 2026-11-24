import { useEffect, useRef } from 'react'

/* ══ بكرة فيلم فلين — 3D حقيقي (three.js) ═════════════════════════════
   جسم مُبثق (Extrude) فيه ٥ شبابيك مفرّغة فعلاً وثقب في النص بحافة مشطوفة،
   حلقة خارجية بارزة ومحور خشب. خامة فلين حقيقية (map + bump) وإضاءة دافية
   من فوق يمين + ضوء حافة من ورا، زي رندر ORYZO. الدوران جاي من السكرول
   (motion values) وبيترسم بس لما يتغيّر أو وهو ظاهر. three بيتحمّل من CDN
   أول ما المكوّن يظهر بس. */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js'
let threePromise = null
const loadThree = () => (threePromise ??= import(/* @vite-ignore */ THREE_URL))

function windowShape(THREE, a0, a1, r0, r1, round) {
  // شباك على شكل قطعة حلقة بأركان مدوّرة
  const s = new THREE.Path()
  const steps = 18
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps
    pts.push([Math.cos(a) * r1, Math.sin(a) * r1])
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / steps
    pts.push([Math.cos(a) * r0, Math.sin(a) * r0])
  }
  // تنعيم الأركان بـ Chaikin
  let poly = pts
  for (let k = 0; k < round; k++) {
    const next = []
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]
      const q = poly[(i + 1) % poly.length]
      next.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]])
      next.push([0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]])
    }
    poly = next
  }
  s.moveTo(poly[0][0], poly[0][1])
  for (let i = 1; i < poly.length; i++) s.lineTo(poly[i][0], poly[i][1])
  s.closePath()
  return s
}

export default function CorkReel3D({ textureUrl, rotX, rotY, rotZ, className }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    let disposed = false
    let cleanup = () => {}

    loadThree().then((THREE) => {
      if (disposed) return
      const canvas = document.createElement('canvas')
      host.appendChild(canvas)
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
      camera.position.set(0, 0, 5.2)

      scene.add(new THREE.AmbientLight(0xffe2c4, 0.35))
      const key = new THREE.DirectionalLight(0xffd2a0, 3.2)
      key.position.set(2.4, 2.8, 3)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0xff9a4a, 2.2)
      rim.position.set(-2.5, -1.2, -2.5)
      scene.add(rim)
      const fill = new THREE.DirectionalLight(0xffffff, 0.35)
      fill.position.set(-2, 1, 3)
      scene.add(fill)

      // خامة الفلين
      const loader = new THREE.TextureLoader()
      const cork = loader.load(textureUrl, () => render())
      cork.colorSpace = THREE.SRGBColorSpace
      cork.wrapS = cork.wrapT = THREE.RepeatWrapping
      cork.repeat.set(1.3, 1.3)
      cork.anisotropy = renderer.capabilities.getMaxAnisotropy()
      const bump = loader.load(textureUrl, () => render())
      bump.wrapS = bump.wrapT = THREE.RepeatWrapping
      bump.repeat.copy(cork.repeat)

      const corkMat = new THREE.MeshStandardMaterial({ map: cork, bumpMap: bump, bumpScale: 2.2, roughness: 0.92, metalness: 0 })
      const sideCork = cork.clone()
      sideCork.repeat.set(5, 0.35)
      sideCork.needsUpdate = true
      const sideMat = new THREE.MeshStandardMaterial({ map: sideCork, bumpMap: bump, bumpScale: 1.4, roughness: 0.9, color: 0xf2d2a8 })
      const woodMat = new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.55, metalness: 0.05 })

      const R = 1
      const group = new THREE.Group()

      // القرص الأساسي بالشبابيك المفرّغة
      const disc = new THREE.Shape()
      disc.absarc(0, 0, R * 0.93, 0, Math.PI * 2, false)
      const n = 5
      for (let i = 0; i < n; i++) {
        const c = (i / n) * Math.PI * 2 + Math.PI / 2
        const half = (Math.PI * 2) / n / 2 - 0.3
        disc.holes.push(windowShape(THREE, c - half, c + half, R * 0.34, R * 0.74, 4))
      }
      const hole = new THREE.Path()
      hole.absarc(0, 0, R * 0.055, 0, Math.PI * 2, true)
      disc.holes.push(hole)
      const discGeo = new THREE.ExtrudeGeometry(disc, {
        depth: 0.09,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.02,
        bevelSegments: 4,
        curveSegments: 72,
      })
      discGeo.center()
      group.add(new THREE.Mesh(discGeo, [corkMat, sideMat]))

      // الحلقة الخارجية البارزة (الإطار)
      const ring = new THREE.Shape()
      ring.absarc(0, 0, R, 0, Math.PI * 2, false)
      const inner = new THREE.Path()
      inner.absarc(0, 0, R * 0.905, 0, Math.PI * 2, true)
      ring.holes.push(inner)
      const ringGeo = new THREE.ExtrudeGeometry(ring, {
        depth: 0.17,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.025,
        bevelSegments: 6,
        curveSegments: 120,
      })
      ringGeo.center()
      group.add(new THREE.Mesh(ringGeo, [corkMat, sideMat]))

      // المحور الخشب
      const hubGeo = new THREE.CylinderGeometry(R * 0.17, R * 0.17, 0.2, 64, 1, false)
      hubGeo.rotateX(Math.PI / 2)
      const hub = new THREE.Mesh(hubGeo, woodMat)
      group.add(hub)
      const hubHole = new THREE.Mesh(
        new THREE.CylinderGeometry(R * 0.05, R * 0.05, 0.22, 32).rotateX(Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x1a0d05, roughness: 1 }),
      )
      group.add(hubHole)
      scene.add(group)

      let w = 0
      let h = 0
      const resize = () => {
        const r = host.getBoundingClientRect()
        w = Math.max(2, r.width)
        h = Math.max(2, r.height)
        renderer.setSize(w, h, false)
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        render()
      }
      const deg = Math.PI / 180
      let idle = 0
      function render() {
        group.rotation.x = (rotX?.get?.() ?? 0) * deg
        group.rotation.y = (rotY?.get?.() ?? 0) * deg + Math.sin(idle) * 0.06
        group.rotation.z = -(rotZ?.get?.() ?? 0) * deg
        renderer.render(scene, camera)
      }

      let visible = true
      let raf = 0
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const loop = (t) => {
        raf = 0
        if (disposed || !visible) return
        idle = reduce ? 0 : t / 1400
        render()
        raf = requestAnimationFrame(loop)
      }
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting
        if (visible && !raf) raf = requestAnimationFrame(loop)
      })
      io.observe(host)
      const ro = new ResizeObserver(resize)
      ro.observe(host)
      resize()

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf)
        io.disconnect()
        ro.disconnect()
        renderer.dispose()
        ;[discGeo, ringGeo, hubGeo].forEach((g) => g.dispose())
        ;[cork, bump, sideCork].forEach((t) => t.dispose())
        canvas.remove()
      }
    })

    return () => {
      disposed = true
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textureUrl])

  return <div ref={hostRef} className={className} aria-hidden="true" />
}
