import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { assetUrl } from '../../utils/assets.js'
import AnimeAvatar from './AnimeAvatar.jsx'

/* ══ قاسم الافتراضي ثلاثي الأبعاد — Avatar3D ══════════════════════════
   نموذج Avaturn GLB بحركة ناعمة ومتّزنة تتناغم مع فيزياء النافبار:
   - نوابض مخمّدة بدقة لتتبّع المؤشر، التنفّس الهادئ، هزّة الكلام المتّزنة،
     إيماءات اليدين أثناء الشرح، التلويح الترحيبي، وميلة التفكير.
   - إضاءة حافة (Rim Light) تتفاعل تلقائياً مع تبديل ثيمات الموقع (الزمردي /
     الجمري / الذهبي) بدون إعادة تحميل المشهد.
   - عودة سلسة لشخصية الأنمي أثناء التحميل أو عند غياب WebGL. */

const V = (THREE, x, y, z) => new THREE.Vector3(x, y, z)

function aimBone(THREE, bone, child, dir) {
  if (!bone || !child || !bone.parent) return
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  bone.updateWorldMatrix(true, false)
  child.updateWorldMatrix(true, false)
  bone.getWorldPosition(a)
  child.getWorldPosition(b)
  const q = new THREE.Quaternion().setFromUnitVectors(
    b.sub(a).normalize(),
    dir.clone().normalize(),
  )
  const wq = new THREE.Quaternion()
  const pq = new THREE.Quaternion()
  bone.getWorldQuaternion(wq)
  bone.parent.getWorldQuaternion(pq)
  bone.quaternion.copy(pq.invert().multiply(q.multiply(wq)))
  bone.updateWorldMatrix(false, true)
}

// نابض فيزيائي متّزن متناغم مع إيقاع SPRING_NAV
const sp = (x = 0, k = 90, c = 17) => ({ x, v: 0, t: x, k, c })
const stepS = (s, dt) => {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt
  s.x += s.v * dt
}

function readThemeRimRgb() {
  const glow =
    getComputedStyle(document.documentElement).getPropertyValue('--qz-glow-rgb').trim() ||
    '142 240 210'
  const parts = glow.split(/\s+/).map((n) => Number(n) / 255)
  return parts.length >= 3 && parts.every((v) => Number.isFinite(v)) ? parts : [0.56, 0.94, 0.82]
}

