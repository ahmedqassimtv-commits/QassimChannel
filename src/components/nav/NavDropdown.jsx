import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft } from 'lucide-react'
import NavIcon from './NavIcon.jsx'
import RollText from './RollText.jsx'
import { SPRING } from '../motion/Motion.jsx'

/* ══ القائمة المنسدلة — iPadOS 26 Quick Actions Glass ═════════════════
   لوح زجاجي موحّد الحواف بنابض سلس من أسفل زر القسم مباشرة، بدون تقسيم
   أو حواف لامعة زائدة. */

const NavDropdown = forwardRef(function NavDropdown(
  { item, anchor, surface, onEnter, onLeave, onPick, onKeyDown },
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
      data-surface={surface}
      style={{ top: anchor.top, left: anchor.center, transformOrigin: '50% 0%' }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -6 }}
      transition={SPRING}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onKeyDown={onKeyDown}
    >
      <div className="qz-island-menu-glass">
        <div className="qz-island-menu-body">
          <p className="qz-island-menu-head">
            <span>{item.label}</span>
            {item.tag ? <span className="qz-latin">{item.tag}</span> : null}
          </p>
          {item.children.map((child, i) => (
            <motion.div
              key={child.to}
              initial={reduce ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: reduce ? 0 : 0.02 + i * 0.03 }}
            >
              <Link
                to={child.to}
                role="menuitem"
                className="qz-island-menu-item qz-roll-host"
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
      </div>
    </motion.div>
  )
})

export default NavDropdown
