import { useEffect, useRef, useState } from 'react'
import { assetUrl } from '../utils/assets.js'
import './About.css'

const PHOTO_BASE = 'https://cdn.prod.website-files.com/67b5a02dc5d338960b17a7e9/'
const HELMET_BASE = 'https://cdn.prod.website-files.com/67d97a68478fe87e30c67abe/'
const photo = (file) => `${PHOTO_BASE}${file}`
const helmetImage = (file) => `${HELMET_BASE}${file}`

const onTrack = [
  { src: photo('68da85d632bfefc552a0faac_Britain-25%20(1).webp'), alt: 'Lando in F1 car' },
  { src: photo('68302bab4f762cdbc5e93415_ln-home-horiz-10.webp'), alt: 'Lando celebrating a win' },
  { src: photo('68302babb87c5f19ec131093_ln-home-horiz-9.webp'), alt: 'Lando lifting trophy' },
  { src: photo('68302baab12220595c8223b3_ln-home-horiz-2.webp'), alt: 'Lando lifting trophy in tux' },
  { src: photo('68302babcf12f0111d96322e_ln-home-horiz-3.webp'), alt: 'Lando lifting trophy' },
]

const offTrack = [
  { src: photo('68302baa04b14a1ca33c0b25_ln-home-horiz-1.webp'), alt: 'Lando in casual clothes walking through paddock' },
  { src: photo('68302baa798e2cc6e02ac38a_ln-home-horiz-4.webp'), alt: 'Lando playing golf' },
  { src: photo('68302baa14a96f3cdd2f9a95_ln-home-horiz-6.webp'), alt: 'Lando holding dog smiling' },
  { src: photo('68302baaedf821dd2e3a7c74_ln-home-horiz-8.webp'), alt: 'Lando taking photo out of a plane' },
  { src: photo('68302bab3ee6e26b1f434a7d_ln-home-horiz-7.webp'), alt: 'Lando in tux' },
]

const helmets = [
  ['2025 Season', '68305b3e6c7ab86033cf172c_In-helm-2025-Season-base.webp', '68305b411c575b2f777125f6_In-helm-2025-Season-hover.webp'],
  ['Discoball', '68305b2259159e5170d2b923_In-helm-2025-Discoball-base.webp', '68305b24037a1e7681195c20_In-helm-2025-Discoball-hover.webp'],
  ['Dark Glitter', '68305aff4692de3e7ea12251_In-helm-2025-DarkGlitter-base.webp', '68305b03644c91f0a8de407b_In-helm-2025-DarkGlitter-hover.webp'],
  ['2024 Season', '68305aeac44aa40f7bda5460_In-helm-2024-Season-base.webp', '68305af56183c37dfd14ff3f_In-helm-2024-Season-hover.webp'],
  ['Porcelain', '68305acf3fccf71c6d72607b_In-helm-2024-Porcelain-base.webp', '68305ad3a594ec37bd1d32cb_In-helm-2024-Porcelain-hover.webp'],
  ['Japan', '68305a980c399022066600a6_In-helm-2024-Japan-base.webp', '68305a9b1716264ea006064b_In-helm-2024-Japan-hover.webp'],
  ['GIF', '68305a7d4e96d5f8f44f7803_In-helm-2024-GIF%20Helmet-base.webp', '68305a8e13a9b59a5e99cafe_In-helm-2024-GIF%20Helmet-hover.webp'],
  ['Dark Mode', '68305a59417d51c0a58c32c6_In-helm-2024-DarkMode-base.webp', '68305a5cdaa389d0c080afc7_In-helm-2024-DarkMode-hover.webp'],
  ['Race 100', '68305a459178b78319e05b55_In-helm-2023-Race%20100-base.webp', '68305a47417d51c0a58c28a6_In-helm-2023-Race%20100-hover.webp'],
  ['Las Vegas', '68305a2e3fccf71c6d71e5a8_In-helm-2023-Las%20Vegas-base.webp', '68305a3053985f797745cdfc_In-helm-2023-Las%20Vegas-hover.webp'],
  ['Chrome', '68305a153de4a824d397d21d_In-helm-2023-Chrome-base.webp', '68305a175a720573cbd3000f_In-helm-2023-Chrome-hover.webp'],
  ['Beachball', '683053f61b468e794507c0a7_In-helm-2023-Beach%20Ball-base.webp', '683053fb6e004f8218de7f11_In-helm-2023-Beach%20Ball-hover.webp'],
  ['Basketball', '683052a8a475dfa06075ca17_In-helm-2022-Basketball-base.webp', '683052ab1073a33331767d2a_In-helm-2022-Basketball-hover.webp'],
  ['2021 Season', '68305038652a87f86290bf3b_ln-helm-2021-base.webp', '68305b57817f019bc368a7b6_ln-helm-2021-hover.webp'],
].map(([name, base, hover]) => ({ name, base: helmetImage(base), hover: helmetImage(hover) }))

