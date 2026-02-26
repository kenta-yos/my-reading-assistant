import { NextRequest, NextResponse } from 'next/server'
import { type BookResult, parseRecords } from '@/lib/ndl'

export type BookCandidate = BookResult & { id: string }

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json([])

  const query = `title%3D${encodeURIComponent(`"${q}"`)}`
  const url =
    `https://ndlsearch.ndl.go.jp/api/sru` +
    `?operation=searchRetrieve` +
    `&query=${query}` +
    `&maximumRecords=15` +
    `&recordSchema=dcndl`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    })
    const xml = await res.text()
    const books: BookCandidate[] = parseRecords(xml).map((b, i) => ({
      ...b,
      id: String(i),
    }))
    return NextResponse.json(books.slice(0, 8))
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
