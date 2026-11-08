/**
 * Weekly scraper for AlloCiné showtimes.
 * Run via: npm run scrape
 * Or by GitHub Actions every Wednesday morning.
 */

import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { CINEMAS, EXCLUDED_GENRES, type CinemaConfig } from '../lib/cinemas.js'
import { calculateCombinedScore, getScoreTier } from '../lib/scoring.js'
import type { Film, Cinema } from '../lib/types.js'

const ALLOCINE_BASE = 'https://www.allocine.fr'
const POSTER_SIZE = 'c_160_213'
const DELAY_MS = 800

// Supabase admin client (service role for writes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  },
)

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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

interface FilmEntry {
  allocine_id: string
  title: string
  allocine_url: string
  poster_url: string | null
  year: number | null
  duration: string | null
  genres: string[]
  countries: string[]
  director: string | null
  actors: string[]
  age_rating: string | null
  age_banned: boolean
  press_score: number | null
  audience_score: number | null
  trailer_url: string | null
  showtimes: Record<string, string[]>  // { "En VF": ["15h45", "17h50"] }
}

function parseFilmCard($: cheerio.CheerioAPI, card: cheerio.Element): FilmEntry | null {
  const $card = $(card)

  const titleLink = $card.find('.meta-title-link')
  const href = titleLink.attr('href') || ''
  const idMatch = href.match(/cfilm=(\d+)/)
  if (!idMatch) return null
  const allocine_id = idMatch[1]

  const title = titleLink.text().trim()
  if (!title) return null

  const metaInfo = $card.find('.meta-body-info').text().trim()
  // Format: "04 novembre 2026 | 1h 58min | Thriller | Grande-Bretagne, U.S.A., Chili"
  const metaParts = metaInfo.split('|').map(s => s.trim())

  const dateStr = metaParts[0] || ''
  const yearMatch = dateStr.match(/(\d{4})/)
  const year = yearMatch ? parseInt(yearMatch[1]) : null

  const duration = metaParts[1] || null

  const genreStr = metaParts[2] || ''
  const genres = genreStr ? genreStr.split(',').map(g => g.trim()).filter(Boolean) : []

  const countryStr = metaParts[3] || ''
  const countries = countryStr ? countryStr.split(',').map(c => c.trim()).filter(Boolean) : []

  const director = $card.find('.meta-body-direction').text().replace(/^De\s+/, '').trim() || null

  const actorsText = $card.find('.meta-body-actor').text().replace(/^Avec\s+/, '').trim()
  const actors = actorsText ? actorsText.split(',').map(a => a.trim()).filter(Boolean) : []

  const ageText = $card.find('.certificate-text').text().trim()
  const age_rating = ageText || null
  const age_banned = /interdit/i.test(ageText)

  // Scores
  let press_score: number | null = null
  let audience_score: number | null = null
  $card.find('.rating-item').each((_, item) => {
    const $item = $(item)
    const label = $item.find('.rating-title').text().trim()
    // The score appears as a text node like "3.9" or "4,2"
    const noteText = $item.text().match(/(\d)[,.](\d)/)
    if (!noteText) return
    const val = parseFloat(`${noteText[1]}.${noteText[2]}`)
    if (label === 'Presse') press_score = val
    if (label === 'Spectateurs') audience_score = val
  })

  // Poster URL — prefer data-src (lazy-loaded), fall back to src
  // AlloCiné uses full https:// URLs; don't prefix with 'https:'
  const imgEl = $card.find('img.thumbnail-img')
  const posterSrc = imgEl.attr('data-src') || imgEl.attr('src') || null
  const poster_url = (posterSrc && !posterSrc.startsWith('data:'))
    ? (posterSrc.startsWith('//') ? `https:${posterSrc}` : posterSrc).replace(/r_\d+_\d+/, POSTER_SIZE)
    : null

  // Showtimes: { "En VF": ["15h45", "17h50"], "En VO": [...] }
  const showtimes: Record<string, string[]> = {}
  $card.find('.showtimes-version').each((_, ver) => {
    const $ver = $(ver)
    const label = $ver.find('.text').text().trim() || 'VF'
    const times: string[] = []
    $ver.find('.showtimes-hour-item-value').each((_, t) => {
      const raw = $(t).text().trim() // e.g. "15:45"
      if (raw) times.push(raw.replace(':', 'h'))
    })
    if (times.length > 0) showtimes[label] = times
  })

  return {
    allocine_id,
    title,
    allocine_url: `${ALLOCINE_BASE}${href}`,
    poster_url,
    year,
    duration,
    genres,
    countries,
    director,
    actors,
    age_rating,
    age_banned,
    press_score,
    audience_score,
    trailer_url: null,
    showtimes,
  }
}

