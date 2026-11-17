import { useEffect, useRef } from 'react'
import { mount } from '../../lib/toggleDaylight'
import { toggleTheme, useTheme } from '../../utils/theme.js'
import { useSound } from '../../context/SoundContext'

export default function ToggleDaylight() {
  const ref = useRef(null)
  const theme = useTheme()
  const { play } = useSound()
  useEffect(() => ref.current ? mount(ref.current) : undefined, [])
  return <button className="qz-daylight" type="button" onClick={() => { toggleTheme(); play() }} aria-label={theme === 'red' ? 'تفعيل السيم الأخضر' : 'تفعيل السيم الأحمر'} title="تبديل السيم"><span ref={ref} aria-hidden="true" /><span>{theme === 'red' ? 'أحمر' : 'أخضر'}</span></button>
}
