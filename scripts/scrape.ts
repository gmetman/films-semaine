import { runScraper, getWeekDate } from '../lib/scraper.js'

const weekDate = process.argv[2] ?? getWeekDate()

runScraper(weekDate, { delayMs: 500 })
  .then(r => console.log(`\n✓ Done: ${r.films} films, ${r.cinemaErrors} errors, ${r.durationMs}ms`))
  .catch(err => { console.error(err); process.exit(1) })
