import GlassLens from './GlassLens.jsx'
import { useSound } from '../../context/SoundContext'

export default function PlanSwitch({ value, onChange, options }) {
  const { play } = useSound()
  return <div className="qz-plan-switch" role="group" aria-label="أقسام المراجعات" dir="rtl" data-qz-silent>{options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => { play(); onChange(option.value) }}>{value === option.value && <GlassLens layoutId="plan-switch" />}<span>{option.label}</span></button>)}</div>
}