async function scrapeShowtimes(cinema: CinemaConfig): Promise<FilmEntry[]> {
  const url = `${ALLOCINE_BASE}/seance/salle_gen_csalle=${cinema.id}.html`
  console.log(`  → Scraping ${cinema.name} (${cinema.id})`)

  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const films: FilmEntry[] = []
  const seen = new Set<string>()

  $('.entity-card').each((_, card) => {
    const entry = parseFilmCard($, card)
    if (!entry) return
    if (seen.has(entry.allocine_id)) return
    seen.add(entry.allocine_id)
    films.push(entry)
  })

  return films
}

function getWeekDate(): string {
  // Returns the most recent Wednesday (or today if Wednesday) in YYYY-MM-DD
  const now = new Date()
  const dow = now.getDay() // 0=Sun, 3=Wed
  const diff = (dow + 7 - 3) % 7  // days since last Wednesday
  const wed = new Date(now)
  wed.setDate(now.getDate() - diff)
  return wed.toISOString().slice(0, 10)
}

async function main() {
  const week_date = process.argv[2] ?? getWeekDate()
  console.log(`\n🎬 Scraping week of ${week_date}`)

  // Collect all films across cinemas
  const filmMap = new Map<string, { entry: FilmEntry; cinemas: Cinema[] }>()

  for (const cinema of CINEMAS) {
    try {
      const films = await scrapeShowtimes(cinema)
      for (const film of films) {
        // Filter excluded genres
        if (film.genres.some(g => EXCLUDED_GENRES.includes(g))) continue

        const existing = filmMap.get(film.allocine_id)
        const cinemaEntry: Cinema = { name: cinema.name, type: cinema.type, note: cinema.note, showtimes: film.showtimes }

        if (existing) {
          existing.cinemas.push(cinemaEntry)
        } else {
          filmMap.set(film.allocine_id, { entry: film, cinemas: [cinemaEntry] })
        }
      }
    } catch (err) {
      console.error(`  ✗ Failed ${cinema.name}:`, err)
    }
    await sleep(DELAY_MS)
  }

  console.log(`\nFound ${filmMap.size} unique films`)

  // Build Film records and upsert
  const rows: Omit<Film, 'id'>[] = []
  for (const { entry, cinemas } of filmMap.values()) {
    const combined_score = calculateCombinedScore(entry.press_score, entry.audience_score)
    const score_tier = getScoreTier(combined_score)

    rows.push({
      week_date,
      title: entry.title,
      allocine_id: entry.allocine_id,
      allocine_url: entry.allocine_url,
      poster_url: entry.poster_url,
      year: entry.year,
      duration: entry.duration,
      genres: entry.genres,
      countries: entry.countries,
      director: entry.director,
      actors: entry.actors,
      age_rating: entry.age_rating,
      age_banned: entry.age_banned,
      press_score: entry.press_score,
      audience_score: entry.audience_score,
      combined_score,
      score_tier,
      prizes: null,       // set manually in Supabase if desired
      trailer_url: null,
      cinemas,
    })
  }

  // Sort by combined score descending
  rows.sort((a, b) => b.combined_score - a.combined_score)

  // Preserve existing prizes — fetch them before upserting
  const { data: existingRows } = await supabase
    .from('weekly_films')
    .select('allocine_id, prizes')
    .eq('week_date', week_date)
  const existingPrizes = new Map(existingRows?.map(r => [r.allocine_id, r.prizes]) ?? [])
  for (const row of rows) {
    if (existingPrizes.has(row.allocine_id)) {
      row.prizes = existingPrizes.get(row.allocine_id) ?? null
    }
  }

  console.log(`\nUpserting ${rows.length} rows to Supabase...`)
  const { error } = await supabase
    .from('weekly_films')
    .upsert(rows, { onConflict: 'week_date,allocine_id' })

  if (error) {
    console.error('Supabase error:', error)
    process.exit(1)
  }

  console.log('✓ Done')
  for (const row of rows.slice(0, 5)) {
    console.log(`  ${row.combined_score.toFixed(2)}  ${row.title}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
