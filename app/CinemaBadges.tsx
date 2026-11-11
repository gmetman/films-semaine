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

// Strip chain prefix from cinema name
function displayName(name: string, type: Cinema['type']): string {
  if (type === 'ugc')   return name.replace(/^UGC\s+/i, '')
  if (type === 'pathe') return name.replace(/^Path[eé]\s+/i, '')
  if (type === 'mk2')   return name.replace(/^MK2\s+/i, '')
  return name
}

// Inline SVG logos — paths only, no font dependency
function PatheIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 3, flexShrink: 0 }}>
      {/* Stylized P: stem + rounded bowl */}
      <rect x="2" y="2" width="3" height="12" rx="1" fill="#1c1c1a"/>
      <path d="M5 2 C5 2 13 2 13 6.5 C13 11 5 10 5 10 Z" fill="#1c1c1a"/>
    </svg>
  )
}

function UgcIcon() {
  return (
    <svg viewBox="0 0 32 16" width="28" height="13" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 3, flexShrink: 0 }}>
      {/* U */}
      <path d="M2 2 L2 10 Q2 14 5.5 14 Q9 14 9 10 L9 2" stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* G */}
      <path d="M21 4 Q16 1 13 8 Q11 15 17 14 L17 10 L14.5 10" stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* C */}
      <path d="M31 4 Q28 1 25 8 Q23 15 27 14" stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Mk2Icon() {
  return (
    <svg viewBox="0 0 30 16" width="26" height="13" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 3, flexShrink: 0 }}>
      {/* m */}
      <path d="M2 6 L2 14 M2 10 Q2 6 5.5 6 Q7.5 6 7.5 10 L7.5 14 M7.5 10 Q7.5 6 11 6 Q13 6 13 10 L13 14" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* k */}
      <line x1="16" y1="2" x2="16" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 9.5 L20 6 M16 9.5 L20 14" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* 2 */}
      <path d="M23 5.5 Q23 3 25.5 3 Q28 3 28 5.5 Q28 7.5 24 12 L28.5 12" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChainLogo({ type }: { type: Cinema['type'] }) {
  if (type === 'pathe') return <PatheIcon />
  if (type === 'ugc')   return <UgcIcon />
  if (type === 'mk2')   return <Mk2Icon />
  return null
}

function CinemaBadge({ c }: { c: Cinema }) {
  const url  = c.allocine_url ?? CINEMA_URL[c.name]
  const cls  = `${cinemaClass(c.type)} cb`
  const name = displayName(c.name, c.type)
  const content = (
    <>
      <ChainLogo type={c.type} />
      {name}{c.note ?? ''}
    </>
  )
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cls} title={`${c.name} — AlloCiné`} onClick={e => e.stopPropagation()}>
        {content}
      </a>
    )
  }
  return <span className={cls}>{content}</span>
}

export default function CinemaBadges({ cinemas }: { cinemas: Cinema[] }) {
  const [open, setOpen] = useState(false)

  const hasAnyShowtimes = cinemas.some(c => c.showtimes && Object.keys(c.showtimes).length > 0)

  if (open) {
    return (
      <div className="showt-expanded">
        <button className="showt-toggle" onClick={() => setOpen(false)}>Horaires ▲</button>
        {cinemas.map((c, i) => {
          const versions = c.showtimes ? Object.entries(c.showtimes) : []
          const multiVer = versions.length > 1
          return (
            <div key={i} className="showt-row">
              <CinemaBadge c={c} />
              {versions.length > 0 && (
                <span className="showt-times">
                  {versions.map(([ver, times], vi) => (
                    <span key={ver}>
                      {vi > 0 && <span className="showt-sep"> / </span>}
                      {multiVer && <span className="showt-ver">{ver}: </span>}
                      {times.join(' · ')}
                    </span>
                  ))}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const pathe  = cinemas.filter(c => c.type === 'pathe')
  const ugc    = cinemas.filter(c => c.type === 'ugc')
  const mk2    = cinemas.filter(c => c.type === 'mk2')
  const others = cinemas.filter(c => c.type !== 'pathe' && c.type !== 'ugc' && c.type !== 'mk2')

  function BadgeGroup({ group }: { group: Cinema[] }) {
    if (group.length === 0) return null
    return (
      <div className="cgrp">
        {group.map((c, i) => <CinemaBadge key={i} c={c} />)}
      </div>
    )
  }

  return (
    <div className="ci-top">
      <div className="ci-badges">
        <BadgeGroup group={pathe} />
        <BadgeGroup group={ugc} />
        <BadgeGroup group={mk2} />
        <BadgeGroup group={others} />
      </div>
      {hasAnyShowtimes && (
        <button className="showt-toggle" onClick={() => setOpen(true)}>Horaires ▼</button>
      )}
    </div>
  )
}
