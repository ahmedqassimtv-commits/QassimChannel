import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import AnimeAvatar from './AnimeAvatar.jsx'
import { assetUrl } from '../../utils/assets.js'

/* ══ قاسم الافتراضي 3D ═══════════════════════════════════════════════════
   موديل Avaturn (public/avatar/qassim-3d.glb) بـthree.js r170 من نفس الموقع
   (public/vendor/three-gltf.js، بيتحمّل بس لما اللوح يتفتح).
   الموديل جاي T-pose ومن غير ملامح وش متحركة، فالحركة كلها من العظام:
   - الدراعات بتنزل جنبه (بنوجّه العظمة في world space فمش مهم محاورها)
   - تنفّس في الضهر، ورأس بيبص ناحية الماوس
   - وهو بيتكلم: الراس بتهز مع كل كلمة والإيدين بتتحرك كأنه بيشرح
   - التحية: بيلوّح بإيده اليمين · بيفكّر: الراس لفوق وعلى جنب
   لو WebGL مش موجود أو الموديل ماتحملش، بيرجع للشخصية الأنمي. */

const V = (THREE, x, y, z) => new THREE.Vector3(x, y, z)

function aimBone(THREE, bone, child, dir) {
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  bone.updateWorldMatrix(true, false)
  child.updateWorldMatrix(true, false)
  bone.getWorldPosition(a)
  child.getWorldPosition(b)
  const q = new THREE.Quaternion().setFromUnitVectors(b.sub(a).normalize(), dir.clone().normalize())
  const wq = new THREE.Quaternion()
  const pq = new THREE.Quaternion()
  bone.getWorldQuaternion(wq)
  bone.parent.getWorldQuaternion(pq)
  bone.quaternion.copy(pq.invert().multiply(q.multiply(wq)))
  bone.updateWorldMatrix(false, true)
}

// نابض بسيط (نفس فكرة springs.js): x بيروح لـt
const sp = (x = 0, k = 120, c = 18) => ({ x, v: 0, t: x, k, c })
const stepS = (s, dt) => {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt
  s.x += s.v * dt
}

