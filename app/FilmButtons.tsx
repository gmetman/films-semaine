'use client'
import { useProfile, type Choice } from './ProfileContext'

const WEIGHTS: Record<Choice, number> = { prefere: 3, pourquoi_pas: 1, vu: -2, no: -2 }

const ACTIONS: { choice: Choice; icon: string; label: string; color: 'g' | 'r' }[] = [
  { choice: 'prefere',      icon: '★', label: 'Préféré',   color: 'g' },
  { choice: 'pourquoi_pas', icon: '?', label: 'Oui…',      color: 'g' },
  { choice: 'vu',           icon: '✓', label: 'Vu',        color: 'r' },
  { choice: 'no',           icon: '✗', label: 'Non',       color: 'r' },
]

interface Props {
  allocineId: string
  weekDate: string
}

export default function FilmButtons({ allocineId, weekDate }: Props) {
  const { prefs, voteCounts, profileVotes, activeProfiles, setChoice } = useProfile()
  const myChoice = prefs[allocineId]
  const counts = voteCounts[allocineId] ?? {}
  const pv = profileVotes[allocineId] ?? {}

  // Score only from active profiles
  const globalScore = Array.from(activeProfiles).reduce(
    (acc, p) => acc + (pv[p] ? WEIGHTS[pv[p]!] : 0), 0,
  )
  const scoreLabel = globalScore > 0 ? `+${globalScore}` : `${globalScore}`
  const scoreClass = globalScore > 0 ? 'pos' : globalScore < 0 ? 'neg' : 'zero'

  // Dynamic range: max absolute score across all films, filtered by active profiles
  const maxAbs = Math.max(1, ...Object.values(profileVotes).map(fv =>
    Math.abs(Array.from(activeProfiles).reduce((a, p) => a + (fv?.[p] ? WEIGHTS[fv[p]!] : 0), 0))
  ))
  const pct = globalScore === 0 ? 0 : Math.min(Math.abs(globalScore) / maxAbs, 1) * 50

  return (
    <div className="btns" data-neg={globalScore <= 0 ? 'true' : undefined}>
      <div className={`fam-score-num ${scoreClass}`}>{scoreLabel}</div>
      <div className="fam-bar-wrap">
        <div className="fam-bar-center" />
        {globalScore > 0 && <div className="fam-bar-fill fam-pos" style={{ width: `${pct}%` }} />}
        {globalScore < 0 && <div className="fam-bar-fill fam-neg" style={{ width: `${pct}%` }} />}
      </div>
      <div className="btn-grid">
        {ACTIONS.map(({ choice, icon, label, color }) => (
          <button
            key={choice}
            title={choice === 'prefere' ? 'Préféré (+3)' : choice === 'pourquoi_pas' ? 'Oui… / Pourquoi pas (+1)' : choice === 'vu' ? 'Déjà vu (-2)' : 'Pas intéressé (-2)'}
            className={`vote-btn b${color}${myChoice === choice ? ' bon' : ''}`}
            onClick={() => setChoice(allocineId, weekDate, myChoice === choice ? null : choice)}
          >
            {icon} {label} <span className="vcount">{counts[choice] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
