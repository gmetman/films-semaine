import { NextRequest } from 'next/server'

const ALLOWED = [
  'fr.web.img2.acsta.net',
  'fr.web.img3.acsta.net',
  'fr.web.img4.acsta.net',
  'fr.web.img5.acsta.net',
  'fr.web.img6.acsta.net',
  'img.acsta.net',
]

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get('url')
  if (!src) return new Response('missing url', { status: 400 })

  let parsed: URL
  try { parsed = new URL(src) } catch { return new Response('invalid url', { status: 400 }) }
  if (!ALLOWED.includes(parsed.hostname)) return new Response('blocked', { status: 403 })

  try {
    const res = await fetch(src, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.allocine.fr/',
        'Accept': 'image/webp,image/apng,image/*',
      },
    })
    if (!res.ok) return new Response('upstream', { status: 502 })
    const buf = await res.arrayBuffer()
    return new Response(buf, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  } catch {
    return new Response('error', { status: 502 })
  }
}
