'use client'
import { useProfile, type Choice } from './ProfileContext'

const WEIGHTS: Record<Choice, number> = { prefere: 3, pourquoi_pas: 1, vu: -2, no: -2 }

const ACTIONS: { choice: Choice; icon: string; label: string; color: 'g' | 'r' }[] = [
  { choice: 'prefere',      icon: '★', label: 'Préféré',       color: 'g' },
  { choice: 'pourquoi_pas', icon: '?', label: 'Pourquoi pas',  color: 'g' },
  { choice: 'vu',           icon: '✓', label: 'Déjà vu',       color: 'r' },
  { choice: 'no',           icon: '✗', label: 'Pas intéressé', color: 'r' },
]

interface Props {
  allocineId: string
  weekDate: string
}

export default function FilmButtons({ allocineId, weekDate }: Props) {
  const { prefs, voteCounts, setChoice } = useProfile()
  const myChoice = prefs[allocineId]
  const counts = voteCounts[allocineId] ?? {}

  const globalScore = Object.entries(counts).reduce(
    (acc, [c, n]) => acc + (WEIGHTS[c as Choice] ?? 0) * (n ?? 0), 0,
  )
  const scoreLabel = globalScore > 0 ? `+${globalScore}` : `${globalScore}`
  const scoreClass = globalScore > 0 ? 'pos' : globalScore < 0 ? 'neg' : 'zero'

  return (
    <div className="btns">
      <div className="btn-grid">
        {ACTIONS.map(({ choice, icon, label, color }) => (
          <button
            key={choice}
            className={`b${color}${myChoice === choice ? ' bon' : ''}`}
            onClick={() => setChoice(allocineId, weekDate, myChoice === choice ? null : choice)}
          >
            {icon} {label} · {counts[choice] ?? 0}
          </button>
        ))}
      </div>
      <div className={`gscore ${scoreClass}`}>{scoreLabel}</div>
    </div>
  )
}