function createStage(THREE, GLTFLoader, canvas, reduce) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06

  const scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223330, 1.55))

  const key = new THREE.DirectionalLight(0xffffff, 2.15)
  key.position.set(1.2, 2.2, 2.5)
  scene.add(key)

  const [gr, gg, gb] = readThemeRimRgb()
  const rim = new THREE.DirectionalLight(new THREE.Color(gr, gg, gb), 2.8)
  rim.position.set(-1.5, 2, -2)
  scene.add(rim)

  const rimTarget = new THREE.Color(gr, gg, gb)
  const syncThemeLight = () => {
    const [r, g, b] = readThemeRimRgb()
    rimTarget.setRGB(r, g, b)
  }
  const themeObserver = new MutationObserver(syncThemeLight)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  const camera = new THREE.PerspectiveCamera(27, 1, 0.05, 20)
  camera.position.set(0, 1.48, 1.76)
  camera.lookAt(0, 1.43, 0)

  // نوابض مضبوطة على حركة سلسة بدون ارتعاش لتتناغم مع حركة النافبار
  const S = {
    breath: 0,
    lookX: sp(0, 48, 13.5),
    lookY: sp(0, 48, 13.5),
    nod: sp(0, 190, 19),
    talk: sp(0, 72, 16),
    wave: sp(0, 58, 14.5),
    think: sp(0, 58, 15.5),
    entrance: sp(0, 54, 14),
    gx: 0,
  }

  let bones = null
  let rest = null
  let gest = null
  let waveQ = null
  let modelRoot = null
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
        modelRoot = model
        scene.add(model)
        const b = {}
        model.traverse((o) => {
          if (o.isBone) b[o.name] = o
          if (o.isMesh) o.frustumCulled = false
        })
        bones = b

        // وضعية راحة طبيعية للذراعين
        aimBone(THREE, b.LeftArm, b.LeftForeArm, V(THREE, 0.16, -1, 0.06))
        aimBone(THREE, b.RightArm, b.RightForeArm, V(THREE, -0.16, -1, 0.06))
        aimBone(THREE, b.LeftForeArm, b.LeftHand, V(THREE, 0.06, -1, 0.34))
        aimBone(THREE, b.RightForeArm, b.RightHand, V(THREE, -0.06, -1, 0.34))

        const names = [
          'Spine',
          'Spine1',
          'Spine2',
          'Neck',
          'Head',
          'LeftArm',
          'RightArm',
          'LeftForeArm',
          'RightForeArm',
          'LeftHand',
          'RightHand',
        ].filter((n) => b[n])
        rest = Object.fromEntries(names.map((n) => [n, b[n].quaternion.clone()]))

        // وضعية الشرح الحواري الهادئ
        aimBone(THREE, b.LeftForeArm, b.LeftHand, V(THREE, 0.24, 0.14, 1))
        aimBone(THREE, b.RightForeArm, b.RightHand, V(THREE, -0.24, 0.14, 1))
        gest = {
          LeftForeArm: b.LeftForeArm?.quaternion.clone(),
          RightForeArm: b.RightForeArm?.quaternion.clone(),
        }
        if (rest.LeftForeArm) b.LeftForeArm.quaternion.copy(rest.LeftForeArm)
        if (rest.RightForeArm) b.RightForeArm.quaternion.copy(rest.RightForeArm)

        // وضعية التلويح الترحيبي
        aimBone(THREE, b.RightArm, b.RightForeArm, V(THREE, -0.82, 0.34, 0.26))
        aimBone(THREE, b.RightForeArm, b.RightHand, V(THREE, -0.14, 1, 0.22))
        waveQ = {
          RightArm: b.RightArm?.quaternion.clone(),
          RightForeArm: b.RightForeArm?.quaternion.clone(),
        }
        if (rest.RightArm) b.RightArm.quaternion.copy(rest.RightArm)
        if (rest.RightForeArm) b.RightForeArm.quaternion.copy(rest.RightForeArm)

        S.entrance.t = 1
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

    for (const k of ['lookX', 'lookY', 'nod', 'talk', 'wave', 'think', 'entrance']) {
      for (let i = 0; i < 4; i++) stepS(S[k], dt / 4)
    }

    // انتقال سلس للون إضاءة الحافة عند تبديل الثيم
    rim.color.lerp(rimTarget, Math.min(1, dt * 6))

    if (bones && rest) {
      const t = now / 1000
      S.breath = reduce ? 0 : Math.sin(t * 1.45)
      S.gx += dt * (1.85 + S.talk.x * 2.5)

      for (const n in rest) bones[n].quaternion.copy(rest[n])

      if (modelRoot) {
        // استقرار هادئ للنموذج عند فتح لوح النافبار
        const lift = (1 - S.entrance.x) * -0.045
        modelRoot.position.y = lift
        modelRoot.rotation.y = reduce ? 0 : Math.sin(t * 0.42) * 0.025 + S.lookX.x * 0.05
      }

      // تنفّس طبيعي ناعم في الجذع
      if (bones.Spine2) {
        bones.Spine2.quaternion.multiply(Q(S.breath * 0.011, Math.sin(t * 0.45) * 0.016, 0))
      }

      // حركة الرأس والعنق: تتبع ناعم للمؤشر + هزّة كلام متّزنة + ميلة تفكير
      const th = S.think.x
      if (bones.Neck) {
        bones.Neck.quaternion.multiply(Q(S.lookY.x * 0.1 - th * 0.07, S.lookX.x * 0.22, 0))
      }
      if (bones.Head) {
        bones.Head.quaternion.multiply(
          Q(
            S.lookY.x * 0.12 + S.nod.x * 0.072 - th * 0.1,
            S.lookX.x * 0.26,
            th * 0.11 + (reduce ? 0 : Math.sin(t * 0.72) * 0.012),
          ),
        )
      }

      // إيماءات اليدين أثناء الحديث
      const w = Math.max(0, Math.min(1, S.talk.x))
      if (gest && w > 0.001) {
        const l = w * (0.52 + 0.42 * Math.sin(S.gx))
        const r = w * (0.52 + 0.42 * Math.sin(S.gx + 1.85))
        if (bones.LeftForeArm && gest.LeftForeArm) {
          bones.LeftForeArm.quaternion.slerp(gest.LeftForeArm, l)
        }
        if (bones.RightForeArm && gest.RightForeArm) {
          bones.RightForeArm.quaternion.slerp(gest.RightForeArm, r)
        }
        if (bones.LeftHand) {
          bones.LeftHand.quaternion.multiply(Q(0, 0, Math.sin(S.gx * 1.2) * 0.22 * w))
        }
        if (bones.RightHand) {
          bones.RightHand.quaternion.multiply(Q(0, 0, -Math.sin(S.gx * 1.05) * 0.22 * w))
        }
      }

      // التلويح الترحيبي السلس
      const wv = Math.max(0, Math.min(1, S.wave.x))
      if (waveQ && wv > 0.001) {
        if (bones.RightArm && waveQ.RightArm) {
          bones.RightArm.quaternion.slerp(waveQ.RightArm, wv)
        }
        if (bones.RightForeArm && waveQ.RightForeArm) {
          tmp.copy(bones.RightForeArm.quaternion).slerp(waveQ.RightForeArm, wv)
          bones.RightForeArm.quaternion
            .copy(tmp)
            .multiply(Q(0, 0, Math.sin(t * 7.5) * 0.28 * wv))
        }
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
      S.nod.v = Math.min(S.nod.v + 2.1, 3.8)
    },
    setMood(m) {
      S.wave.t = m === 'excited' ? 1 : 0
      S.think.t = m === 'thinking' ? 1 : 0
    },
    destroy() {
      destroyed = true
      themeObserver.disconnect()
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
