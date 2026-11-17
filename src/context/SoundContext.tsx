import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import useSoundEffect from 'use-sound'
import { clickSoftSound } from '../lib/click-soft'
import { setUiMuted } from '../utils/glassSound.js'

const SoundContext = createContext({ muted: false, toggle: () => {}, play: () => {} })

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('qassimz:muted') === 'true' } catch { return false }
  })
  const [playClick] = useSoundEffect(clickSoftSound.dataUri, { volume: 0.2, soundEnabled: !muted })
  useEffect(() => {
    setUiMuted(muted)
    try { localStorage.setItem('qassimz:muted', String(muted)) } catch {}
  }, [muted])
  const play = useCallback(() => {
    if (!muted) playClick({ playbackRate: 0.9 + Math.random() * 0.25 })
  }, [muted, playClick])
  return <SoundContext.Provider value={{ muted, toggle: () => setMuted(value => !value), play }}>{children}</SoundContext.Provider>
}

export const useSound = () => useContext(SoundContext)
