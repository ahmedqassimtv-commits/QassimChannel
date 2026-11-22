/* ══ Springs — one physics loop for every interactive component ══════════
   Ported from designbookmark's shared/motion.js so components move the same:
   - spring state { x, v, t, k, c } with mass 1
   - semi-implicit Euler: a = -k(x - t) - c·v ; v += a·dt ; x += v·dt
   - one rAF loop, frame dt clamped to 1/30 s, 4 physics substeps per frame
   - prefers-reduced-motion → critical damping (c = 2√k), so nothing overshoots
   Unlike the original, the loop sleeps when every registered spring is at rest,
   so an idle page costs nothing. */

// Presets from designbookmark shared/tokens.css ("stiffness damping")
export const SPRINGS = {
  follow: [900, 50],
  settle: [280, 22],
  soft: [260, 24],
  lead: [620, 36],
  trail: [190, 19],
  pop: [520, 16],
  fade: [420, 32],
  // Morph Select / Trend menu (used by the spring dropdown)
  selectOpen: [360, 24],
  selectHl: [620, 34],
  menu: [330, 25],
  // Rolling counter (plan switch price)
  countRoll: [320, 24],
  countWidth: [380, 22],
}
export const STAGGER_MS = 45

const reduceQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null
export const prefersReduced = () => !!reduceQuery?.matches

/** Create a spring at rest at x. */
export function spring(x = 0, [k, c] = SPRINGS.settle) {
  const s = { x, v: 0, t: x, k: 400, c: 30 }
  tune(s, [k, c])
  return s
}

export function tune(s, [k, c]) {
  s.k = k
  s.c = prefersReduced() ? 2 * Math.sqrt(k) : c
  return s
}

export function step(s, dt) {
  const a = -s.k * (s.x - s.t) - s.c * s.v
  s.v += a * dt
  s.x += s.v * dt
}

export const atRest = (s, eps = 0.001) => Math.abs(s.x - s.t) < eps && Math.abs(s.v) < eps * 10

/* ── the loop ── */
const comps = new Set()
let raf = 0
let last = 0
const SUB = 4

function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30)
  last = now
  for (const c of comps) {
    for (let i = 0; i < SUB; i++) c.frame(dt / SUB)
  }
  let busy = false
  for (const c of comps) {
    c.render()
    if (!c.idle || !c.idle()) busy = true
  }
  raf = busy ? requestAnimationFrame(frame) : 0
}

/** Wake the loop (call after changing any spring target). */
export function kick() {
  if (raf || typeof window === 'undefined') return
  last = performance.now()
  raf = requestAnimationFrame(frame)
}

/**
 * Register a component: { frame(dt), render(), idle?() }.
 * Returns an unregister function.
 */
export function register(comp) {
  comps.add(comp)
  kick()
  return () => comps.delete(comp)
}

/** Helper: a component driven by a map of named springs. */
export function springGroup(springs, render, eps) {
  const list = Object.values(springs)
  return {
    frame(dt) {
      for (const s of list) step(s, dt)
    },
    render,
    idle() {
      const done = list.every((s) => atRest(s, eps))
      if (done) for (const s of list) ((s.x = s.t), (s.v = 0))
      return done
    },
  }
}

if (reduceQuery?.addEventListener) {
  reduceQuery.addEventListener('change', () => kick())
}
