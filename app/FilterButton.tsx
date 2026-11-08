'use client'
import { useProfile } from './ProfileContext'

export default function FilterButton() {
  const { filterNegative, setFilterNegative } = useProfile()
  return (
    <button
      className={`filter-btn${filterNegative ? ' active' : ''}`}
      onClick={() => setFilterNegative(!filterNegative)}
      title={filterNegative ? 'Afficher tous les films' : 'Masquer les films avec score famille ≤ 0'}
      aria-pressed={filterNegative}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M1.5 2h13l-5 6.5V14l-3-1.5V8.5L1.5 2Z"/>
      </svg>
    </button>
  )
}
