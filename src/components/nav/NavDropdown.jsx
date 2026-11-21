import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft } from 'lucide-react'
import { LiquidGlass } from '../glass/LiquidGlass.tsx'
import NavIcon from './NavIcon.jsx'
import RollText from './RollText.jsx'
import { prefetchRoute } from '../../utils/liquidGlassEngine.js'
import { SPRING } from '../motion/Motion.jsx'

/* ══ القائمة المنسدلة (الفِردِكت / مساحة) ══════════════════════════════
   لوح زجاج بيكبر من تحت الزرار نفسه بحركة spring. كل عنصر برقم
   (01، 02…) وأيقونة متحركة وعنوان بيلفّ لفوق، والعناصر بتظهر ورا بعض. */

const NavDropdown = forwardRef(function NavDropdown(
  { item, anchor, onEnter, onLeave, onPick, onKeyDown },
  ref,
) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      id={`qz-menu-${item.key}`}
      role="menu"
      aria-label={item.label}
      className="qz-island-menu"
      style={{ top: anchor.top, left: anchor.center, transformOrigin: '50% 0%' }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -8, filter: 'blur(8px)' }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6, filter: 'blur(6px)' }}
      transition={SPRING}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onKeyDown={onKeyDown}
    >
      <LiquidGlass
        appearance="dark"
        material="regular"
        refraction={16}
        fallbackBlur={24}
        className="qz-island-menu-glass"
      >
        <div className="qz-island-menu-body">
          <p className="qz-island-menu-head">
            <span>{item.label}</span>
            {item.tag ? <span className="qz-latin">{item.tag}</span> : null}
          </p>
          {item.children.map((child, i) => (
            <motion.div
              key={child.to}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: reduce ? 0 : 0.05 + i * 0.045 }}
            >
              <Link
                to={child.to}
                role="menuitem"
                className="qz-island-menu-item qz-roll-host"
                onMouseEnter={() => prefetchRoute(child.to)}
                onClick={onPick}
              >
                <span className="qz-island-menu-num qz-latin">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <NavIcon icon={child.icon} motion={child.motion} className="qz-island-menu-icon" />
                <span className="qz-island-menu-text">
                  <RollText className="qz-island-menu-title">{child.label}</RollText>
                  <span className="qz-island-menu-sub">{child.sub}</span>
                </span>
                <ArrowUpLeft className="qz-island-menu-arrow" aria-hidden="true" />
              </Link>
            </motion.div>
          ))}
        </div>
      </LiquidGlass>
    </motion.div>
  )
})

export default NavDropdown
