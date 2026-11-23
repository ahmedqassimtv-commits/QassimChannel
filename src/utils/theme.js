import { useSyncExternalStore } from 'react'

/*
 * الثيمات:
 * - 'night' → الليلي: خلفية macOS الداكنة (نيلي ⇠ بنفسجي) — الافتراضي
 * - 'green' → الأخضر الزمردي (الأصلي)
 * - 'red'   → الجمري: تدريج أحمر ⇠ أصفر
 */

export const THEMES = ['night', 'green', 'red']
const STORAGE_KEY = 'qassimz:theme'
const META_COLORS = {
  night: '#070A1F',
  green: '#051F20',
  red: '#1A0A07',
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
  document.documentElement.dataset.theme = 'night'
  return 'night'
}

let theme = readTheme()

export function getTheme() {
  return theme
}

let activeThemeTransition
let themeCleanupTimer
let themeVeil

export function setTheme(next) {
  if (!THEMES.includes(next) || next === theme) return
  const root = document.documentElement
  const apply = () => {
    theme = next
    root.dataset.theme = next
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[next])
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* Private browsing can block storage. */
    }
    listeners.forEach((fn) => fn(theme))
  }
  const previousPalette = getComputedStyle(root).getPropertyValue('--qz-bg-tint').trim()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  activeThemeTransition?.skipTransition()
  themeVeil?.remove()
  themeVeil = null
  if (!reducedMotion && typeof document.startViewTransition === 'function') {
    root.classList.remove('qz-theme-switching')
    activeThemeTransition = document.startViewTransition(apply)
    activeThemeTransition.finished.catch(() => {})
  } else {
    if (!reducedMotion) {
      root.classList.add('qz-theme-switching')
      // A fading old-palette veil also animates gradients on browsers without View Transitions.
      themeVeil = document.createElement('div')
      themeVeil.className = 'qz-theme-veil'
      themeVeil.setAttribute('aria-hidden', 'true')
      themeVeil.style.background = previousPalette || META_COLORS[theme]
      document.body.append(themeVeil)
      const veil = themeVeil
      veil.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' })
        .finished.then(() => { veil.remove(); if (themeVeil === veil) themeVeil = null }).catch(() => {})
    }
    apply()
    window.clearTimeout(themeCleanupTimer)
    themeCleanupTimer = window.setTimeout(() => root.classList.remove('qz-theme-switching'), 650)
  }
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
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'night')
}
