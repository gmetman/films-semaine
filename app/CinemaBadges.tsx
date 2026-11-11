'use client'
import { useState } from 'react'
import type { Cinema } from '@/lib/types'
import { CINEMAS } from '@/lib/cinemas'

const CINEMA_URL: Record<string, string> = Object.fromEntries(
  CINEMAS.map(c => [c.name, `https://www.allocine.fr/seance/salle_gen_csalle=${c.id}.html`])
)

function cinemaClass(type: Cinema['type']): string {
  if (type === 'pathe') return 'c p'
  if (type === 'ugc') return 'c u'
  if (type === 'mk2') return 'c mk'
  return 'c o'
}

function BadgeGroup({ cinemas }: { cinemas: Cinema[] }) {
  if (cinemas.length === 0) return null
  return (
    <div className="cgrp">
      {cinemas.map((c, i) => (
        <span key={i} className="citem">
          <span className={cinemaClass(c.type)}>
            {c.name}{c.note ?? ''}
          </span>
          {(c.allocine_url ?? CINEMA_URL[c.name]) && (
            <a
              href={c.allocine_url ?? CINEMA_URL[c.name]}
              target="_blank"
              rel="noopener noreferrer"
              className="clink"
              title="Page AlloCiné du cinéma"
              onClick={e => e.stopPropagation()}
            >↗</a>
          )}
        </span>
      ))}
    </div>
  )
}

export default function CinemaBadges({ cinemas }: { cinemas: Cinema[] }) {
  const [open, setOpen] = useState(false)

  const hasAnyShowtimes = cinemas.some(c => c.showtimes && Object.keys(c.showtimes).length > 0)
  const pathe  = cinemas.filter(c => c.type === 'pathe')
  const ugc    = cinemas.filter(c => c.type === 'ugc')
  const mk2    = cinemas.filter(c => c.type === 'mk2')
  const others = cinemas.filter(c => c.type !== 'pathe' && c.type !== 'ugc' && c.type !== 'mk2')

  return (
    <div>
      <div className="ci-top">
        <div className="ci-badges">
          <BadgeGroup cinemas={pathe} />
          <BadgeGroup cinemas={ugc} />
          <BadgeGroup cinemas={mk2} />
          <BadgeGroup cinemas={others} />
        </div>
        {hasAnyShowtimes && (
          <button className="showt-toggle" onClick={() => setOpen(o => !o)}>
            Horaires {open ? '▲' : '▼'}
          </button>
        )}
      </div>
      {open && (
        <div className="showt-all">
          {cinemas
            .filter(c => c.showtimes && Object.keys(c.showtimes).length > 0)
            .map((c, i) => {
              const versions = Object.entries(c.showtimes!)
              const multiVer = versions.length > 1
              return (
                <div key={i} className="showt-row">
                  <span className={cinemaClass(c.type)}>{c.name}{c.note ?? ''}</span>
                  <span className="showt-times">
                    {versions.map(([ver, times], vi) => (
                      <span key={ver}>
                        {vi > 0 && <span className="showt-sep"> / </span>}
                        {multiVer && <span className="showt-ver">{ver}: </span>}
                        {times.join(' · ')}
                      </span>
                    ))}
                  </span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
