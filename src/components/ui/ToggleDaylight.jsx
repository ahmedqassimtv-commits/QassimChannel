import { useEffect, useRef } from 'react'
import { mount } from '../../lib/toggleDaylight'
import { toggleTheme, useTheme } from '../../utils/theme.js'

export default function ToggleDaylight() {
  const ref = useRef(null)
  const theme = useTheme()
  useEffect(() => ref.current ? mount(ref.current) : undefined, [])
  return <button className="qz-daylight" type="button" onClick={() => { toggleTheme() }} aria-label={theme === 'red' ? 'تفعيل السيم الأخضر' : 'تفعيل السيم الأحمر'} title="تبديل السيم"><span ref={ref} aria-hidden="true" /><span>{theme === 'red' ? 'أحمر' : 'أخضر'}</span></button>
}
