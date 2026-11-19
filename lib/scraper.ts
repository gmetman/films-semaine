import * as cheerio from 'cheerio'
import type { Element } from 'domhandler'
import { createClient } from '@supabase/supabase-js'
import { CINEMAS, EXCLUDED_GENRES, type CinemaConfig } from './cinemas.js'
import { calculateCombinedScore, getScoreTier, type ScoreTier } from './scoring.js'
import type { Film, Cinema } from './types.js'

const ALLOCINE_BASE = 'https://www.allocine.fr'
const POSTER_SIZE = 'c_160_213'

interface PalmaresConfig { festival: string; url: string; year: number }

const PALMARES_LIST: PalmaresConfig[] = [
  { festival: 'Cannes',        year: 2026, url: 'https://www.allocine.fr/festivals/festival-229/edition-19356942/palmares/' },
  { festival: 'Berlinale',     year: 2026, url: 'https://www.allocine.fr/festivals/festival-129/edition-19356897/palmares/' },
  { festival: 'Mostra Venise', year: 2026, url: 'https://www.allocine.fr/festivals/festival-321/edition-19357100/palmares/' },
  { festival: 'Deauville',     year: 2026, url: 'https://www.allocine.fr/festivals/festival-330/edition-19356988/palmares/' },
  { festival: 'Annecy',        year: 2026, url: 'https://www.allocine.fr/festivals/festival-263/edition-19357066/palmares/' },
  { festival: 'César',         year: 2026, url: 'https://www.allocine.fr/festivals/festival-128/edition-19356863/palmares/' },
  { festival: 'Oscars',        year: 2026, url: 'https://www.allocine.fr/festivals/festival-146/edition-19356898/palmares/' },
  { festival: 'Golden Globes', year: 2026, url: 'https://www.allocine.fr/festivals/festival-118/edition-19356806/palmares/' },
]

const AWARD_PATTERNS = [
  /Palme d.Or/i, /Grand Prix/i, /Prix du [Jj]ury/i,
  /Prix d.interpr[eé]t/i, /Prix de mise en sc[eè]ne/i, /Prix du sc[eé]nario/i,
  /Mention sp[eé]ciale/i, /Cam[eé]ra d.Or/i, /Un Certain Regard/i,
  /Cin[eé]fondation/i, /Courts m[eé]trages/i, /Semaine de la Critique/i,
  /Quinzaine/i, /S[eé]lection/i,
]

interface FilmEntry {
  allocine_id: string; title: string; allocine_url: string; poster_url: string | null
  year: number | null; duration: string | null; genres: string[]; countries: string[]
  director: string | null; actors: string[]; age_rating: string | null; age_banned: boolean
  press_score: number | null; audience_score: number | null; trailer_url: string | null
  showtimes: Record<string, string[]>
}

export interface ScrapeResult {
  weekDate: string; films: number; cinemaErrors: number; durationMs: number
}

