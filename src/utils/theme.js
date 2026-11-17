import { useSyncExternalStore } from 'react'

/*
 * الثيمات الثلاثة:
 * - 'green' → الأخضر الزمردي (الأصلي)
 * - 'red'   → الجمري: تدريج أحمر ⇠ أصفر
 * - 'blue'  → اللبني: الثيم الفاتح (خلفية فاتحة ونص داكن)
 */

export const THEMES = ['green', 'red', 'blue']
const STORAGE_KEY = 'qassimz:theme'
const META_COLORS = {
  green: '#051F20',
  red: '#1A0A07',
  blue: '#EBE2CC',
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

export function setTheme(next) {
  if (!THEMES.includes(next) || next === theme) return
  theme = next
  const root = document.documentElement
  root.classList.add('qz-theme-switching')
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