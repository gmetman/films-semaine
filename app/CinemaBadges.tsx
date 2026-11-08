'use client'
import { useState } from 'react'
import type { Cinema } from '@/lib/types'

function cinemaClass(type: Cinema['type']): string {
  if (type === 'pathe') return 'c p'
  if (type === 'ugc') return 'c u'
  return 'c o'
}

function CinemaGroup({ cinemas, open, setOpen }: {
  cinemas: Cinema[]
  open: string | null
  setOpen: (name: string | null) => void
}) {
  if (cinemas.length === 0) return null
  return (
    <div className="cgrp">
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

export default function CinemaBadges({ cinemas }: { cinemas: Cinema[] }) {
  const [open, setOpen] = useState<string | null>(null)

  const pathe = cinemas.filter(c => c.type === 'pathe')
  const ugc = cinemas.filter(c => c.type === 'ugc')
  const others = cinemas.filter(c => c.type !== 'pathe' && c.type !== 'ugc')

  return (
    <div>
      <CinemaGroup cinemas={pathe} open={open} setOpen={setOpen} />
      <CinemaGroup cinemas={ugc} open={open} setOpen={setOpen} />
      <CinemaGroup cinemas={others} open={open} setOpen={setOpen} />
    </div>
  )
}
