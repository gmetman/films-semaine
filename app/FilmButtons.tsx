'use client'
import { useProfile, type Choice } from './ProfileContext'

const WEIGHTS: Record<Choice, number> = { prefere: 3, pourquoi_pas: 1, vu: -2, no: -2 }

const ACTIONS: { choice: Choice; icon: string; title: string; color: 'g' | 'r' }[] = [
  { choice: 'prefere',      icon: '★', title: 'Préféré',       color: 'g' },
  { choice: 'pourquoi_pas', icon: '?', title: 'Pourquoi pas',  color: 'g' },
  { choice: 'vu',           icon: '✓', title: 'Déjà vu',       color: 'r' },
  { choice: 'no',           icon: '✗', title: 'Pas intéressé', color: 'r' },
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
      {ACTIONS.map(({ choice, icon, title, color }) => (
        <button
          key={choice}
          className={`b${color}${myChoice === choice ? ' bon' : ''}`}
          title={title}
          onClick={() => setChoice(allocineId, weekDate, myChoice === choice ? null : choice)}
        >
          {icon} {counts[choice] ?? 0}
        </button>
      ))}
      <span className={`gscore ${scoreClass}`}>{scoreLabel}</span>
    </div>
  )
}
