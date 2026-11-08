'use client'
import { useState } from 'react'
import type { Cinema } from '@/lib/types'

function cinemaClass(type: Cinema['type']): string {
  if (type === 'pathe') return 'c p'
  if (type === 'ugc') return 'c u'
  return 'c o'
}

export default function CinemaBadges({ cinemas }: { cinemas: Cinema[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div>
      {cinemas.map((c, i) => {
        const hasShowtimes = c.showtimes && Object.keys(c.showtimes).length > 0
        const isOpen = open === c.name
        return (
          <span key={i}>
            <span
              className={`${cinemaClass(c.type)}${hasShowtimes ? ' cs' : ''}`}
              onClick={() => hasShowtimes ? setOpen(isOpen ? null : c.name) : undefined}
            >
              {c.name}{c.note ?? ''}{hasShowtimes ? (isOpen ? ' ▲' : ' ▼') : ''}
            </span>
            {isOpen && c.showtimes && (
              <div className="showt">
                {Object.entries(c.showtimes).map(([ver, times]) => (
                  <span key={ver}>
                    <span className="showt-ver">{ver} :</span>{' '}
                    {times.join(' · ')}
                  </span>
                ))}
              </div>
            )}
          </span>
        )
      })}
    </div>
  )
}
