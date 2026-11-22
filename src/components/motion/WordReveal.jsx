import { Fragment } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { entrySprings } from '../../lib/motionTokens.js'

/* كلمة كلمة بتطلع من تحت (من غير تقسيم حروف — العربي لازم يفضل متصل).
   start/total: مكان الكلمات في العنوان كله، علشان تدريج الثيم (.qz-split)
   يكمّل من كلمة للتانية. */
export default function WordReveal({ text, delay = 0, stagger = 0.07, start = 0, total }) {
  const reduce = useReducedMotion()
  const words = String(text).split(' ')
  const n = total ?? start + words.length
  return (
    <>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => {
        const k = start + i
        return (
          <Fragment key={i}>
            <span className="qz-word-mask" aria-hidden="true">
              <motion.span
                className="qz-w inline-block"
                style={{ '--gx': n > 1 ? 1 - k / (n - 1) : 1, '--gn': n }}
                initial={reduce ? { opacity: 0 } : { y: '105%', opacity: 0 }}
                whileInView={{ y: '0%', opacity: 1 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={
                  reduce
                    ? { duration: 0.2 }
                    : { ...entrySprings.editorial, delay: delay + i * stagger }
                }
              >
                {w}
              </motion.span>
            </span>
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        )
      })}
    </>
  )
}
