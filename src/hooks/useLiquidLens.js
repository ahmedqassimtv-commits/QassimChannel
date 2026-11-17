import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * عدسة liquidGL للقوائم المنسدلة (تحسين تدريجي):
 * - القائمة بتظهر فوراً بالزجاج الـ CSS العادي (.qassimz-dropdown-shell)
 * - بعد ما أنيميشن الفتح يخلص، بنركّب عدسة liquidGL على طبقة خلفية جوه القائمة
 * - لما العدسة تجهز (on.init) بس، بنشيل خلفية الـ CSS → مفيش وميض ولا لحظة فاضية
 * - لو الجهاز ضعيف / reduce-motion / مفيش WebGL → بيفضل الزجاج الـ CSS زي ما هو
 *
 * ملاحظة: liquidGL بيخلي العنصر الهدف opacity:0 و pointer-events:none،
 * عشان كده الهدف طبقة span فاضية جوه القائمة، مش القائمة نفسها (وإلا اللينكات مش هتتداس).
 */

// كل العدسات بتتشارك نفس الـ canvas جوه الهيدر الثابت، فلازم نفس الـ zIndex (= z-50 بتاع الهيدر)
const LENS_Z_INDEX = 50

const LENS_OPTIONS = {
  snapshot: 'body',
  resolution: 1, // أخف من الافتراضي (2) عشان الفتح يفضل سريع
  zIndex: LENS_Z_INDEX,
  content: false,
  refraction: 0.012,
  bevelDepth: 0.05,
  bevelWidth: 0.18,
  frost: 3.5, // تغبيش أعلى شوية عشان النص يفضل مقروء
  aberration: 0,
  tint: 'rgba(5, 31, 32, 0.6)', // نفس درجة #051F20 بتاعة الموقع
  shadow: false, // القائمة عندها ظل CSS أصلاً
  specular: true,
  reveal: 'fade',
}

let liquidGLPromise = null
export function loadLiquidGL() {
  if (!liquidGLPromise) {
    liquidGLPromise = import('liquid-gl')
      .then((mod) => mod.default || window.liquidGL || null)
      .catch(() => null)
  }
  return liquidGLPromise
}

// صبغة العدسة بلون الثيم الحالي (liquidGL مابيفهمش متغيرات CSS فبنقراها بنفسنا)
function themeTint() {
  const rgb = getComputedStyle(document.documentElement).getPropertyValue('--qz-ink-rgb').trim()
  const parts = rgb.split(/\s+/).map(Number)
  return parts.length === 3 && parts.every(Number.isFinite)
    ? `rgba(${parts.join(', ')}, 0.6)`
    : LENS_OPTIONS.tint
}

export function canUseLiquidGL() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  const cores = navigator.hardwareConcurrency || 8
  if (cores < 4) return false
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return false
  return true
}

/**
 * @param {boolean} open      هل القائمة مفتوحة
 * @param {string}  selector  سيليكتور طبقة العدسة جوه القائمة، مثلاً '[data-qz-lens="verdict"]'
 * @returns {{ active: boolean, attach: () => void }}
 *   attach → حطها في onAnimationComplete بتاع القائمة
 *   active → true لما العدسة تشتغل فعلاً (استخدمها في data-liquid-active)
 */
export default function useLiquidLens(open, selector) {
  const lensRef = useRef(null)
  const tokenRef = useRef(0)
  const [active, setActive] = useState(false)

  const teardown = useCallback(() => {
    tokenRef.current += 1
    const lens = lensRef.current
    lensRef.current = null
    if (lens) {
      try {
        lens.destroy?.()
      } catch {
        /* العدسة اتشالت بالفعل */
      }
    }
  }, [])

  const attach = useCallback(async () => {
    if (!open || lensRef.current || !canUseLiquidGL()) return
    const token = ++tokenRef.current

    const liquidGL = await loadLiquidGL()
    if (!liquidGL || token !== tokenRef.current) return
    if (!document.querySelector(selector)) return

    try {
      const result = liquidGL({
        ...LENS_OPTIONS,
        tint: themeTint(),
        target: selector,
        on: {
          init: () => {
            if (token === tokenRef.current) setActive(true)
          },
        },
      })
      const lens = Array.isArray(result) ? result[0] : result
      if (!lens) return
      if (token !== tokenRef.current) {
        lens.destroy?.()
        return
      }
      lensRef.current = lens
    } catch (error) {
      // أي فشل → نفضل على زجاج الـ CSS
      if (import.meta.env?.DEV) console.warn('liquidGL lens failed, using CSS glass', error)
    }
  }, [open, selector])

  // القفل: نشيل العدسة فوراً قبل أنيميشن الخروج فترجع خلفية الـ CSS بنعومة
  useEffect(() => {
    if (open) return
    teardown()
    setActive(false)
  }, [open, teardown])

  useEffect(() => teardown, [teardown])

  return { active, attach }
}
