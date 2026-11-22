import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LogoIntro from './LogoIntro.jsx'
import { assetUrl } from '../../utils/assets.js'
import './ai.css'

/* ══ مكان اللوجو في النافبار: اللوجو حرف حرف ← قاسم الافتراضي ═══════════
   مع كل فتحة للموقع لوجو قاسمز بيتكتب حرف حرف، وبعد ما يخلص قاسم
   الافتراضي بيطلع مكانه بحركة. الضغط عليه بيفتح اللوح (AiHost). */

const AiHost = lazy(() => import('./AiHost.jsx'))
const HELLO_SEEN = 'qz-host-seen'

export default function NavHost({ onHome }) {
  const [arrived, setArrived] = useState(false)
  const [hello, setHello] = useState(false)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const slotRef = useRef(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setArrived(true)
      let seen = false
      try {
        seen = sessionStorage.getItem(HELLO_SEEN) === '1'
        sessionStorage.setItem(HELLO_SEEN, '1')
      } catch {
        /* تصفح خاص */
      }
      if (!seen) setHello(true)
    }, 2900)
    return () => window.clearTimeout(t)
  }, [])
  // الفقاعة fixed تحت الوش (علشان غلاف اللوجو في النافبار بيقص أي حاجة برّاه)
  useEffect(() => {
    if (!hello) return undefined
    const r = slotRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 14, right: Math.max(12, window.innerWidth - r.right) })
    const t = window.setTimeout(() => setHello(false), 5200)
    return () => window.clearTimeout(t)
  }, [hello])

  return (
    <>
      <span ref={slotRef} className="qz-island-brand-slot">
        <AnimatePresence mode="popLayout" initial={false}>
          {!arrived ? (
            <motion.button
              key="logo"
              type="button"
              onClick={onHome}
              aria-label="قاسمز - الرئيسية"
              className="flex shrink-0 cursor-pointer items-center rounded-full px-2 py-1 sm:px-2.5"
              exit={{ opacity: 0, scale: 0.6, y: -6, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            >
              <LogoIntro className="h-7 sm:h-8" />
            </motion.button>
          ) : (
            <motion.button
              key="host"
              type="button"
              className="qz-host-bubble"
              initial={{ opacity: 0, scale: 0.2, rotate: -30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 17, delay: 0.12 }}
              onClick={() => {
                setHello(false)
                setOpen((v) => !v)
              }}
              aria-expanded={open}
              aria-label="كلّم قاسم الافتراضي"
              data-open={open ? 'true' : undefined}
            >
              <img src={assetUrl('/avatar/anime/bubble.webp')} alt="" />
              <img
                className="qz-host-bubble-grin"
                src={assetUrl('/avatar/anime/bubble-grin.webp')}
                alt=""
              />
              <span className="qz-host-bubble-ring" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>
      </span>
      {/* برّه النافبار (portal): الكبسولة عليها transform و overflow hidden
          فأي fixed جوّاها كان بيتقص ويتحرك معاها */}
      {createPortal(
        <div dir="rtl">
          <AnimatePresence>
            {hello && pos && !open && (
              <motion.span
                className="qz-host-hello"
                style={
                  pos
                    ? {
                        position: 'fixed',
                        top: pos.top,
                        right: pos.right,
                        left: 'auto',
                        zIndex: 80,
                      }
                    : undefined
                }
                initial={{ opacity: 0, y: -6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                aria-hidden="true"
              >
                أهلاً! دوس عليّا نتكلم
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {open && (
              <Suspense key="host" fallback={null}>
                <AiHost onClose={() => setOpen(false)} />
              </Suspense>
            )}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </>
  )
}