function createStage(THREE, GLTFLoader, canvas, reduce) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  const scene = new THREE.Scene()
  const glow = getComputedStyle(document.documentElement).getPropertyValue('--qz-glow-rgb').trim() || '142 240 210'
  const [gr, gg, gb] = glow.split(/\s+/).map((n) => Number(n) / 255)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223330, 1.6))
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(1.2, 2.2, 2.5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(new THREE.Color(gr, gg, gb), 3)
  rim.position.set(-1.5, 2, -2)
  scene.add(rim)
  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 20)
  camera.position.set(0, 1.47, 1.8)
  camera.lookAt(0, 1.42, 0)

  const S = {
    breath: 0,
    lookX: sp(0, 60, 14),
    lookY: sp(0, 60, 14),
    nod: sp(0, 260, 16),
    talk: sp(0, 90, 16), // وزن حركة الإيدين وهو بيتكلم
    wave: sp(0, 70, 15),
    think: sp(0, 70, 16),
    gx: 0, // مرحلة الإيدين
  }
  let bones = null
  let rest = null
  let gest = null
  let waveQ = null
  let raf = 0
  let last = performance.now()
  let destroyed = false
  const Q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z))

  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()

  const ready = new Promise((resolve, reject) => {
    new GLTFLoader().load(
      assetUrl('/avatar/qassim-3d.glb'),
      (g) => {
        if (destroyed) return
        const model = g.scene
        scene.add(model)
        const b = {}
        model.traverse((o) => {
          if (o.isBone) b[o.name] = o
          if (o.isMesh) o.frustumCulled = false
        })
        bones = b
        // الدراعات جنبه
        aimBone(THREE, b.LeftArm, b.LeftForeArm, V(THREE, 0.18, -1, 0.05))
        aimBone(THREE, b.RightArm, b.RightForeArm, V(THREE, -0.18, -1, 0.05))
        aimBone(THREE, b.LeftForeArm, b.LeftHand, V(THREE, 0.05, -1, 0.35))
        aimBone(THREE, b.RightForeArm, b.RightHand, V(THREE, -0.05, -1, 0.35))
        const names = ['Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand']
        rest = Object.fromEntries(names.map((n) => [n, b[n].quaternion.clone()]))
        // وضع "بيشرح": الساعدين لقدّام ولفوق شوية
        aimBone(THREE, b.LeftForeArm, b.LeftHand, V(THREE, 0.25, 0.15, 1))
        aimBone(THREE, b.RightForeArm, b.RightHand, V(THREE, -0.25, 0.15, 1))
        gest = { LeftForeArm: b.LeftForeArm.quaternion.clone(), RightForeArm: b.RightForeArm.quaternion.clone() }
        b.LeftForeArm.quaternion.copy(rest.LeftForeArm)
        b.RightForeArm.quaternion.copy(rest.RightForeArm)
        // التلويح: الدراع اليمين لفوق على جنب والساعد لفوق
        aimBone(THREE, b.RightArm, b.RightForeArm, V(THREE, -0.85, 0.35, 0.25))
        aimBone(THREE, b.RightForeArm, b.RightHand, V(THREE, -0.15, 1, 0.2))
        waveQ = { RightArm: b.RightArm.quaternion.clone(), RightForeArm: b.RightForeArm.quaternion.clone() }
        b.RightArm.quaternion.copy(rest.RightArm)
        b.RightForeArm.quaternion.copy(rest.RightForeArm)
        resolve()
      },
      undefined,
      reject,
    )
  })

  const tmp = new THREE.Quaternion()
  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30)
    last = now
    for (const k of ['lookX', 'lookY', 'nod', 'talk', 'wave', 'think']) {
      for (let i = 0; i < 4; i++) stepS(S[k], dt / 4)
    }
    if (bones && rest) {
      const t = now / 1000
      S.breath = reduce ? 0 : Math.sin(t * 1.7)
      S.gx += dt * (2.2 + S.talk.x * 3)
      for (const n in rest) bones[n].quaternion.copy(rest[n])
      // تنفّس + ميلة خفيفة
      bones.Spine2.quaternion.multiply(Q(S.breath * 0.012, Math.sin(t * 0.5) * 0.02, 0))
      // الراس: بيبص للماوس + هزة الكلام + تفكير
      const th = S.think.x
      bones.Neck.quaternion.multiply(Q(S.lookY.x * 0.12 - th * 0.08, S.lookX.x * 0.25, 0))
      bones.Head.quaternion.multiply(
        Q(S.lookY.x * 0.14 + S.nod.x * 0.09 - th * 0.12, S.lookX.x * 0.3, th * 0.12 + Math.sin(t * 0.8) * 0.015),
      )
      // الإيدين وهو بيتكلم
      const w = Math.max(0, Math.min(1, S.talk.x))
      if (gest && w > 0.001) {
        const l = w * (0.55 + 0.45 * Math.sin(S.gx))
        const r = w * (0.55 + 0.45 * Math.sin(S.gx + 1.9))
        bones.LeftForeArm.quaternion.slerp(gest.LeftForeArm, l)
        bones.RightForeArm.quaternion.slerp(gest.RightForeArm, r)
        bones.LeftHand.quaternion.multiply(Q(0, 0, Math.sin(S.gx * 1.3) * 0.25 * w))
        bones.RightHand.quaternion.multiply(Q(0, 0, -Math.sin(S.gx * 1.1) * 0.25 * w))
      }
      // التلويح
      const wv = Math.max(0, Math.min(1, S.wave.x))
      if (waveQ && wv > 0.001) {
        bones.RightArm.quaternion.slerp(waveQ.RightArm, wv)
        tmp.copy(bones.RightForeArm.quaternion).slerp(waveQ.RightForeArm, wv)
        bones.RightForeArm.quaternion.copy(tmp).multiply(Q(0, 0, Math.sin(t * 9) * 0.35 * wv))
      }
    }
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  return {
    ready,
    resize,
    setLook(x, y) {
      S.lookX.t = Math.max(-1, Math.min(1, x))
      S.lookY.t = Math.max(-1, Math.min(1, y))
    },
    setSpeaking(on) {
      S.talk.t = on ? 1 : 0
    },
    pulse() {
      S.nod.v += 3.2
    },
    setMood(m) {
      S.wave.t = m === 'excited' ? 1 : 0
      S.think.t = m === 'thinking' ? 1 : 0
    },
    destroy() {
      destroyed = true
      cancelAnimationFrame(raf)
      renderer.dispose()
    },
  }
}

const Avatar3D = forwardRef(function Avatar3D({ reduceMotion = false }, ref) {
  const canvasRef = useRef(null)
  const stage = useRef(null)
  const fallbackRef = useRef(null)
  const [mode, setMode] = useState('loading') // loading | ready | fallback

  useImperativeHandle(
    ref,
    () => {
      const call = (fn, ...a) => {
        stage.current?.[fn]?.(...a)
        fallbackRef.current?.[fn]?.(...a)
      }
      return {
        setSpeaking: (on) => call('setSpeaking', on),
        pulse: () => call('pulse'),
        setLook: (x, y) => call('setLook', x, y),
        setMood: (m) => call('setMood', m),
      }
    },
    [],
  )

  useEffect(() => {
    let alive = true
    let ro
    const url = assetUrl('/vendor/three-gltf.js')
    import(/* @vite-ignore */ url)
      .then(({ THREE, GLTFLoader }) => {
        if (!alive || !canvasRef.current) return
        const s = createStage(THREE, GLTFLoader, canvasRef.current, reduceMotion)
        stage.current = s
        ro = new ResizeObserver(() => s.resize())
        ro.observe(canvasRef.current)
        return s.ready.then(() => alive && setMode('ready'))
      })
      .catch(() => alive && setMode('fallback'))
    return () => {
      alive = false
      ro?.disconnect()
      stage.current?.destroy()
      stage.current = null
    }
  }, [reduceMotion])

  return (
    <div className="qz-avatar3d" data-mode={mode}>
      <canvas ref={canvasRef} className="qz-avatar3d-canvas" aria-hidden="true" />
      {mode !== 'ready' && (
        <div className="qz-avatar3d-fallback">
          <AnimeAvatar ref={fallbackRef} reduceMotion={reduceMotion} />
        </div>
      )}
    </div>
  )
})

export default Avatar3D
