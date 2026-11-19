import { type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { runScraper, getWeekDate } from '@/lib/scraper'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekDate = req.nextUrl.searchParams.get('week_date') ?? getWeekDate()
  const logs: string[] = []
  const log = (msg: string) => { console.log(msg); logs.push(msg) }

  try {
    const result = await runScraper(weekDate, { delayMs: 100, log })
    revalidatePath('/')
    return Response.json({ ok: true, ...result, logs })
  } catch (err) {
    console.error('[scrape] fatal:', err)
    return Response.json({ ok: false, error: String(err), logs }, { status: 500 })
  }
}
