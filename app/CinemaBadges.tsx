'use client'
import { useState, type CSSProperties } from 'react'
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

const logoStyle: CSSProperties = { verticalAlign: 'middle', marginRight: 3, flexShrink: 0, display: 'inline-block' }

function ChainLogo({ type }: { type: Cinema['type'] }) {
  if (type === 'pathe') return <img src="/logos/pathe.svg" alt="" aria-hidden height={13} style={logoStyle} />
  if (type === 'ugc')   return <img src="/logos/ugc.svg"   alt="" aria-hidden height={13} style={logoStyle} />
  if (type === 'mk2')   return <img src="/logos/mk2.svg"   alt="" aria-hidden height={13} style={logoStyle} />
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