export function getWeekDate(): string {
  const now = new Date()
  const diff = (now.getDay() + 7 - 3) % 7
  const wed = new Date(now)
  wed.setDate(now.getDate() - diff)
  return wed.toISOString().slice(0, 10)
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'fr-FR,fr;q=0.9',
      'Accept': 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function parseFilmCard($: cheerio.CheerioAPI, card: Element): FilmEntry | null {
  const $card = $(card)
  const titleLink = $card.find('.meta-title-link')
  const href = titleLink.attr('href') || ''
  const idMatch = href.match(/cfilm=(\d+)/)
  if (!idMatch) return null
  const title = titleLink.text().trim()
  if (!title) return null
  const allocine_id = idMatch[1]

  const metaInfo = $card.find('.meta-body-info').text().trim()
  const metaParts = metaInfo.split('|').map(s => s.trim())
  const yearMatch = (metaParts[0] || '').match(/(\d{4})/)
  const year = yearMatch ? parseInt(yearMatch[1]) : null

  let duration: string | null = null, genreStr = '', countryStr = ''
  const part1 = metaParts[1] || ''
  if (/^\d+h/.test(part1)) {
    duration = part1
    const part2 = metaParts[2] || ''
    if (part2.includes('/')) { const [g, c] = part2.split('/').map(s => s.trim()); genreStr = g; countryStr = c || '' }
    else { genreStr = part2; countryStr = metaParts[3] || '' }
  } else if (part1.includes('/')) {
    const [g, c] = part1.split('/').map(s => s.trim()); genreStr = g; countryStr = c || ''
  } else { genreStr = part1; countryStr = metaParts[2] || '' }

  const genres = genreStr ? genreStr.split(',').map(g => g.trim()).filter(Boolean) : []
  const countries = countryStr ? countryStr.split(',').map(c => c.trim()).filter(Boolean) : []
  const director = $card.find('.meta-body-direction').text().replace(/^De\s+/, '').trim() || null
  const actorsText = $card.find('.meta-body-actor').text().replace(/^Avec\s+/, '').trim()
  const actors = actorsText ? actorsText.split(',').map(a => a.trim()).filter(Boolean) : []
  const ageText = $card.find('.certificate-text').text().trim()
  const age_rating = ageText || null
  const age_banned = /interdit/i.test(ageText)

  let press_score: number | null = null, audience_score: number | null = null
  $card.find('.rating-item').each((_, item) => {
    const $item = $(item)
    const label = $item.find('.rating-title').text().trim()
    const noteText = $item.text().match(/(\d)[,.](\d)/)
    if (!noteText) return
    const val = parseFloat(`${noteText[1]}.${noteText[2]}`)
    if (label === 'Presse') press_score = val
    if (label === 'Spectateurs') audience_score = val
  })

  const imgEl = $card.find('img.thumbnail-img')
  const posterSrc = imgEl.attr('data-src') || imgEl.attr('src') || null
  const poster_url = (posterSrc && !posterSrc.startsWith('data:'))
    ? (posterSrc.startsWith('//') ? `https:${posterSrc}` : posterSrc).replace(/r_\d+_\d+/, POSTER_SIZE)
    : null

  const showtimes: Record<string, string[]> = {}
  $card.find('.showtimes-version').each((_, ver) => {
    const $ver = $(ver)
    const label = $ver.find('.text').text().trim() || 'VF'
    const times: string[] = []
    $ver.find('.showtimes-hour-item-value').each((_, t) => {
      const raw = $(t).text().trim()
      if (raw) times.push(raw.replace(':', 'h'))
    })
    if (times.length > 0) showtimes[label] = times
  })

  return { allocine_id, title, allocine_url: `${ALLOCINE_BASE}${href}`, poster_url, year, duration, genres, countries, director, actors, age_rating, age_banned, press_score, audience_score, trailer_url: null, showtimes }
}

async function scrapeShowtimes(cinema: CinemaConfig, log: (m: string) => void): Promise<FilmEntry[]> {
  const url = `${ALLOCINE_BASE}/seance/salle_gen_csalle=${cinema.id}.html`
  log(`  → ${cinema.name}`)
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)
  const films: FilmEntry[] = []
  const seen = new Set<string>()
  $('.entity-card').each((_, card) => {
    const entry = parseFilmCard($, card)
    if (!entry || seen.has(entry.allocine_id)) return
    seen.add(entry.allocine_id)
    films.push(entry)
  })
  return films
}

async function scrapePalmares(config: PalmaresConfig, log: (m: string) => void): Promise<Map<string, string>> {
  const prizes = new Map<string, string>()
  try {
    const html = await fetchHtml(config.url)
    const $ = cheerio.load(html)
    let currentAward = ''
    const elements: Array<{ tag: string; el: Element }> = []
    $('h1,h2,h3,h4,h5,strong,a[href*="cfilm="]').each((_, el) => { elements.push({ tag: (el as Element).tagName.toLowerCase(), el: el as Element }) })
    for (const { tag, el } of elements) {
      if (['h1','h2','h3','h4','h5','strong'].includes(tag)) {
        const txt = $(el).text().trim()
        if (AWARD_PATTERNS.some(re => re.test(txt)) && txt.length < 120) currentAward = txt
      } else if (tag === 'a') {
        const m = ($(el).attr('href') || '').match(/cfilm=(\d+)/)
        if (m && currentAward && !prizes.has(m[1])) prizes.set(m[1], `${currentAward}, ${config.festival} ${config.year}`)
      }
    }
    if (prizes.size === 0) {
      const rawText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
      for (const lm of [...html.matchAll(/href="\/film\/fichefilm_gen_cfilm=(\d+)\.html"/g)]) {
        const filmId = lm[1], pos = lm.index ?? 0, before = rawText.slice(Math.max(0, pos - 400), pos)
        for (const re of AWARD_PATTERNS) {
          const am = before.match(new RegExp(`(${re.source}[^|·]{0,80})`, 'i'))
          if (am) { if (!prizes.has(filmId)) prizes.set(filmId, `${am[1].trim().slice(0, 80)}, ${config.festival} ${config.year}`); break }
        }
      }
    }
    log(`  ✓ Palmares ${config.festival}: ${prizes.size} films`)
  } catch (err) {
    log(`  ✗ Palmares ${config.festival}: ${err}`)
  }
  return prizes
}

