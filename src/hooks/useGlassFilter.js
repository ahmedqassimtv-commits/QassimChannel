import { useEffect, useRef } from 'react'
import { canRefract, getGlassMap } from '../utils/glassMap.js'

/*
 * بيركّب فلتر انكسار SVG خاص بالعنصر (بخريطة على مقاسه الحقيقي) ويطبقه كـ backdrop-filter.
 * - شغال في Chrome/Edge بس (html.qz-refract) — باقي المتصفحات بتفضل على الـ blur اللي في الـ CSS
 * - الخريطة بتتعمل من جديد لو المقاس اتغير (ResizeObserver + rAF)، ومتخزنة في كاش
 *
 * options:
 *  radius  : نصف قطر الزوايا بالبكسل (9999 = كبسولة)
 *  bevel   : عرض الحافة الزجاجية
 *  scale   : قوة الانكسار بالبكسل
 *  magnify : تكبير القلب
 *  after   : فلاتر CSS بعد الانكسار (blur/saturate...)
 *  enabled : تشغيل/إيقاف
 */

const SVG_NS = 'http://www.w3.org/2000/svg'
let root = null
let uid = 0

function getDefs() {
  if (root?.isConnected) return root
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
  root = document.createElementNS(SVG_NS, 'defs')
  svg.appendChild(root)
  document.body.appendChild(svg)
  return root
}

function createFilter(id, scale, blur) {
  const f = document.createElementNS(SVG_NS, 'filter')
  f.setAttribute('id', id)
  f.setAttribute('x', '0')
  f.setAttribute('y', '0')
  f.setAttribute('width', '100%')
  f.setAttribute('height', '100%')
  f.setAttribute('filterUnits', 'objectBoundingBox')
  f.setAttribute('color-interpolation-filters', 'sRGB')

  const img = document.createElementNS(SVG_NS, 'feImage')
  img.setAttribute('x', '0')
  img.setAttribute('y', '0')
  img.setAttribute('width', '100%')
  img.setAttribute('height', '100%')
  img.setAttribute('preserveAspectRatio', 'none')
  img.setAttribute('result', 'map')

  const disp = document.createElementNS(SVG_NS, 'feDisplacementMap')
  disp.setAttribute('in', 'SourceGraphic')
  disp.setAttribute('in2', 'map')
  disp.setAttribute('scale', String(scale))
  disp.setAttribute('xChannelSelector', 'R')
  disp.setAttribute('yChannelSelector', 'G')
  disp.setAttribute('result', 'd')

  f.appendChild(img)
  f.appendChild(disp)
  if (blur > 0) {
    const g = document.createElementNS(SVG_NS, 'feGaussianBlur')
    g.setAttribute('in', 'd')
    g.setAttribute('stdDeviation', String(blur))
    f.appendChild(g)
  }
  getDefs().appendChild(f)
  return { filter: f, img }
}

export default function useGlassFilter(
  ref,
  { radius = 9999, bevel = 14, scale = 40, magnify = 0.04, edgeBlur = 0.3, after = 'saturate(150%)', enabled = true } = {}
) {
  const idRef = useRef(null)
  if (!idRef.current) {
    uid += 1
    idRef.current = `qz-gf-${uid}`
  }

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el || typeof window === 'undefined') return undefined
    if (!canRefract()) return undefined

    const id = idRef.current
    const { filter, img } = createFilter(id, scale, edgeBlur)
    let lastKey = ''
    let raf = null

    const update = () => {
      raf = null
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      if (!w || !h) return
      const key = `${Math.round(w / 4)}x${Math.round(h / 4)}`
      if (key === lastKey) return
      lastKey = key
      const url = getGlassMap(w, h, { radius, bevel, magnify })
      if (!url) return
      img.setAttribute('href', url)
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url)
      const value = `url(#${id}) ${after}`.trim()
      el.style.backdropFilter = value
      el.style.webkitBackdropFilter = value
    }

    const schedule = () => {
      if (raf == null) raf = window.requestAnimationFrame(update)
    }

    update()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    ro?.observe(el)

    return () => {
      ro?.disconnect()
      if (raf != null) window.cancelAnimationFrame(raf)
      el.style.backdropFilter = ''
      el.style.webkitBackdropFilter = ''
      filter.remove()
    }
  }, [ref, radius, bevel, scale, magnify, edgeBlur, after, enabled])
}
