import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { assetUrl } from '../../utils/assets.js'

/* ══ قاسم الأنمي — بديل سلس أثناء تحميل نموذج الـ 3D أو عند غياب WebGL ══
   التحكم من الخارج عبر ref:
     setSpeaking(bool) · pulse() · setLook(x, y) · setMood('idle'|'excited'|'thinking') */

const SRC = (n) => assetUrl(`/avatar/anime/${n}.webp`)

const PATCH = {
  aa: { left: '21.061%', top: '56.287%', width: '60.455%' },
  oo: { left: '21.061%', top: '56.287%', width: '60.455%' },
  blink: { left: '16.515%', top: '36.627%', width: '68.333%' },
}

const VISEMES = [
  [
    ['aa', 110],
    ['oo', 90],
    ['', 60],
  ],
  [
    ['oo', 100],
    ['aa', 120],
    ['', 50],
  ],
  [
    ['aa', 140],
    ['', 50],
    ['aa', 90],
  ],
]

const AnimeAvatar = forwardRef(function AnimeAvatar({ reduceMotion = false, className = '' }, ref) {
  const rootRef = useRef(null)
  const timers = useRef([])
  const state = useRef({ speaking: false, mood: 'idle' })

  const set = (k, v) => {
    const el = rootRef.current
    if (!el) return
    if (v) el.dataset[k] = v
    else delete el.dataset[k]
  }
  const later = (fn, ms) => timers.current.push(window.setTimeout(fn, ms))

  useImperativeHandle(
    ref,
    () => ({
      setSpeaking(on) {
        state.current.speaking = on
        set('speaking', on ? 'true' : '')
        if (!on) set('mouth', '')
      },
      pulse() {
        if (state.current.mood !== 'idle') return
        const seq = VISEMES[(Math.random() * VISEMES.length) | 0]
        let t = 0
        seq.forEach(([m, d]) => {
          later(() => set('mouth', m), t)
          t += d
        })
        later(() => set('mouth', ''), t)
      },
      setLook(x, y) {
        if (reduceMotion) return
        const el = rootRef.current
        if (!el) return
        el.style.setProperty('--lx', Math.max(-1, Math.min(1, x)).toFixed(3))
        el.style.setProperty('--ly', Math.max(-1, Math.min(1, y)).toFixed(3))
      },
      setMood(m) {
        state.current.mood = m
        set('mood', m === 'idle' ? '' : m)
        if (m !== 'idle') set('mouth', '')
      },
    }),
    [reduceMotion],
  )

  useEffect(() => {
    let alive = true
    let t
    const blinkOnce = (after) => {
      set('blink', 'true')
      window.setTimeout(() => {
        set('blink', '')
        after?.()
      }, 110)
    }
    const loop = () => {
      t = window.setTimeout(
        () => {
          if (!alive) return
          if (state.current.mood === 'idle') {
            if (Math.random() < 0.22) blinkOnce(() => window.setTimeout(() => blinkOnce(), 140))
            else blinkOnce()
          }
          loop()
        },
        2400 + Math.random() * 3200,
      )
    }
    loop()
    const pending = timers.current
    return () => {
      alive = false
      window.clearTimeout(t)
      pending.forEach(window.clearTimeout)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className={`qz-anime ${className}`}
      data-reduce={reduceMotion ? 'true' : undefined}
      aria-hidden="true"
    >
      <div className="qz-anime-body">
        <img className="qz-anime-base" src={SRC('base')} alt="" draggable="false" />
        {Object.entries(PATCH).map(([k, p]) => (
          <img
            key={k}
            className={`qz-anime-patch qz-anime-${k}`}
            src={SRC(k)}
            alt=""
            draggable="false"
            style={p}
          />
        ))}
        <img className="qz-anime-full qz-anime-grin" src={SRC('grin')} alt="" draggable="false" />
        <img className="qz-anime-full qz-anime-cap" src={SRC('cap')} alt="" draggable="false" />
      </div>
      <span className="qz-anime-think" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  )
})

export default AnimeAvatar
