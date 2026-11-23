import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronLeft } from 'lucide-react'

/*
 * قائمة منسدلة بمادة macOS 26 (Figma: macOS 26 › Menus › Menu):
 * زوايا 13px، padding 5/12، صفوف 24px (هنا 28 للعربي)، فواصل hairline،
 * عناوين صغيرة bold، اختصارات باهتة، وتظليل الصف بلون التمييز.
 * الحركة: بتطلع من تحت عنصرها بنابض (scale + blur) والتظليل بيتزحلق بين الصفوف.
 */

export const MENU_SPRING = { type: 'spring', stiffness: 520, damping: 38, mass: 0.7 }
const HIGHLIGHT_SPRING = { type: 'spring', stiffness: 700, damping: 46, mass: 0.6 }

function Row({ item, index, active, menuId, onHover, onPick }) {
  const Icon = item.icon
  const isActive = active === index
  return (
    <motion.button
      type="button"
      role="menuitem"
      data-index={index}
      disabled={item.disabled}
      className="mac-menu-row"
      data-active={isActive ? 'true' : undefined}
      onPointerEnter={() => onHover(index)}
      onFocus={() => onHover(index)}
      onClick={() => onPick(item)}
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.012 }}
    >
      {isActive && (
        <motion.span layoutId={`mac-menu-hl-${menuId}`} className="mac-menu-hl" transition={HIGHLIGHT_SPRING} aria-hidden="true" />
      )}
      <span className="mac-menu-sym" aria-hidden="true">
        {item.checked ? <Check strokeWidth={2.6} /> : Icon ? <Icon strokeWidth={2} /> : null}
      </span>
      <span className="mac-menu-label">{item.label}</span>
      {item.kbd || item.shortcut ? (
        <kbd className="mac-menu-kbd" dir="ltr">
          {item.kbd || `⌥${item.shortcut}`}
        </kbd>
      ) : item.hint ? (
        <span className="mac-menu-hint">{item.hint}</span>
      ) : item.submenu ? (
        <ChevronLeft className="mac-menu-chev" strokeWidth={2.6} aria-hidden="true" />
      ) : null}
    </motion.button>
  )
}

const MacMenu = forwardRef(function MacMenu({ menu, active, onHover, onPick, style, className = '' }, ref) {
  let index = -1
  return (
    <motion.div
      ref={ref}
      role="menu"
      aria-label={menu.label}
      className={`mac-menu ${className}`}
      style={style}
      initial={{ opacity: 0, scale: 0.94, y: -6, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.97, y: -4, filter: 'blur(4px)', transition: { duration: 0.14 } }}
      transition={MENU_SPRING}
      onPointerLeave={() => onHover(-1)}
    >
      {menu.items.map((item, i) => {
        if (item.type === 'sep') return <div key={`s${i}`} className="mac-menu-sep" role="separator" />
        if (item.type === 'header')
          return (
            <div key={`h${i}`} className="mac-menu-header">
              {item.label}
            </div>
          )
        index += 1
        return (
          <Row
            key={`${item.label}-${i}`}
            item={item}
            index={index}
            active={active}
            menuId={menu.id}
            onHover={onHover}
            onPick={onPick}
          />
        )
      })}
    </motion.div>
  )
})

export default MacMenu

export function actionableItems(menu) {
  return menu.items.filter((it) => it.type !== 'sep' && it.type !== 'header')
}
