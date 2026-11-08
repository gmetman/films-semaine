'use client'
import { useProfile, PROFILES } from './ProfileContext'

const COLORS: Record<string, string> = {
  Guillaume: '#1e5bd8',
  Pascale:   '#c2185b',
  Arthur:    '#2e7d32',
  Louise:    '#f57c00',
  Manon:     '#7b1fa2',
}

export default function ProfileSelector() {
  const { selected, setSelected } = useProfile()

  return (
    <div className="profiles">
      {PROFILES.map(p => (
        <button
          key={p}
          className={`av${selected === p ? ' av-on' : ''}`}
          onClick={() => setSelected(p)}
          title={p}
          style={{ '--avc': COLORS[p] } as React.CSSProperties}
        >
          <span className="av-i">{p[0]}</span>
          <span className="av-n">{p}</span>
        </button>
      ))}
    </div>
  )
}
