'use client'
import { useState } from 'react'
import type { Cinema } from '@/lib/types'
import { CINEMAS } from '@/lib/cinemas'

// Fallback: build URL from name when allocine_url not in stored data (old records)
const CINEMA_URL: Record<string, string> = Object.fromEntries(
  CINEMAS.map(c => [c.name, `https://www.allocine.fr/seance/salle_gen_csalle=${c.id}.html`])
)

function cinemaClass(type: Cinema['type']): string {
  if (type === 'pathe') return 'c p'
  if (type === 'ugc') return 'c u'
  if (type === 'mk2') return 'c mk'
  return 'c o'
}

function CinemaGroup({ cinemas, hasAnyShowtimes, open, onToggle }: {
  cinemas: Cinema[]
  hasAnyShowtimes: boolean
  open: boolean
  onToggle: () => void
}) {
  if (cinemas.length === 0) return null
  return (
    <div className="cgrp">
      {cinemas.map((c, i) => (
        <span key={i} className="citem">
          <span
            className={`${cinemaClass(c.type)}${hasAnyShowtimes ? ' cs' : ''}`}
            onClick={() => hasAnyShowtimes ? onToggle() : undefined}
          >
            {c.name}{c.note ?? ''}{hasAnyShowtimes ? (open ? ' ▲' : ' ▼') : ''}
          </span>
          {(c.allocine_url ?? CINEMA_URL[c.name]) && (
            <a
              href={c.allocine_url ?? CINEMA_URL[c.name]}
              target="_blank"
              rel="noopener noreferrer"
              className="clink"
              title="Page AlloCiné du cinéma"
              onClick={e => e.stopPropagation()}
            >
              ↗
            </a>
          )}
        </span>
      ))}
    </div>
  )
}

export default function CinemaBadges({ cinemas }: { cinemas: Cinema[] }) {
  const [open, setOpen] = useState(false)

  const hasAnyShowtimes = cinemas.some(c => c.showtimes && Object.keys(c.showtimes).length > 0)
  const pathe = cinemas.filter(c => c.type === 'pathe')
  const ugc = cinemas.filter(c => c.type === 'ugc')
  const others = cinemas.filter(c => c.type !== 'pathe' && c.type !== 'ugc')
  const toggle = () => setOpen(o => !o)

  return (
    <div>
      <CinemaGroup cinemas={pathe} hasAnyShowtimes={hasAnyShowtimes} open={open} onToggle={toggle} />
      <CinemaGroup cinemas={ugc} hasAnyShowtimes={hasAnyShowtimes} open={open} onToggle={toggle} />
      <CinemaGroup cinemas={others} hasAnyShowtimes={hasAnyShowtimes} open={open} onToggle={toggle} />
      {open && (
        <div className="showt-all">
          {cinemas
            .filter(c => c.showtimes && Object.keys(c.showtimes).length > 0)
            .map((c, i) => (
              <div key={i} className="showt-cinema">
                <span className={cinemaClass(c.type)}>{c.name}{c.note ?? ''}</span>
                <div className="showt">
                  {Object.entries(c.showtimes!).map(([ver, times]) => (
                    <span key={ver}>
                      <span className="showt-ver">{ver} :</span>{' '}
                      {times.join(' · ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