export async function runScraper(
  weekDate: string,
  { delayMs = 200, log = console.log }: { delayMs?: number; log?: (msg: string) => void } = {}
): Promise<ScrapeResult> {
  const t0 = Date.now()
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  log(`🎬 Scraping week of ${weekDate}`)

  // --- Cinemas (one at a time) ---
  const filmMap = new Map<string, { entry: FilmEntry; cinemas: Cinema[] }>()
  let cinemaErrors = 0
  for (const cinema of CINEMAS) {
    try {
      const films = await scrapeShowtimes(cinema, log)
      for (const film of films) {
        if (film.genres.some(g => EXCLUDED_GENRES.includes(g))) continue
        const cinemaEntry: Cinema = {
          name: cinema.name, type: cinema.type, note: cinema.note,
          allocine_url: `${ALLOCINE_BASE}/seance/salle_gen_csalle=${cinema.id}.html`,
          showtimes: film.showtimes,
        }
        const existing = filmMap.get(film.allocine_id)
        if (existing) existing.cinemas.push(cinemaEntry)
        else filmMap.set(film.allocine_id, { entry: film, cinemas: [cinemaEntry] })
      }
    } catch (err) {
      cinemaErrors++
      log(`  ✗ ${cinema.name}: ${err}`)
    }
    if (delayMs > 0) await sleep(delayMs)
  }
  log(`\nFound ${filmMap.size} unique films (${cinemaErrors} cinema errors)`)

  // --- Build rows ---
  const rows: Omit<Film, 'id'>[] = []
  for (const { entry, cinemas } of filmMap.values()) {
    rows.push({
      week_date: weekDate, title: entry.title, allocine_id: entry.allocine_id,
      allocine_url: entry.allocine_url, poster_url: entry.poster_url, year: entry.year,
      duration: entry.duration, genres: entry.genres, countries: entry.countries,
      director: entry.director, actors: entry.actors, age_rating: entry.age_rating,
      age_banned: entry.age_banned, press_score: entry.press_score, audience_score: entry.audience_score,
      combined_score: calculateCombinedScore(entry.press_score, entry.audience_score),
      score_tier: getScoreTier(calculateCombinedScore(entry.press_score, entry.audience_score)),
      prizes: null, trailer_url: null, cinemas,
    })
  }

  // --- Palmares ---
  log('\nScraping festival palmares...')
  const palmaresPrizes = new Map<string, string>()
  for (const config of PALMARES_LIST) {
    for (const [id, prize] of await scrapePalmares(config, log)) {
      if (!palmaresPrizes.has(id)) palmaresPrizes.set(id, prize)
    }
    if (delayMs > 0) await sleep(delayMs)
  }

  // Preserve existing manual prizes
  const { data: existingRows } = await sb.from('weekly_films').select('allocine_id, prizes').eq('week_date', weekDate)
  const existingPrizes = new Map(existingRows?.map(r => [r.allocine_id, r.prizes]) ?? [])
  for (const row of rows) {
    if (existingPrizes.get(row.allocine_id)) row.prizes = existingPrizes.get(row.allocine_id) ?? null
    else if (palmaresPrizes.has(row.allocine_id)) row.prizes = palmaresPrizes.get(row.allocine_id) ?? null
  }

  // Prize bonus
  for (const row of rows) {
    if (row.prizes) {
      const bonus = Math.min(((row.prizes.match(/·/g) ?? []).length + 1) * 0.10, 0.40)
      row.combined_score = calculateCombinedScore(row.press_score, row.audience_score, bonus)
      row.score_tier = getScoreTier(row.combined_score) as ScoreTier
    }
  }
  rows.sort((a, b) => b.combined_score - a.combined_score)

  // --- Upsert ---
  log(`\nUpserting ${rows.length} rows to Supabase...`)
  const { error } = await sb.from('weekly_films').upsert(rows, { onConflict: 'week_date,allocine_id' })
  if (error) throw new Error(`Supabase error: ${error.message}`)
  log(`✓ ${rows.length} films upserted`)
  for (const row of rows.slice(0, 5)) log(`  ${row.combined_score.toFixed(2)}  ${row.title}`)

  // --- Vote carryover ---
  const prevDate = new Date(weekDate + 'T12:00:00')
  prevDate.setDate(prevDate.getDate() - 7)
  const prevWeek = prevDate.toISOString().split('T')[0]
  const { data: prevPrefs } = await sb.from('user_preferences')
    .select('profile, allocine_id, choice').eq('week_date', prevWeek)
    .in('allocine_id', rows.map(r => r.allocine_id))
  if (prevPrefs && prevPrefs.length > 0) {
    const { error: ce } = await sb.from('user_preferences').upsert(
      prevPrefs.map(p => ({ profile: p.profile, allocine_id: p.allocine_id, week_date: weekDate, choice: p.choice })),
      { onConflict: 'profile,allocine_id,week_date', ignoreDuplicates: true }
    )
    if (ce) log(`⚠ Vote carryover error: ${ce.message}`)
    else log(`✓ Carried over ${prevPrefs.length} votes from ${prevWeek}`)
  }

  // --- Revalidate ---
  const appUrl = process.env.APP_URL
  const secret = process.env.REVALIDATE_SECRET
  if (appUrl && secret) {
    try {
      const res = await fetch(`${appUrl}/api/revalidate?secret=${secret}`, { method: 'POST' })
      log(res.ok ? '✓ Page revalidated' : `⚠ Revalidation failed: ${res.status}`)
    } catch (e) { log(`⚠ Revalidation skipped: ${(e as Error).message}`) }
  }

  return { weekDate, films: rows.length, cinemaErrors, durationMs: Date.now() - t0 }
}
