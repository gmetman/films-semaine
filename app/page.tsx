import { supabase } from '@/lib/supabase'
import type { Film, Cinema } from '@/lib/types'
import { TIER_LABELS, TIER_CSS, scoreBarWidth } from '@/lib/scoring'
import FilmButtons from './FilmButtons'
import ProfileSelector from './ProfileSelector'
import CinemaBadges from './CinemaBadges'
import FilterButton from './FilterButton'
import FilmTableWrapper from './FilmTableWrapper'


export const revalidate = 3600

// Inline SVG icons for main festivals
function PalmIcon() {
  return (
    <svg viewBox="0 0 14 18" width="12" height="15" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <path d="M7,17 L7,10" stroke="#B8930A" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M7,10 C7,7 6,4 7,1 C7.5,4 8,7 7,10Z" fill="#2E7D32"/>
      <path d="M7,10 C5,8 3,8 1,6 C3,5 5,7 7,10Z" fill="#2E7D32"/>
      <path d="M7,10 C5,7 4,5 3,3 C5,3 6,6 7,10Z" fill="#2E7D32" opacity=".85"/>
      <path d="M7,10 C9,8 11,8 13,6 C11,5 9,7 7,10Z" fill="#2E7D32"/>
      <path d="M7,10 C9,7 10,5 11,3 C9,3 8,6 7,10Z" fill="#2E7D32" opacity=".85"/>
      <path d="M7,10 C5,10 3,12 2,14 C4,13 6,11 7,10Z" fill="#2E7D32" opacity=".75"/>
      <path d="M7,10 C9,10 11,12 12,14 C10,13 8,11 7,10Z" fill="#2E7D32" opacity=".75"/>
    </svg>
  )
}

function BearIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <circle cx="4" cy="4" r="3" fill="#C62828"/>
      <circle cx="12" cy="4" r="3" fill="#C62828"/>
      <ellipse cx="8" cy="10" rx="6" ry="5" fill="#C62828"/>
      <circle cx="6" cy="8" r="1.2" fill="#fff"/>
      <circle cx="10" cy="8" r="1.2" fill="#fff"/>
      <ellipse cx="8" cy="11.5" rx="2.5" ry="1.5" fill="#B71C1C"/>
    </svg>
  )
}

function LionIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <circle cx="8" cy="8" r="6.5" fill="#D4A017"/>
      <circle cx="8" cy="8" r="4" fill="#C68000"/>
      <circle cx="6.5" cy="7" r="1" fill="#fff"/>
      <circle cx="9.5" cy="7" r="1" fill="#fff"/>
      <ellipse cx="8" cy="10" rx="2" ry="1.2" fill="#A05000"/>
    </svg>
  )
}

function CesarIcon() {
  return (
    <svg viewBox="0 0 12 18" width="10" height="15" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <ellipse cx="6" cy="4" rx="3" ry="3.5" fill="#9E9E9E"/>
      <rect x="4.5" y="7" width="3" height="6" rx="1" fill="#757575"/>
      <path d="M3,13 L6,13 L6,16 L4,16 L3,13Z" fill="#757575"/>
      <path d="M9,13 L6,13 L6,16 L8,16 L9,13Z" fill="#757575"/>
    </svg>
  )
}

type IconResult = string | React.ReactElement

function festivalIcon(text: string): IconResult {
  if (/palme d.or/i.test(text)) return <PalmIcon />
  if (/cannes/i.test(text)) return <PalmIcon />
  if (/ours d.or|berlinale|berlin/i.test(text)) return <BearIcon />
  if (/lion d.or|venise|venice/i.test(text)) return <LionIcon />
  if (/césar/i.test(text)) return <CesarIcon />
  if (/grand prix/i.test(text)) return '🥇'
  if (/prix du jury/i.test(text)) return '⚖️'
  if (/prix d.interpr/i.test(text)) return '🎭'
  if (/mise en scène/i.test(text)) return '🎬'
  if (/scénario/i.test(text)) return '✍️'
  if (/oscar/i.test(text)) return '🏆'
  if (/sundance/i.test(text)) return '❄️'
  if (/bafta/i.test(text)) return '🎩'
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
