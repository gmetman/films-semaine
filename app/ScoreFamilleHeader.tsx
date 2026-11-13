'use client'
import { PROFILES, type Profile, useProfile } from './ProfileContext'
import FilterButton from './FilterButton'

const PROFILE_COLORS: Record<Profile, string> = {
  Guillaume: '#1e5bd8',
  Pascale:   '#c2185b',
  Arthur:    '#2e7d32',
  Louise:    '#f57c00',
  Manon:     '#7b1fa2',
}

const PROFILE_INITIALS: Record<Profile, string> = {
  Guillaume: 'G',
  Pascale:   'P',
  Arthur:    'A',
  Louise:    'L',
  Manon:     'M',
}

export default function ScoreFamilleHeader() {
  const { activeProfiles, toggleProfile } = useProfile()

  return (
    <div className="sf-header">
      <span>Score famille</span>
      <div className="sf-profiles">
        {PROFILES.map(p => {
          const on = activeProfiles.has(p)
          return (
            <button
              key={p}
              title={p}
              className={`sf-pill${on ? ' sf-on' : ''}`}
              style={on ? { background: PROFILE_COLORS[p], borderColor: PROFILE_COLORS[p] } : { borderColor: PROFILE_COLORS[p], color: PROFILE_COLORS[p] }}
              onClick={() => toggleProfile(p)}
            >
              {PROFILE_INITIALS[p]}
            </button>
          )
        })}
      </div>
      <FilterButton />
    </div>
  )
}
