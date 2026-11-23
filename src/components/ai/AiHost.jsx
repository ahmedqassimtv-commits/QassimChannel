import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft, Send, Volume2, VolumeX, X } from 'lucide-react'
import Avatar3D from './Avatar3D.jsx'
import { speak } from './speech.js'
import { AI_ENDPOINT, ask, GREETING, localReply, SUGGESTIONS } from './brain.js'
import { SPRING } from '../motion/Motion.jsx'
import { playGlassTap } from '../../utils/glassSound.js'

/* ══ قاسم الافتراضي — AiHost ══════════════════════════════════════════
   لوح تفاعلي منسدل مباشرة تحت أيقونة قاسم في النافبار:
   - يتكيّف شكله ومادته وألوانه مع القسم الحالي (الحكايات / المقالات /
     قاع الأفكار / الفِردِكت / عن أحمد / الزجاج السائل).
   - نموذج ثلاثي الأبعاد (مع بديل أنمي سلس) يتتبع المؤشر ويتكلم ويلوّح. */

const MUTE_KEY = 'qz-host-muted'

export default function AiHost({
  anchor,
  navTheme = 'glass',
  navTone = 'dark',
  onClose,
  panelRef,
}) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const stageRef = useRef(null)
  const headRef = useRef(null)
  const stopRef = useRef(null)
  const inputRef = useRef(null)
  const historyRef = useRef([])
  const [reply, setReply] = useState(GREETING)
  const [shown, setShown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === '1'
    } catch {
      return false
    }
  })

  // تتبّع هادئ للمؤشر متزامن مع حركة النموذج
  useEffect(() => {
    if (reduce) return undefined
    const onMove = (e) => {
      const stage = stageRef.current
      if (!stage) return
      const r = stage.getBoundingClientRect()
      headRef.current?.setLook(
        (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2),
        (e.clientY - (r.top + r.height * 0.4)) / (window.innerHeight / 2),
      )
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduce])

  const say = useCallback(
    (r) => {
      stopRef.current?.()
      setReply(r)
      const words = r.text.split(/\s+/)
      setShown(reduce ? words.length : 0)
      stopRef.current = speak(r.text, {
        muted,
        onStart: () => headRef.current?.setSpeaking(true),
        onWord: (i) => {
          headRef.current?.pulse()
          setShown((s) => Math.max(s, i + 1))
        },
        onEnd: () => {
          headRef.current?.setSpeaking(false)
          setShown(words.length)
        },
      })
    },
    [muted, reduce],
  )

  // تلويحة الترحيب أول ما يفتح اللوح
  useEffect(() => {
    const t0 = window.setTimeout(() => headRef.current?.setMood('excited'), 240)
    const t = window.setTimeout(() => {
      headRef.current?.setMood('idle')
      say(GREETING)
    }, 1450)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t)
      stopRef.current?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = async (text, intentId) => {
    if (busy) return
    playGlassTap()
    setBusy(true)
    stopRef.current?.()
    headRef.current?.setSpeaking(false)
    headRef.current?.setMood('thinking')
    const r = intentId && !AI_ENDPOINT ? localReply(intentId) : await ask(text, historyRef.current)
    historyRef.current = [
      ...historyRef.current,
      { role: 'user', content: text },
      { role: 'assistant', content: r.text },
    ].slice(-12)
    setBusy(false)
    headRef.current?.setMood('idle')
    say(r)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const text = inputRef.current?.value.trim()
    if (!text) return
    inputRef.current.value = ''
    run(text)
  }

  const toggleMute = () => {
    playGlassTap()
    const next = !muted
    setMuted(next)
    try {
      localStorage.setItem(MUTE_KEY, next ? '1' : '0')
    } catch {
      /* وضع التصفح الخاص */
    }
    if (next) {
      stopRef.current?.()
      headRef.current?.setSpeaking(false)
      setShown(reply.text.split(/\s+/).length)
    }
  }

  const words = reply.text.split(/\s+/)
  const panelStyle = anchor
    ? {
        top: anchor.top,
        left: anchor.left,
        transformOrigin: `${anchor.originX}px 0px`,
      }
    : undefined

  return (
    <motion.div
      ref={panelRef}
      className="qz-host"
      role="dialog"
      aria-label="قاسم الافتراضي"
      data-nav-theme={navTheme}
      data-nav-tone={navTone}
      style={panelStyle}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -10, filter: 'blur(8px)' }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8, filter: 'blur(6px)' }}
      transition={SPRING}
      dir="rtl"
      data-qz-silent
    >
      <div className="qz-host-top">
        <span className="qz-host-badge">
          <i aria-hidden="true" /> قاسم الافتراضي · AI
        </span>
        <div className="qz-host-tools">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'شغّل الصوت' : 'اكتم الصوت'}
            aria-pressed={muted}
          >
            {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
          </button>
          <button type="button" onClick={onClose} aria-label="إغلاق قاسم الافتراضي">
            <X aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="qz-host-stage" ref={stageRef}>
        <Avatar3D ref={headRef} reduceMotion={reduce} />
      </div>

      <p className="qz-host-sub" aria-live="polite">
        <span className="sr-only">{reply.text}</span>
        <span aria-hidden="true">
          {words.map((w, i) => (
            <span
              key={`${reply.text.length}-${i}`}
              className="qz-host-w"
              data-on={i < shown ? 'true' : undefined}
            >
              {w}{' '}
            </span>
          ))}
        </span>
      </p>

      {reply.link && (
        <button
          type="button"
          className="qz-host-link"
          onClick={() => {
            playGlassTap()
            navigate(reply.link.to)
            onClose()
          }}
        >
          <span>{reply.link.label}</span>
          <ArrowUpLeft aria-hidden="true" />
        </button>
      )}

      <div className="qz-host-chips">
        {SUGGESTIONS.map((s) => (
          <button key={s.id} type="button" disabled={busy} onClick={() => run(s.label, s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <form className="qz-host-form" onSubmit={onSubmit}>
        <label htmlFor="qz-host-input" className="sr-only">
          اسأل قاسم
        </label>
        <input
          id="qz-host-input"
          ref={inputRef}
          type="text"
          placeholder="اسألني عن حلقة، حُكم، حكاية، أو عن أحمد…"
          autoComplete="off"
        />
        <button type="submit" aria-label="إرسال" disabled={busy}>
          <Send aria-hidden="true" />
        </button>
      </form>
    </motion.div>
  )
}
