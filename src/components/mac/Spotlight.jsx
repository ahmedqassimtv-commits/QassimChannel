import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { buildSearchIndex } from './navModel.js'

/*
 * بحث بأسلوب Spotlight في macOS 26: كبسولة زجاج في نص الشاشة فوق،
 * النتايج بتفتح تحتها في نفس اللوح بنابض، والتظليل بيتزحلق بين النتايج.
 * الأسهم + Enter + Esc شغالين.
 */

const SPRING = { type: 'spring', stiffness: 460, damping: 36, mass: 0.8 }

function normalize(s = '') {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
}

export default function Spotlight({ open, onClose }) {
  const navigate = useNavigate()
  const index = useMemo(() => buildSearchIndex(), [])
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return index.filter((r) => r.group === 'الأقسام')
    return index
      .map((r) => {
        const title = normalize(r.title)
        const hay = normalize(`${r.title} ${r.sub || ''} ${r.extra || ''} ${r.group}`)
        const score = title.startsWith(q) ? 3 : title.includes(q) ? 2 : hay.includes(q) ? 1 : 0
        return { r, score }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 9)
      .map((x) => x.r)
  }, [index, query])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (!open) return undefined
    setQuery('')
    const t = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(t)
  }, [open])

  const go = (r) => {
    if (!r) return
    onClose()
    if (r.href) window.open(r.href, '_blank', 'noopener')
    else navigate(r.to)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (results.length ? (i + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(results[active])
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="spotlight"
          dir="rtl"
          className="mac-spotlight-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            className="mac-spotlight"
            role="dialog"
            aria-label="بحث"
            initial={{ opacity: 0, scale: 0.92, y: -14, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.96, y: -8, filter: 'blur(6px)', transition: { duration: 0.16 } }}
            transition={SPRING}
            layout
          >
            <div className="mac-spotlight-field">
              <Search className="mac-spotlight-icon" strokeWidth={2.2} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="دوّر في قاسمز…"
                aria-label="ابحث في الموقع"
                role="combobox"
                aria-expanded="true"
                aria-controls="mac-spotlight-list"
                aria-activedescendant={results[active] ? `mac-sr-${active}` : undefined}
              />
            </div>
            <motion.div layout className="mac-spotlight-list" id="mac-spotlight-list" role="listbox">
              {results.length === 0 ? (
                <p className="mac-spotlight-empty">مفيش نتايج لـ«{query}»</p>
              ) : (
                results.map((r, i) => {
                  const Icon = r.icon
                  const showGroup = i === 0 || results[i - 1].group !== r.group
                  return (
                    <div key={`${r.group}-${r.title}-${i}`}>
                      {showGroup && <div className="mac-spotlight-group">{r.group}</div>}
                      <button
                        type="button"
                        id={`mac-sr-${i}`}
                        role="option"
                        aria-selected={active === i}
                        className="mac-spotlight-row"
                        onPointerEnter={() => setActive(i)}
                        onClick={() => go(r)}
                      >
                        {active === i && (
                          <motion.span
                            layoutId="mac-spot-hl"
                            className="mac-spotlight-hl"
                            transition={{ type: 'spring', stiffness: 700, damping: 46 }}
                          />
                        )}
                        <span className="mac-spotlight-tile" aria-hidden="true">
                          <Icon strokeWidth={2} />
                        </span>
                        <span className="mac-spotlight-text">
                          <span className="mac-spotlight-title">{r.title}</span>
                          {r.sub && <span className="mac-spotlight-sub">{r.sub}</span>}
                        </span>
                        {active === i && <CornerDownLeft className="mac-spotlight-enter" aria-hidden="true" />}
                      </button>
                    </div>
                  )
                })
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
