import { useCallback, useEffect, useRef, useState } from 'react'
import { canUseLiquidGL, loadLiquidGL } from './useLiquidLens.js'

/*
 * عدسة liquidGL دايمة على عنصر ظاهر طول الوقت (زي فقاعة التبديل بين الأفلام والمسلسلات).
 *
 * الحيلة: الحاوية لازم تبقى `sticky` + z-index → liquidGL بيعتبرها "anchor" وبيحط الـ canvas جواها
 * تحت الأزرار ومن فوق خلفيتها (نفس فكرة الهيدر الثابت). والـ snapshot بيبقى للحاوية بس → خفيف جداً.
 *
 * - العدسة بتتعمل بعد ما الصفحة تهدى (idle) عشان ماتأخرش أول ظهور
 * - sync() → نادِها مع كل فريم أنيميشن عشان العدسة تمشي مع الفقاعة
 * - refreshKey → لو اتغير (مثلاً الثيم) العدسة بتتعمل من جديد بصورة محدثة
 * - أي فشل / جهاز ضعيف → active يفضل false والفقاعة بتفضل بزجاج الـ CSS
 */

const DEFAULTS = {
  resolution: 1.5,
  content: false,
  refraction: 0.022,
  bevelDepth: 0.09,
  bevelWidth: 0.26,
  frost: 0,
  aberration: 0, // من غير فصل ألوان RGB (كان بيبان غريب وقت الانتقال)
  tint: 'rgba(255, 255, 255, 0.05)',
  shadow: false,
  specular: true,
  reveal: 'fade',
}

export default function useLiquidElement({
  enabled = true,
  target,
  snapshot,
  zIndex,
  options,
  refreshKey,
  delay = 650,
}) {
  const lensRef = useRef(null)
  const optionsRef = useRef(options)
  optionsRef.current = options
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!enabled || !target || !canUseLiquidGL()) return undefined

    let cancelled = false
    let lens = null
    let idleId = null

    const start = async () => {
      const liquidGL = await loadLiquidGL()
      if (cancelled || !liquidGL || !document.querySelector(target)) return
      try {
        const result = liquidGL({
          ...DEFAULTS,
          ...optionsRef.current,
          target,
          snapshot: snapshot || target,
          zIndex,
          on: {
            init: () => {
              if (!cancelled) setActive(true)
            },
          },
        })
        lens = Array.isArray(result) ? result[0] : result
        if (!lens) return
        if (cancelled) {
          lens.destroy?.()
          lens = null
          return
        }
        lensRef.current = lens
      } catch (error) {
        if (import.meta.env?.DEV) console.warn('liquidGL element failed, using CSS glass', error)
      }
    }

    const timer = window.setTimeout(() => {
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(start, { timeout: 1500 })
      else start()
    }, delay)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId)
      lensRef.current = null
      try {
        lens?.destroy?.()
      } catch {
        /* اتشالت بالفعل */
      }
      setActive(false)
    }
  }, [enabled, target, snapshot, zIndex, refreshKey, delay])

  // تحديث مكان العدسة أثناء حركة الفقاعة
  const sync = useCallback(() => {
    const lens = lensRef.current
    if (!lens) return
    try {
      lens.updateMetrics?.()
      lens.renderer?.render?.()
    } catch {
      /* تجاهل */
    }
  }, [])

  return { active, sync }
}