const helmetPortrait = photo('67d18655b032045a4dc78e53_ln4-hp-lando-helmet.webp')

function HelmetScene() {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const [mode, setMode] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    let raf = 0
    let resizeObserver
    let themeObserver
    let renderer
    let scene
    let model
    let canvas
    let down
    let move
    let up
    stageRef.current = null
    setMode('loading')

    const disposeObject = (root) => {
      root?.traverse?.((item) => {
        item.geometry?.dispose?.()
        const materials = Array.isArray(item.material) ? item.material : item.material ? [item.material] : []
        materials.forEach((material) => {
          Object.values(material).forEach((value) => value?.isTexture && value.dispose())
          material.dispose?.()
        })
      })
    }

    const boot = async () => {
      const moduleUrl = assetUrl('/vendor/three-gltf.js')
      const { THREE, GLTFLoader } = await import(/* @vite-ignore */ moduleUrl)
      if (!alive || !canvasRef.current) return
      canvas = canvasRef.current
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 30)
      camera.position.set(0, 0, 3.6)
      camera.lookAt(0, 0, 0)
      scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 2))
      const key = new THREE.DirectionalLight(0xffffff, 2.4)
      key.position.set(1.5, 2, 3)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0xffffff, 2.6)
      rim.position.set(-2, 1.5, -2)
      scene.add(rim)

      const syncThemeLight = () => {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--qz-glow-rgb').trim() || '142 240 210'
        const [r, g, b] = raw.split(/\s+/).map((value) => Number(value) / 255)
        rim.color.setRGB(r, g, b)
      }
      syncThemeLight()
      themeObserver = new MutationObserver(syncThemeLight)
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

      const resize = () => {
        if (!canvas || !renderer) return
        const width = canvas.clientWidth || 1
        const height = canvas.clientHeight || 1
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8))
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
      resize()
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(canvas)

      let dragging = false
      let lastX = 0
      let lastY = 0
      down = (event) => {
        dragging = true
        lastX = event.clientX
        lastY = event.clientY
        canvas.setPointerCapture?.(event.pointerId)
      }
      move = (event) => {
        if (!dragging || !model) return
        model.rotation.y += (event.clientX - lastX) * 0.009
        model.rotation.x = Math.max(-0.62, Math.min(0.62, model.rotation.x + (event.clientY - lastY) * 0.006))
        lastX = event.clientX
        lastY = event.clientY
      }
      up = () => { dragging = false }
      canvas.addEventListener('pointerdown', down)
      canvas.addEventListener('pointermove', move)
      canvas.addEventListener('pointerup', up)
      canvas.addEventListener('pointercancel', up)

      const draw = () => {
        if (!alive) return
        renderer.render(scene, camera)
        raf = requestAnimationFrame(draw)
      }
      draw()

      new GLTFLoader().load(
        assetUrl('/about-ahmed/gl/models/helmet-21.glb'),
        (gltf) => {
          if (!alive) { disposeObject(gltf.scene); return }
          model = gltf.scene
          const box = new THREE.Box3().setFromObject(model)
          const size = box.getSize(new THREE.Vector3())
          const center = box.getCenter(new THREE.Vector3())
          const scale = 2 / Math.max(size.x, size.y, size.z, 0.001)
          model.scale.setScalar(scale)
          model.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
          model.rotation.y = -0.35
          scene.add(model)
          stageRef.current = {
            rotate: (amount) => { if (model) model.rotation.y += amount },
            reset: () => { if (model) { model.rotation.x = 0; model.rotation.y = -0.35 } },
          }
          setMode('ready')
        },
        undefined,
        () => { if (alive) setMode('fallback') },
      )
    }

    boot().catch(() => { if (alive) setMode('fallback') })
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      themeObserver?.disconnect()
      if (canvas && down) canvas.removeEventListener('pointerdown', down)
      if (canvas && move) canvas.removeEventListener('pointermove', move)
      if (canvas && up) {
        canvas.removeEventListener('pointerup', up)
        canvas.removeEventListener('pointercancel', up)
      }
      disposeObject(scene)
      renderer?.dispose()
      stageRef.current = null
    }
  }, [attempt])

  return (
    <div className="qz-about-model" aria-label="Interactive Lando Norris helmet model">
      <img className={`qz-about-model-poster ${mode === 'ready' ? 'is-hidden' : ''}`} src={helmetPortrait} alt="Lando Norris wearing a lime helmet, side profile" />
      <canvas ref={canvasRef} className="qz-about-model-canvas" aria-label="Drag to rotate Lando Norris's helmet" />
      {mode === 'loading' && <p className="qz-about-model-status" role="status">Loading helmet preview…</p>}
      {mode === 'fallback' && (
        <div className="qz-about-model-status qz-about-model-error" role="status">
          <span>3D preview unavailable.</span>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
        </div>
      )}
      {mode === 'ready' && (
        <div className="qz-about-model-controls" data-qz-silent>
          <span>Drag to rotate</span>
          <button type="button" aria-label="Rotate helmet left" onClick={() => stageRef.current?.rotate(-0.42)}>←</button>
          <button type="button" aria-label="Rotate helmet right" onClick={() => stageRef.current?.rotate(0.42)}>→</button>
          <button type="button" aria-label="Reset helmet view" onClick={() => stageRef.current?.reset()}>Reset</button>
        </div>
      )}
    </div>
  )
}

