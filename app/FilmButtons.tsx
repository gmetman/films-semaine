'use client'
import { useProfile, type Choice } from './ProfileContext'

const WEIGHTS: Record<Choice, number> = { prefere: 3, pourquoi_pas: 1, vu: -2, no: -2 }

const ACTIONS: { choice: Choice; label: string; activeLabel: string; color: 'g' | 'r' }[] = [
  { choice: 'prefere',      label: '★ Préféré',       activeLabel: '★ Préféré',       color: 'g' },
  { choice: 'pourquoi_pas', label: '? Pourquoi pas',  activeLabel: '? Pourquoi pas',  color: 'g' },
  { choice: 'vu',           label: '✓ Déjà vu',       activeLabel: '✓ Déjà vu',       color: 'r' },
  { choice: 'no',           label: '✗ Pas intéressé', activeLabel: '✗ Pas intéressé', color: 'r' },
]

interface Props {
  allocineId: string
  weekDate: string
}

export default function FilmButtons({ allocineId, weekDate }: Props) {
  const { prefs, voteCounts, setChoice } = useProfile()
  const myChoice = prefs[allocineId]
  const counts = voteCounts[allocineId] ?? {}

  const globalScore = Object.entries(counts).reduce((acc, [c, n]) => {
    return acc + (WEIGHTS[c as Choice] ?? 0) * (n ?? 0)
  }, 0)

  const scoreLabel = globalScore === 0 ? '0'
    : globalScore > 0 ? `+${globalScore}`
    : `${globalScore}`
  const scoreClass = globalScore > 0 ? 'pos' : globalScore < 0 ? 'neg' : 'zero'

  return (
    <div className="btns">
      {ACTIONS.map(({ choice, label, color }) => {
        const isActive = myChoice === choice
        const count = counts[choice] ?? 0
        return (
          <div key={choice} className="bcell">
            <button
              className={`b${color}${isActive ? ' bon' : ''}`}
              onClick={() => setChoice(allocineId, weekDate, isActive ? null : choice)}
            >
              {label}
            </button>
            <span className="vcnt">{count}</span>
          </div>
        )
      })}
      <div className={`gscore ${scoreClass}`}>Score : {scoreLabel}</div>
    </div>
  )
}
