import { useSyncExternalStore } from 'react'

/*
 * الثيمات الثلاثة:
 * - 'green' → الأخضر الزمردي (الأصلي)
 * - 'red'   → الجمري: تدريج أحمر ⇠ أصفر
 * - 'gold'  → الذهبي: ثيم داكن بلمسات ذهبية فاخرة
 */

export const THEMES = ['green', 'red', 'gold']
const STORAGE_KEY = 'qassimz:theme'
const META_COLORS = {
  green: '#051F20',
  red: '#1A0A07',
  gold: '#1A1408',
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

export function setTheme(next, { fade = true } = {}) {
  if (!THEMES.includes(next) || next === theme) return
  theme = next
  const root = document.documentElement
  if (fade) root.classList.add('qz-theme-switching')
  root.dataset.theme = next
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[next])
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* وضع التصفح الخاص */
  }
  window.setTimeout(() => root.classList.remove('qz-theme-switching'), 650)
  listeners.forEach((fn) => fn(theme))
}

/*
 * تغيير الثيم بدايرة بتفرش على الصفحة كلها طالعة من العنصر اللي اتداس
 * (زرار الثيم). بيستخدم View Transitions API، والمتصفحات اللي مابتدعمهاش
 * أو تقليل الحركة: تبديل عادي بالـ fade القديم.
 */
export function setThemeWithWipe(next, originEl) {
  if (!THEMES.includes(next) || next === theme) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduce || !originEl) {
    setTheme(next)
    return
  }
  const r = originEl.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2
  const end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const root = document.documentElement
  root.classList.add('qz-vt-theme')
  const vt = document.startViewTransition(() => setTheme(next, { fade: false }))
  vt.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        {
          duration: 850,
          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
    .catch(() => {})
  vt.finished.finally(() => root.classList.remove('qz-vt-theme'))
}

export function toggleTheme() {
  const idx = THEMES.indexOf(theme)
  setTheme(THEMES[(idx + 1) % THEMES.length])
}

export function subscribeTheme(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useTheme() {
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'green')
}
