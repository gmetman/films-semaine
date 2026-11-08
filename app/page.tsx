import { supabase } from '@/lib/supabase'
import type { Film, Cinema } from '@/lib/types'
import { TIER_LABELS, TIER_CSS, scoreBarWidth } from '@/lib/scoring'
import FilmButtons from './FilmButtons'
import ProfileSelector from './ProfileSelector'
import CinemaBadges from './CinemaBadges'
import FilterButton from './FilterButton'
import FilmTableWrapper from './FilmTableWrapper'


export const revalidate = 3600

// Official-style SVG icons for major festivals
// Cannes: oval border + palm branch (Palme d'Or)
function CannesIcon() {
  return (
    <svg viewBox="0 0 60 40" width="30" height="20" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <ellipse cx="30" cy="20" rx="27" ry="17" fill="none" stroke="currentColor" strokeWidth="2.5"/>
      {/* stem */}
      <line x1="30" y1="35" x2="30" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      {/* center-top frond */}
      <path d="M30,21 C29,16 29,12 30,9 C31,12 31,16 30,21Z" fill="currentColor"/>
      {/* upper-left */}
      <path d="M30,21 C26,18 20,17 15,14 C19,13 25,16 30,21Z" fill="currentColor"/>
      {/* upper-right */}
      <path d="M30,21 C34,18 40,17 45,14 C41,13 35,16 30,21Z" fill="currentColor"/>
      {/* mid-left */}
      <path d="M30,21 C25,21 18,23 13,21 C18,19 25,20 30,21Z" fill="currentColor"/>
      {/* mid-right */}
      <path d="M30,21 C35,21 42,23 47,21 C42,19 35,20 30,21Z" fill="currentColor"/>
      {/* lower-left */}
      <path d="M30,21 C26,25 21,30 16,34 C20,31 25,27 30,21Z" fill="currentColor"/>
      {/* lower-right */}
      <path d="M30,21 C34,25 39,30 44,34 C40,31 35,27 30,21Z" fill="currentColor"/>
    </svg>
  )
}

// Berlinale: standing bear in festival red
function BerlinaleIcon() {
  return (
    <svg viewBox="0 0 32 46" width="16" height="23" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      {/* ears */}
      <circle cx="10" cy="5.5" r="5" fill="#B22222"/>
      <circle cx="22" cy="5.5" r="5" fill="#B22222"/>
      {/* head */}
      <ellipse cx="16" cy="13" rx="11" ry="9" fill="#B22222"/>
      {/* snout */}
      <ellipse cx="16" cy="17" rx="5.5" ry="3.5" fill="#8B0000"/>
      {/* body */}
      <path d="M7,21 C5,24 5,30 5,36 L5,40 C5,43 8,45 13,45 L19,45 C24,45 27,43 27,40 L27,36 C27,30 27,24 25,21 Z" fill="#B22222"/>
      {/* left arm raised */}
      <path d="M7,21 C4,17 1,13 2,11 C6,12 9,17 7,21Z" fill="#B22222"/>
      {/* right arm raised */}
      <path d="M25,21 C28,17 31,13 30,11 C26,12 23,17 25,21Z" fill="#B22222"/>
      {/* left leg */}
      <ellipse cx="11" cy="45" rx="5" ry="2.5" fill="#B22222"/>
      {/* right leg */}
      <ellipse cx="21" cy="45" rx="5" ry="2.5" fill="#B22222"/>
    </svg>
  )
}

// Venice / Mostra: winged lion silhouette
function VeniceIcon() {
  return (
    <svg viewBox="0 0 60 30" width="28" height="14" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      {/* left wing */}
      <path d="M20,19 C17,13 11,7 5,4 C9,4 15,9 20,18Z" fill="currentColor"/>
      {/* right wing */}
      <path d="M36,17 C38,11 43,5 50,3 C46,6 41,12 36,17Z" fill="currentColor"/>
      {/* body */}
      <path d="M6,25 C8,21 14,19 20,19 L36,19 C40,19 44,21 48,24 L52,25 C47,27 38,28 30,28 L16,28 C11,28 7,27 6,25Z" fill="currentColor"/>
      {/* head + mane */}
      <ellipse cx="10" cy="21" rx="9" ry="8" fill="currentColor"/>
      {/* tail curl */}
      <path d="M52,25 C56,20 57,15 54,12 C52,15 51,20 52,25Z" fill="currentColor"/>
    </svg>
  )
}

// César: abstract human figure trophy (silver)
function CesarIcon() {
  return (
    <svg viewBox="0 0 22 32" width="13" height="19" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      {/* head */}
      <ellipse cx="11" cy="5" rx="4.5" ry="4.5" fill="#9E9E9E"/>
      {/* body crouching forward */}
      <path d="M6,10 C4,13 4,19 6,24 L16,24 C18,19 18,13 16,10 Z" fill="#9E9E9E"/>
      {/* left arm */}
      <path d="M6,13 C3,11 1,8 2,7 C4,8 7,11 6,13Z" fill="#9E9E9E"/>
      {/* right arm */}
      <path d="M16,13 C19,11 21,8 20,7 C18,8 15,11 16,13Z" fill="#9E9E9E"/>
      {/* left leg */}
      <path d="M8,24 L7,30 L11,30 L10,24Z" fill="#9E9E9E"/>
      {/* right leg */}
      <path d="M14,24 L15,30 L11,30 L12,24Z" fill="#9E9E9E"/>
    </svg>
  )
}

