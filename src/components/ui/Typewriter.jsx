import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export default function Typewriter({ text }) {
  const reduced = useReducedMotion()
  const words = text.split(' ')
  const [count, setCount] = useState(reduced ? words.length : 0)
  useEffect(() => {
    if (reduced) { setCount(words.length); return undefined }
    setCount(0)
    const timer = window.setInterval(() => setCount(value => Math.min(value + 1, words.length)), 170)
    return () => window.clearInterval(timer)
  }, [text, reduced])
  return <span dir="rtl" aria-label={text} className="qz-typewriter"><span aria-hidden="true">{words.slice(0, count).join(' ')}</span></span>
}
