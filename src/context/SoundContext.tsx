import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { clickSoftSound } from '../lib/click-soft'
import { setUiMuted } from '../utils/glassSound.js'

const SoundContext = createContext({ muted: false, toggle: () => {}, play: () => {} })

// ✅ أداء: كان بيستخدم use-sound + howler (~40KB) في الحزمة الأولى عشان صوت نقرة واحد.
// دلوقتي عنصر <audio> عادي بيتعمل أول مرة الصوت يشتغل بس.
export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('qassimz:muted') === 'true' } catch { return false }
  })
  const clickRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setUiMuted(muted)
    try { localStorage.setItem('qassimz:muted', String(muted)) } catch {}
  }, [muted])

  const play = useCallback(() => {
    if (muted || typeof Audio === 'undefined') return
    if (!clickRef.current) clickRef.current = new Audio(clickSoftSound.dataUri)
    const node = clickRef.current.cloneNode() as HTMLAudioElement
    node.volume = 0.2
    // نفس إحساس howler: تغيير السرعة بيغير طبقة الصوت شوية في كل نقرة
    ;(node as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false
    node.playbackRate = 0.9 + Math.random() * 0.25
    node.play().catch(() => {})
  }, [muted])

  const toggle = useCallback(() => setMuted((value) => !value), [])
  const value = useMemo(() => ({ muted, toggle, play }), [muted, toggle, play])

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export const useSound = () => useContext(SoundContext)
