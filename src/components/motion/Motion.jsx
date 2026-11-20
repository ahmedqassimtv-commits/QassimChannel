import { motion, useReducedMotion } from 'framer-motion'

/* ══ نظام الحركة ══════════════════════════════════════════════════
   قاعدة واحدة لكل الموقع (من مبادئ Apple للحركة السلسة):
   - نوابض متخامدة تماماً (bounce 0) للظهور والانتقالات — مفيش ارتداد
     في حاجة ماحدش رماها.
   - الظهور «تجسّد» مش مجرد fade: شفافية + إزاحة بسيطة + blur بيروح،
     فالعنصر بيبان كأنه مادة زجاج بتوصل.
   - مع prefers-reduced-motion كل ده بيبقى cross-fade قصير بس. */

export const EASE = [0.22, 1, 0.36, 1]
export const SPRING = { type: 'spring', bounce: 0, duration: 0.55 }
export const SPRING_SOFT = { type: 'spring', bounce: 0, duration: 0.8 }

/* ظهور عند الدخول في الشاشة */
export function Reveal({ as = 'div', delay = 0, y = 22, className = '', children, ...rest }) {
  const reduce = useReducedMotion()
  const Tag = motion[as] ?? motion.div
  return (
    <Tag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: reduce ? 0.2 : 0.85, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* مجموعة عناصر بتظهر ورا بعض (stagger) */
export function Stagger({ as = 'div', className = '', gap = 0.07, children, ...rest }) {
  const Tag = motion[as] ?? motion.div
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function StaggerItem({ as = 'div', className = '', children, ...rest }) {
  const reduce = useReducedMotion()
  const Tag = motion[as] ?? motion.div
  return (
    <Tag
      className={className}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 26, filter: 'blur(6px)' },
        show: reduce
          ? { opacity: 1, transition: { duration: 0.2 } }
          : { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE }, transitionEnd: { filter: 'none' } },
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* عنوان بيطلع كلمة كلمة من ورا قناع — الكلمات مش الحروف عشان
   الحروف العربية لازم تفضل متصلة */
export function SplitTitle({ as = 'h1', text, className = '', delay = 0, stagger = 0.06 }) {
  const reduce = useReducedMotion()
  const Tag = motion[as] ?? motion.h1
  const lines = String(text).split('\n')
  let index = 0
  return (
    <Tag className={className} aria-label={String(text).replace(/\n/g, ' ')} initial="hidden" animate="show">
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          {line.split(' ').map((word, wi) => {
            const i = index++
            return (
              <span key={wi} className="qz-word-mask">
                <motion.span
                  className="inline-block"
                  variants={{
                    hidden: reduce ? { opacity: 0 } : { y: '105%', opacity: 0 },
                    show: {
                      y: '0%',
                      opacity: 1,
                      transition: reduce
                        ? { duration: 0.2, delay }
                        : { duration: 0.95, ease: EASE, delay: delay + i * stagger },
                    },
                  }}
                >
                  {word}
                </motion.span>
                {wi < line.split(' ').length - 1 ? ' ' : ''}
              </span>
            )
          })}
        </span>
      ))}
    </Tag>
  )
}

/* انتقال الصفحات: الصفحة القديمة بتنسحب لورا (blur + تصغير بسيط) والجديدة
   بتتجسّد من تحت. المشهد الحي في الخلفية بيغيّر مزاجه في نفس اللحظة. */
export const pageVariants = {
  initial: { opacity: 0, y: 28, scale: 0.985, filter: 'blur(10px)' },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: EASE },
    /* لازم filter يرجع none بعد الدخول: أي filter (حتى blur(0px)) بيخلّي
       الصفحة «containing block» لأي عنصر position: fixed جواها، فشريط القراءة
       والنوافذ المنبثقة كانوا هيتحركوا مع الصفحة بدل ما يثبتوا على الشاشة */
    transitionEnd: { filter: 'none' },
  },
  exit: {
    opacity: 0,
    y: -14,
    scale: 0.99,
    filter: 'blur(8px)',
    transition: { duration: 0.32, ease: [0.4, 0, 1, 1] },
  },
}

export const pageVariantsReduced = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