function PhotoRail({ items, onOpen }) {
  return (
    <ul className="qz-about-rail">
      {items.map((item, index) => (
        <li className="qz-about-photo-card" key={`${item.alt}-${index}`}>
          <button type="button" onClick={() => onOpen(item)} aria-label={`Open photo: ${item.alt}`}>
            <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
            <span className="qz-about-photo-caption">{item.alt}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function PhotoViewer({ item, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="qz-about-viewer" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <button ref={closeRef} type="button" className="qz-about-viewer-close" onClick={onClose} aria-label="Close photo viewer">×</button>
      <figure>
        <img src={item.src} alt={item.alt} />
        <figcaption>{item.alt}</figcaption>
      </figure>
    </div>
  )
}

export default function About() {
  const [activePhoto, setActivePhoto] = useState(null)
  const openPhoto = (item) => setActivePhoto(item)
  const closePhoto = () => setActivePhoto(null)

  return (
    <div className="qz-about-page" dir="ltr" lang="en">
      <section className="qz-about-hero" aria-labelledby="lando-title">
        <div className="qz-about-hero-inner">
          <div className="qz-about-hero-copy">
            <p className="qz-about-kicker">2025 Mclaren Formula 1 Driver</p>
            <h1 id="lando-title" className="qz-about-title">Lando<br />Norris</h1>
            <a className="qz-about-hero-link" href="#on-track">Explore the story <span aria-hidden="true">↘</span></a>
          </div>
          <div className="qz-about-hero-visual">
            <HelmetScene />
            <span className="qz-about-hero-index" aria-hidden="true">LN / 04</span>
          </div>
          <a className="qz-about-scroll" href="#on-track"><span aria-hidden="true">↓</span> Scroll to discover</a>
        </div>
      </section>

      <section className="qz-about-track-section" id="on-track" aria-labelledby="on-track-title">
        <div className="qz-about-section-head">
          <p className="qz-about-kicker">01 / THE DRIVER</p>
          <h2 id="on-track-title">ON TRACK</h2>
          <p className="qz-about-section-note">Lando Norris · 2025</p>
        </div>
        <PhotoRail items={onTrack} onOpen={openPhoto} />
      </section>

      <section className="qz-about-track-section qz-about-offtrack" id="off-track" aria-labelledby="off-track-title">
        <div className="qz-about-section-head">
          <p className="qz-about-kicker">02 / AWAY FROM THE GRID</p>
          <h2 id="off-track-title">OFF TRACK</h2>
          <p className="qz-about-section-note">A different side of Lando</p>
        </div>
        <PhotoRail items={offTrack} onOpen={openPhoto} />
      </section>

      <section className="qz-about-helmets" id="helmets" aria-labelledby="helmets-title">
        <div className="qz-about-section-head qz-about-helmet-head">
          <p className="qz-about-kicker">03 / RACE-WORN DESIGNS</p>
          <h2 id="helmets-title">Helmets<br /><span>Hall of Fame</span></h2>
        </div>
        <div className="qz-about-helmet-grid">
          {helmets.map((item) => (
            <button
              type="button"
              className="qz-about-helmet-card"
              key={item.name}
              onClick={() => openPhoto({ src: item.base, alt: `${item.name} helmet` })}
              aria-label={`View ${item.name} helmet`}
            >
              <span className="qz-about-helmet-images">
                <img src={item.base} alt="" loading="lazy" decoding="async" />
                <img className="qz-about-helmet-hover" src={item.hover} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="qz-about-helmet-name">{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="qz-about-end" aria-hidden="true">
        <img src={photo('67cecea4e9d311047dcb51e5_ln4-hw-signature2.svg')} alt="" loading="lazy" />
        <span>LANDO NORRIS</span>
      </div>

      {activePhoto && <PhotoViewer item={activePhoto} onClose={closePhoto} />}
    </div>
  )
}
