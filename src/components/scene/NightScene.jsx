import { useEffect, useRef } from 'react'
import { SPRINGS, kick, register, spring, springGroup } from '../../motion/springs.js'

/* ══ الخلفية — «ليل الاستوديو» ══════════════════════════════════════════
   بدل الحرير والأضلاع: أرضية شبه سودا (بلون حبر الثيم) وفيها:
   - 3 كرات نور ناعمة بلون الوهج بتسرح ببطء شديد (transform بس)
   - شبكة نقط رفيعة مابتبانش غير حوالين الماوس، كأنها كشاف بيمسح الأرضية
   - خط أفق منوّر خفيف وvignette، وحبيبات فيلم ثابتة
   كله CSS: مفيش WebGL، والماوس بيتحرك بـspring واحد (follow 900/50).
   مع prefers-reduced-motion الكرات بتقف والكشاف بيثبت في النص. */

export default function NightScene() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined
    const x = spring(window.innerWidth / 2, SPRINGS.soft)
    const y = spring(window.innerHeight * 0.35, SPRINGS.soft)
    const unreg = register(
      springGroup(
        { x, y },
        () => {
          el.style.setProperty('--mx', `${x.x.toFixed(1)}px`)
          el.style.setProperty('--my', `${y.x.toFixed(1)}px`)
        },
        0.2,
      ),
    )
    const onMove = (e) => {
      x.t = e.clientX
      y.t = e.clientY
      kick()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      unreg()
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div ref={ref} className="qz-night" aria-hidden="true">
      <i className="qz-night-orb qz-night-orb-a" />
      <i className="qz-night-orb qz-night-orb-b" />
      <i className="qz-night-orb qz-night-orb-c" />
      <i className="qz-night-horizon" />
      <i className="qz-night-dots" />
      <i className="qz-night-spot" />
      <i className="qz-night-grain" />
    </div>
  )
}
