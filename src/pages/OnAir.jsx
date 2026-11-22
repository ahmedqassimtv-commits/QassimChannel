import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'

export default function OnAir() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <header className="liquid-glass rounded-3xl p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl border border-emerald-400/30 bg-[color:var(--qz-ink)] text-emerald-300">
              <Radio className="size-4" />
            </span>
            <span className="flex items-center gap-2 font-mono text-xs font-bold tracking-[0.2em] text-emerald-300">
              <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
              ON AIR • البث الاجتماعي الحيّ
            </span>
          </div>

        </div>

        <h1 className="thmanyah-swash mt-4 text-4xl font-black text-[color:var(--qz-mint)] sm:text-5xl">
          أون إير
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--qz-sage)] sm:text-base">
          مساحة متجددة تجمع منشورات قاسم اليومية، مقتطفاته السريعة، وتحديثاته عبر منصات التواصل الاجتماعي في مكان واحد.
        </p>
      </header>
    </motion.div>
  )
}