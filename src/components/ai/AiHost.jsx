import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft, Send, Volume2, VolumeX, X } from 'lucide-react'
import { TalkingHead } from './talkingHead.js'
import { speak } from './speech.js'
import { GREETING, SUGGESTIONS, AI_ENDPOINT, ask, localReply } from './brain.js'
import { assetUrl } from '../../utils/assets.js'
import { SPRING } from '../motion/Motion.jsx'

/* ══ قاسم الافتراضي ═══════════════════════════════════════════════════
   لوح زجاج بيطلع من مكان اللوجو في النافبار: راس قاسم المتكلّم (WebGL)،
   ترجمة بتتكتب مع الكلام، اقتراحات، وخانة سؤال. كل رد ممكن يجي معاه
   لينك لصفحة في الموقع. مكتوب عليه بوضوح إنه نسخة بالذكاء الاصطناعي. */

const MUTE_KEY = 'qz-host-muted'

export default function AiHost({ onClose }) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const headRef = useRef(null)
  const stopRef = useRef(null)
  const inputRef = useRef(null)
  const historyRef = useRef([])
  const [glOk, setGlOk] = useState(true)
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

  // الراس
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    let head
    try {
      head = new TalkingHead(canvas, { src: assetUrl('/avatar/qassim-face.webp') })
      head.reduceMotion = reduce
      headRef.current = head
    } catch {
      setGlOk(false)
      return undefined
    }
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height * 0.42
      head.setLook(
        (e.clientX - cx) / (window.innerWidth / 2),
        (e.clientY - cy) / (window.innerHeight / 2),
      )
    }
    const ro = new ResizeObserver(() => head.resize())
    ro.observe(canvas)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      ro.disconnect()
      head.destroy()
      headRef.current = null
    }
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

  // التحية أول ما اللوح يفتح
  useEffect(() => {
    const t = window.setTimeout(() => say(GREETING), 450)
    return () => {
      window.clearTimeout(t)
      stopRef.current?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escape يقفل
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = async (text, intentId) => {
    if (busy) return
    setBusy(true)
    const r = intentId && !AI_ENDPOINT ? localReply(intentId) : await ask(text, historyRef.current)
    historyRef.current = [
      ...historyRef.current,
      { role: 'user', content: text },
      { role: 'assistant', content: r.text },
    ].slice(-12)
    setBusy(false)
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
    const next = !muted
    setMuted(next)
    try {
      localStorage.setItem(MUTE_KEY, next ? '1' : '0')
    } catch {
      /* تصفح خاص */
    }
    if (next) {
      stopRef.current?.()
      headRef.current?.setSpeaking(false)
      setShown(reply.text.split(/\s+/).length)
    }
  }

  const words = reply.text.split(/\s+/)

  return (
    <motion.div
      className="qz-host"
      role="dialog"
      aria-label="قاسم الافتراضي"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -12, filter: 'blur(10px)' }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -8, filter: 'blur(8px)' }}
      transition={SPRING}
      dir="rtl"
      data-qz-silent
    >
      <div className="qz-host-top">
        <span className="qz-host-badge">
          <i aria-hidden="true" /> نسخة افتراضية بالذكاء الاصطناعي
        </span>
        <div className="qz-host-tools">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'شغّل الصوت' : 'اقفل الصوت'}
            aria-pressed={muted}
          >
            {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
          </button>
          <button type="button" onClick={onClose} aria-label="اقفل">
            <X aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="qz-host-stage">
        {glOk ? (
          <canvas ref={canvasRef} className="qz-host-canvas" aria-hidden="true" />
        ) : (
          <img
            className="qz-host-canvas"
            src={assetUrl('/avatar/qassim-face.webp')}
            alt=""
            aria-hidden="true"
          />
        )}
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
            navigate(reply.link.to)
            onClose()
          }}
        >
          {reply.link.label}
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
          placeholder="اسألني عن حلقة، فيلم، أو مقال…"
          autoComplete="off"
        />
        <button type="submit" aria-label="ابعت" disabled={busy}>
          <Send aria-hidden="true" />
        </button>
      </form>
    </motion.div>
  )
}
