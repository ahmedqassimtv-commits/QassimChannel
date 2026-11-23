import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

/*
 * الثيمات الثلاثة:
 * - 'green' → الأخضر الزمردي (الأصلي)
 * - 'red'   → الجمري: تدريج أحمر ⇠ أصفر
 * - 'gold'  → الذهبي: ثيم داكن بلمسات ذهبية فاخرة
 */

export const THEMES = ['green', 'red', 'gold']
const STORAGE_KEY = 'qassimz:theme'

export const THEME_META = {
  green: {
    name: 'الزمردي',
    label: 'الثيم الزمردي',
    color: '#051F20',
    accent: '#8EF0D2',
    ring: 'rgba(142, 240, 210, 0.72)',
    wash: 'rgba(5, 31, 32, 0.38)',
  },
  red: {
    name: 'الجمري',
    label: 'الثيم الجمري',
    color: '#1A0A07',
    accent: '#FFA046',
    ring: 'rgba(255, 160, 70, 0.76)',
    wash: 'rgba(138, 42, 18, 0.34)',
  },
  gold: {
    name: 'الذهبي',
    label: 'الثيم الذهبي',
    color: '#1A1408',
    accent: '#E8C96A',
    ring: 'rgba(232, 201, 106, 0.78)',
    wash: 'rgba(138, 109, 59, 0.34)',
  },
}

const listeners = new Set()

function readTheme() {
  if (typeof document === 'undefined') return 'green'
  const current = document.documentElement.dataset.theme
  if (THEMES.includes(current)) return current
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (THEMES.includes(saved)) {
      document.documentElement.dataset.theme = saved
      return saved
    }
  } catch {
    /* وضع التصفح الخاص */
  }
  document.documentElement.dataset.theme = 'green'
  return 'green'
}

let theme = readTheme()

export function getTheme() {
  return theme
}

function spawnThemeWave(next, x, y, endRadius) {
  if (typeof document === 'undefined') return
  const meta = THEME_META[next] || THEME_META.green

  // حلقة موجية مضيئة تتوسع من موضع زر الثيم لتوضيح حركة الانتقال عبر كامل الشاشة
  const ring = document.createElement('div')
  ring.className = 'qz-theme-wave-ring'
  ring.setAttribute('aria-hidden', 'true')
  ring.style.setProperty('--qz-wave-x', `${x}px`)
  ring.style.setProperty('--qz-wave-y', `${y}px`)
  ring.style.setProperty('--qz-wave-size', `${Math.ceil(endRadius * 2.15)}px`)
  ring.style.setProperty('--qz-wave-color', meta.ring)
  ring.style.setProperty('--qz-wave-accent', meta.accent)
  document.body.appendChild(ring)

  const cleanup = () => {
    ring.remove()
  }

  if (typeof ring.animate === 'function') {
    const anim = ring.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.015)', opacity: 0.95, borderWidth: '4px' },
        { transform: 'translate(-50%, -50%) scale(0.42)', opacity: 0.72, borderWidth: '2.5px', offset: 0.45 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0, borderWidth: '1px' },
      ],
      {
        duration: 860,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      },
    )
    anim.finished.then(cleanup).catch(cleanup)
  } else {
    window.setTimeout(cleanup, 900)
  }
}

function spawnFallbackWipe(next, x, y, endRadius) {
  if (typeof document === 'undefined') return
  const meta = THEME_META[next] || THEME_META.green
  const veil = document.createElement('div')
  veil.className = 'qz-theme-fallback-wipe'
  veil.setAttribute('aria-hidden', 'true')
  veil.style.setProperty('--qz-wave-wash', meta.wash)
  veil.style.setProperty('--qz-wave-accent', meta.accent)
  document.body.appendChild(veil)

  const cleanup = () => veil.remove()

  if (typeof veil.animate === 'function') {
    const anim = veil.animate(
      [
        { clipPath: `circle(0px at ${x}px ${y}px)`, opacity: 0.85 },
        { clipPath: `circle(${Math.ceil(endRadius * 0.65)}px at ${x}px ${y}px)`, opacity: 0.55, offset: 0.5 },
        { clipPath: `circle(${Math.ceil(endRadius * 1.1)}px at ${x}px ${y}px)`, opacity: 0 },
      ],
      {
        duration: 820,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      },
    )
    anim.finished.then(cleanup).catch(cleanup)
  } else {
    window.setTimeout(cleanup, 860)
  }
}

export function setTheme(next, { fade = true } = {}) {
  if (!THEMES.includes(next) || next === theme) return
  theme = next
  const root = document.documentElement
  if (fade) root.classList.add('qz-theme-switching')
  root.dataset.theme = next
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', (THEME_META[next] || THEME_META.green).color)
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* وضع التصفح الخاص */
  }
  window.setTimeout(() => root.classList.remove('qz-theme-switching'), 680)
  listeners.forEach((fn) => fn(theme))
}

/*
 * تغيير الثيم بحركة دائرية موجية تنطلق من زر التبديل وتفرش على الصفحة بالكامل:
 * - في المتصفحات الداعمة لـ View Transitions API: انتقال دائري متزامن مع flushSync + حلقة موجية مضيئة.
 * - في باقي المتصفحات: موجة لونية دائرية تتمدد من الزر مع تلاشي سلس لمتغيرات الثيم.
 * - عند تفعيل تقليل الحركة: تبديل هادئ فوري بدون حركة دائرية.
 */
export function setThemeWithWipe(next, originEl) {
  if (!THEMES.includes(next) || next === theme) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    setTheme(next, { fade: false })
    return
  }

  const r = originEl?.getBoundingClientRect?.()
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2
  const y = r ? r.top + r.height / 2 : 44
  const end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

  spawnThemeWave(next, x, y, end)

  if (!document.startViewTransition) {
    spawnFallbackWipe(next, x, y, end)
    setTheme(next, { fade: true })
    return
  }

  const root = document.documentElement
  root.classList.add('qz-vt-theme')

  const vt = document.startViewTransition(() => {
    flushSync(() => {
      setTheme(next, { fade: false })
    })
  })

  vt.ready
    .then(() => {
      root.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${Math.ceil(end)}px at ${x}px ${y}px)`],
        },
        {
          duration: 820,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
      root.animate(
        {
          opacity: [1, 0.92],
        },
        {
          duration: 820,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-old(root)',
        },
      )
    })
    .catch(() => {})

  vt.finished.finally(() => root.classList.remove('qz-vt-theme'))
}

export function toggleTheme(originEl) {
  const idx = THEMES.indexOf(theme)
  const next = THEMES[(idx + 1) % THEMES.length]
  if (originEl) setThemeWithWipe(next, originEl)
  else setTheme(next)
}

export function subscribeTheme(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useTheme() {
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'green')
}
