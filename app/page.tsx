import { supabase } from '@/lib/supabase'
import type { Film, Cinema } from '@/lib/types'
import { TIER_LABELS, TIER_CSS, scoreBarWidth } from '@/lib/scoring'
import FilmButtons from './FilmButtons'
import ProfileSelector from './ProfileSelector'
import HideFilms from './HideFilms'

export const revalidate = 3600

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

function cinemaClass(type: Cinema['type']): string {
  if (type === 'pathe') return 'c p'
  if (type === 'ugc') return 'c u'
  return 'c o'
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
          <h1>🎬 FILMS À VOIR CETTE SEMAINE</h1>
          <span className="sub">
            {weekLabel} · vos cinémas · hors épouvante/horreur · tri par note combinée
          </span>
        </div>
        <div className="perf" />
        <ProfileSelector />
      </div>

      <div id="bar">
        <HideFilms weekDate={weekDate} />
      </div>

      {films.length === 0 ? (
        <p className="s">Aucun film pour cette semaine — le scraper n&apos;a pas encore tourné.</p>
      ) : (
        <div className="w">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Note /5<br />(P presse · S spect.)</th>
                <th>Film</th>
                <th>Réalisateur · Acteurs</th>
                <th>Prix</th>
                <th>
                  Cinémas{' '}
                  <small style={{ display: 'inline' }}>(jaune = Pathé, bleu = UGC)</small>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {films.map(film => {
                const tier = film.score_tier as keyof typeof TIER_LABELS
                const tierCss = TIER_CSS[tier]
                const tierLabel = TIER_LABELS[tier]
                const barW = scoreBarWidth(film.combined_score)

                return (
                  <tr key={film.allocine_id} data-id={film.allocine_id}>
                    {/* Poster */}
                    <td className="pc">
                      {film.poster_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="po"
                          loading="lazy"
                          alt={`Affiche de ${film.title}`}
                          src={film.poster_url}
                          referrerPolicy="no-referrer"
                        />
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

                    {/* Film info */}
                    <td className="t">
                      <b>{film.title}</b>{' '}
                      <a className="ic" title="Fiche AlloCiné" href={film.allocine_url}>ⓘ</a>
                      {film.trailer_url && (
                        <a className="ic" title="Bande-annonce" href={film.trailer_url}>▶</a>
                      )}
                      {film.original_title && (
                        <small className="o">Titre original : {film.original_title}</small>
                      )}
                      <small>
                        {[film.year, film.duration].filter(Boolean).join(' · ')}
                      </small>
                      <small>
                        {film.genres.join(', ')}{' '}
                        {film.age_rating && (
                          <span className={`rs${film.age_banned ? ' ban' : ''}`}>
                            · {film.age_rating}
                          </span>
                        )}
                      </small>
                      {film.countries.length > 0 && (
                        <small>{film.countries.join(', ')}</small>
                      )}
                    </td>

                    {/* Director / Actors */}
                    <td>
                      {film.director}
                      {film.actors.length > 0 && (
                        <small>{film.actors.join(', ')}</small>
                      )}
                    </td>

                    {/* Prizes */}
                    <td>{film.prizes ?? '-'}</td>

                    {/* Cinemas */}
                    <td>
                      {(film.cinemas as Cinema[]).map((c, i) => (
                        <span key={i} className={cinemaClass(c.type)}>
                          {c.name}{c.note ?? ''}
                        </span>
                      ))}
                    </td>

                    {/* Buttons */}
                    <td className="b">
                      <FilmButtons allocineId={film.allocine_id} weekDate={weekDate} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="box">
        <b>Méthode</b> : note combinée = 60&nbsp;% presse AlloCiné + 40&nbsp;% spectateurs AlloCiné
        (sur 5), plus un bonus prix plafonné à +0,40 (+0,30 prix majeur Cannes/Venise/Berlin/Oscars/César&nbsp;;
        +0,20 autre grand festival&nbsp;; +0,05 par distinction ou sélection supplémentaire).
        <ul>
          <li>Notes AlloCiné au {dateFormatted}. * = page du cinéma datée de quelques jours : vérifier les horaires.</li>
          <li>Prix à saisir manuellement dans Supabase (colonne <code>prizes</code>).</li>
          <li>Recommandation pour relecture humaine, pas une conclusion définitive.</li>
          <li>
            Niveaux de note : Incontournable ≥&nbsp;4,5 · Très bon ≥&nbsp;4,2 · Bon ≥&nbsp;3,9 · Correct en dessous.
          </li>
          <li>Les boutons « Déjà vu » / « Pas intéressé » mémorisent votre choix dans Supabase, par profil.</li>
        </ul>
      </div>
    </>
  )
}
