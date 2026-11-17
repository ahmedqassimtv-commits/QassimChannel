import { useRef } from 'react'
import useGlassFilter from '../../hooks/useGlassFilter.js'

/*
 * طبقة زجاج سائل (زي صورة الورد المرجعية): القلب صافي والحواف بتكسر اللي وراها.
 *
 * بتتحط كأول ابن جوه عنصر عامل stacking context (relative + z-index أو transform)،
 * وبتقعد ورا المحتوى بـ z-index سالب. كده العنصر الأب نفسه مافيهوش backdrop-filter
 * → أي فقاعة جواه تقدر تكسر الصفحة بحرية من غير «البقعة الغامقة».
 */
export default function GlassLayer({ radius = 9999, bevel = 14, scale = 40, magnify = 0.03, after, className = '' }) {
  const ref = useRef(null)
  useGlassFilter(ref, { radius, bevel, scale, magnify, after })
  return <span ref={ref} aria-hidden="true" className={`qz-glass-layer pointer-events-none absolute inset-0 -z-10 ${className}`} />
}
