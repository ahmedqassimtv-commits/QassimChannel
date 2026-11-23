import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Radio, Search } from 'lucide-react'
import { THEMES, setTheme, useTheme } from '../../utils/theme.js'
import { THEME_META } from './navModel.js'
import { MENU_SPRING } from './MacMenu.jsx'

/*
 * مركز التحكم (macOS 26): لوح زجاج بموديولات مدورة.
 * المظهر = الثيمات الأربعة، وبلاطات سريعة لقاسم الافتراضي والبحث وأون إير.
 */

export default function ControlCenter({ style, onClose, onSpotlight, onHost, panelRef }) {
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <motion.div
      ref={panelRef}
      className="mac-cc"
      role="dialog"
      aria-label="مركز التحكم"
      style={style}
      initial={{ opacity: 0, scale: 0.92, y: -8, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.96, y: -6, filter: 'blur(4px)', transition: { duration: 0.14 } }}
      transition={MENU_SPRING}
    >
      <section className="mac-cc-module mac-cc-wide">
        <h3 className="mac-cc-title">المظهر</h3>
        <div className="mac-cc-themes" role="radiogroup" aria-label="الثيم">
          {THEMES.map((t) => {
            const meta = THEME_META[t]
            const on = theme === t
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={on}
                className="mac-cc-theme"
                data-on={on ? 'true' : undefined}
                onClick={() => setTheme(t)}
              >
                <span
                  className="mac-cc-swatch"
                  style={{ background: `linear-gradient(140deg, ${meta.swatch[0]} 0%, ${meta.swatch[1]} 60%, ${meta.swatch[2]} 100%)` }}
                  aria-hidden="true"
                >
                  {on && <motion.span layoutId="mac-cc-ring" className="mac-cc-ring" transition={{ type: 'spring', stiffness: 520, damping: 34 }} />}
                </span>
                <span>{meta.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <button
        type="button"
        className="mac-cc-module mac-cc-tile"
        onClick={() => {
          onClose()
          onHost()
        }}
      >
        <span className="mac-cc-round" data-accent="true" aria-hidden="true">
          <MessageCircle strokeWidth={2.2} />
        </span>
        <span className="mac-cc-tile-text">
          <strong>قاسم الافتراضي</strong>
          <small>كلّمه</small>
        </span>
      </button>

      <button
        type="button"
        className="mac-cc-module mac-cc-tile"
        onClick={() => {
          onClose()
          onSpotlight()
        }}
      >
        <span className="mac-cc-round" aria-hidden="true">
          <Search strokeWidth={2.2} />
        </span>
        <span className="mac-cc-tile-text">
          <strong>بحث</strong>
          <small dir="ltr">⌘K</small>
        </span>
      </button>

      <button
        type="button"
        className="mac-cc-module mac-cc-wide mac-cc-tile"
        onClick={() => {
          onClose()
          navigate('/on-air')
        }}
      >
        <span className="mac-cc-round mac-cc-live" aria-hidden="true">
          <Radio strokeWidth={2.2} />
        </span>
        <span className="mac-cc-tile-text">
          <strong>أون إير</strong>
          <small>آخر حضور لقاسم على السوشيال</small>
        </span>
        <span className="mac-cc-dot" aria-hidden="true" />
      </button>
    </motion.div>
  )
}