// Oscar / Academy Award: golden statuette
function OscarIcon() {
  return (
    <svg viewBox="0 0 20 32" width="11" height="18" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      {/* head */}
      <circle cx="10" cy="4" r="4" fill="#C8A415"/>
      {/* body */}
      <path d="M6,8 C5,10 5,16 6,20 L14,20 C15,16 15,10 14,8 Z" fill="#C8A415"/>
      {/* sword arm raised */}
      <line x1="10" y1="8" x2="10" y2="1" stroke="#C8A415" strokeWidth="2" strokeLinecap="round"/>
      {/* base tiers */}
      <rect x="5" y="20" width="10" height="3" rx="1" fill="#C8A415"/>
      <rect x="3" y="23" width="14" height="3" rx="1" fill="#C8A415"/>
      <rect x="5" y="26" width="10" height="6" rx="1" fill="#C8A415"/>
    </svg>
  )
}

// Golden Globe: golden sphere with latitude lines
function GoldenGlobeIcon() {
  return (
    <svg viewBox="0 0 24 28" width="13" height="16" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <circle cx="12" cy="11" r="9" fill="none" stroke="#C8A415" strokeWidth="2"/>
      <ellipse cx="12" cy="11" rx="4.5" ry="9" fill="none" stroke="#C8A415" strokeWidth="1.2"/>
      <line x1="3" y1="11" x2="21" y2="11" stroke="#C8A415" strokeWidth="1.2"/>
      <line x1="12" y1="22" x2="12" y2="25" stroke="#C8A415" strokeWidth="1.5"/>
      <rect x="8" y="25" width="8" height="2.5" rx="1" fill="#C8A415"/>
    </svg>
  )
}

// BAFTA: simplified mask icon
function BaftaIcon() {
  return (
    <svg viewBox="0 0 24 20" width="14" height="12" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      {/* theatrical mask */}
      <path d="M4,4 C4,2 6,1 8,1 L16,1 C18,1 20,2 20,4 L20,10 C20,15 16,19 12,19 C8,19 4,15 4,10 Z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8,8 C9,10 11,10 12,9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="8.5" cy="6" r="1" fill="currentColor"/>
      <circle cx="15.5" cy="6" r="1" fill="currentColor"/>
    </svg>
  )
}

type IconResult = string | React.ReactElement

function festivalIcon(text: string): IconResult {
  if (/cannes|palme d.or/i.test(text)) return <CannesIcon />
  if (/ours d.or|berlinale|berlin/i.test(text)) return <BerlinaleIcon />
  if (/lion d.or|venise|venice|mostra/i.test(text)) return <VeniceIcon />
  if (/césar/i.test(text)) return <CesarIcon />
  if (/oscar|academy award/i.test(text)) return <OscarIcon />
  if (/golden globe/i.test(text)) return <GoldenGlobeIcon />
  if (/bafta/i.test(text)) return <BaftaIcon />
  if (/grand prix/i.test(text)) return '🥇'
  if (/prix du jury/i.test(text)) return '⚖️'
  if (/prix d.interpr/i.test(text)) return '🎭'
  if (/mise en scène/i.test(text)) return '🎬'
  if (/scénario/i.test(text)) return '✍️'
  if (/sundance/i.test(text)) return '❄️'
  if (/toronto|tiff/i.test(text)) return '🍁'
  if (/annecy/i.test(text)) return '⛵'
  if (/deauville/i.test(text)) return '🌊'
  if (/locarno/i.test(text)) return '🐆'
  if (/ghent|gand/i.test(text)) return '🔔'
  if (/briff|bruxelles/i.test(text)) return '🇧🇪'
  if (/san sebastian/i.test(text)) return '🐚'
  if (/tauron|horizons/i.test(text)) return '⭐'
  if (/tribeca/i.test(text)) return '🗽'
  if (/sélection|selection/i.test(text)) return '🎬'
  return '🏅'
}

function PrizeLabel({ text }: { text: string }) {
  const lines = text.split(/\s*[·•\n]\s*/).map(s => s.trim()).filter(Boolean)
  if (lines.length <= 1) {
    const icon = festivalIcon(text)
    return <span style={{ fontSize: 12 }}>{icon} {text}</span>
  }
  return (
    <span style={{ fontSize: 12 }}>
      {lines.map((l, i) => {
        const icon = festivalIcon(l)
        return <span key={i} style={{ display: 'block' }}>{icon} {l}</span>
      })}
    </span>
  )
}

function getWeekDate(): string {
  const now = new Date()
  const dow = now.getDay()
  const diff = (dow + 7 - 3) % 7
  const wed = new Date(now)
  wed.setDate(now.getDate() - diff)
  return wed.toISOString().slice(0, 10)
}

function formatWeekLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00')
  const end = new Date(d)
  end.setDate(d.getDate() + 6)
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const fmtEnd = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return `Semaine du mercredi ${fmt.format(d)} au mardi ${fmtEnd.format(end)}`
}


async function getFilms(): Promise<{ films: Film[]; weekDate: string }> {
  const weekDate = getWeekDate()
  const { data, error } = await supabase
    .from('weekly_films')
    .select('*')
    .eq('week_date', weekDate)
    .order('combined_score', { ascending: false })

  if (error) {
    console.error('Supabase error:', error)
    return { films: [], weekDate }
  }

  return { films: (data ?? []) as Film[], weekDate }
}

export default async function Page() {
  const { films, weekDate } = await getFilms()

  const weekLabel = formatWeekLabel(weekDate)
  const dateFormatted = new Date(weekDate + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <div className="film">
        <div className="perf" />
        <div className="ttl">
          <div className="ttl-left">
            <h1>🎬 FILMS À VOIR CETTE SEMAINE</h1>
            <span className="sub">
              {weekLabel} · vos cinémas · hors épouvante/horreur · tri par note combinée
            </span>
          </div>
          <ProfileSelector />
        </div>
        <div className="perf" />
      </div>

      {films.length === 0 ? (
        <p className="s" style={{ marginTop: 12 }}>Aucun film pour cette semaine — le scraper n&apos;a pas encore tourné.</p>
      ) : (
        <FilmTableWrapper>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Note /5<br />(P presse · S spect.)</th>
                <th>Score famille <FilterButton /></th>
                <th>Film</th>
                <th>
                  Cinémas{' '}
                  <small style={{ display: 'inline' }}>(jaune = Pathé, bleu = UGC)</small>
                </th>
                <th>Prix</th>
                <th>Réalisateur · Acteurs</th>
              </tr>
            </thead>
            <tbody>
              {films.map(film => {
                const tier = film.score_tier as keyof typeof TIER_LABELS
                const tierCss = TIER_CSS[tier]
                const tierLabel = TIER_LABELS[tier]
                const barW = scoreBarWidth(film.combined_score)
                const posterSrc = film.poster_url ?? null

                return (
                  <tr key={film.allocine_id}>
                    {/* Poster — click links to AlloCiné */}
                    <td className="pc">
                      {posterSrc ? (
                        <a href={film.allocine_url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="po" loading="lazy" alt={`Affiche de ${film.title}`} src={posterSrc} />
                        </a>
                      ) : (
                        <div className="po" />
                      )}
                    </td>

                    {/* Score */}
                    <td className="sc">
                      <span className="num">{film.combined_score.toFixed(2)}</span>
                      <span className="bar"><i className={tierCss} style={{ width: barW }} /></span>
                      <span className={`lb ${tierCss}`}>{tierLabel}</span>
                      <small>
                        P {film.press_score?.toFixed(1) ?? '—'} · S {film.audience_score?.toFixed(1) ?? '—'}
                      </small>
                    </td>

                    {/* Vote buttons + family score */}
                    <td className="b">
                      <FilmButtons allocineId={film.allocine_id} weekDate={weekDate} />
                    </td>

                    {/* Film info — title links to AlloCiné, trailer ▶ separate */}
                    <td className="t">
                      <a href={film.allocine_url} target="_blank" rel="noopener noreferrer" className="film-title-link"><b>{film.title}</b></a>
                      {film.trailer_url && (
                        <a className="ic" title="Bande-annonce" href={film.trailer_url}>▶</a>
                      )}
                      {film.original_title && (
                        <small className="o">Titre original : {film.original_title}</small>
                      )}
                      <small>{[film.year, film.duration].filter(Boolean).join(' · ')}</small>
                      <small>
                        {film.genres.join(', ')}{' '}
                        {film.age_rating && (
                          <span className={`rs${film.age_banned ? ' ban' : ''}`}>· {film.age_rating}</span>
                        )}
                      </small>
                      {film.countries.length > 0 && <small>{film.countries.join(', ')}</small>}
                    </td>

                    {/* Cinemas */}
                    <td>
                      <CinemaBadges cinemas={film.cinemas as Cinema[]} />
                    </td>

                    {/* Prizes */}
                    <td>{film.prizes ? <PrizeLabel text={film.prizes} /> : <span className="n">—</span>}</td>

                    {/* Director / Actors */}
                    <td>
                      {film.director}
                      {film.actors.length > 0 && <small>{film.actors.join(', ')}</small>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </FilmTableWrapper>
      )}

      <div className="box">
        <b>Méthode</b> : note combinée = 60&nbsp;% presse AlloCiné + 40&nbsp;% spectateurs AlloCiné
        (sur 5), plus un bonus prix plafonné à +0,40.
        <ul>
          <li>Notes AlloCiné au {dateFormatted}.</li>
          <li>Score famille : ★ Préféré +3 · ? Pourquoi pas +1 · ✓ Déjà vu −2 · ✗ Pas intéressé −2.</li>
          <li>Prix : chargés automatiquement depuis AlloCiné lors du scraping hebdomadaire.</li>
          <li>Recommandation pour relecture humaine, pas une conclusion définitive.</li>
        </ul>
      </div>
    </>
  )
}
