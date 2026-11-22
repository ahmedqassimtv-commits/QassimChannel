import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

/* الأصوات اتشالت — نفس الواجهة بس من غير صوت */
const SoundContext = createContext({ muted: true, toggle: () => {}, play: () => {} })

export function SoundProvider({ children }: { children: ReactNode }) {
  return <SoundContext.Provider value={{ muted: true, toggle: () => {}, play: () => {} }}>{children}</SoundContext.Provider>
}

export const useSound = () => useContext(SoundContext)
