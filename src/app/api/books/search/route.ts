import { NextRequest, NextResponse } from 'next/server'

export type BookCandidate = {
  id: string
  title: string
  authors: string[]
  publisher: string
  year: string
  isbn: string
}

function htmlDecode(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function extractAll(xml: string, fullTag: string): string[] {
  const results: string[] = []
  const regex = new RegExp(`<${fullTag}(?:\\s[^>]*)?>([^<]+)</${fullTag}>`, 'g')
  let m
  while ((m = regex.exec(xml)) !== null) {
    const val = m[1].trim()
    if (val) results.push(val)
  }
  return results
}

function extractFirst(xml: string, fullTag: string): string {
  return extractAll(xml, fullTag)[0] ?? ''
}

const LIBRARY_SUFFIXES = ['図書館', '図書室', '図書センター', '資料館', 'ライブラリー']

// foaf:name の中から出版社を抽出
// ・カンマを含む → 著者名（"姓, 名" 形式）→ スキップ
// ・図書館系サフィックス → 図書館 → スキップ
// ・それ以外の最初の foaf:name → 出版社
function extractPublisher(foafNames: string[]): string {
  for (const name of foafNames) {
    if (name.includes(',')) continue  // 著者名
    if (LIBRARY_SUFFIXES.some(s => name.endsWith(s))) continue  // 図書館
    if (name === '国立国会図書館') continue
    return name.trim()
  }
  return ''
}

// 役割語（著・訳・編・監修等）を除去して名前だけにする
function cleanAuthorName(raw: string): string {
  return raw
    .replace(/\s*[,，]\s*.*$/, '')          // "名前, 訳" → "名前"
    .replace(/\s+(?:著|訳|編|監修|著者|文|絵|写真|選|校|注|解説|原著).*/u, '')
    .replace(/\[.*?\]/g, '')
    .trim()
}

function parseRecords(sruXml: string): BookCandidate[] {
  const books: BookCandidate[] = []
  let pos = 0

  const recordRegex = /<recordData>([\s\S]*?)<\/recordData>/g
  let match

  while ((match = recordRegex.exec(sruXml)) !== null) {
    const inner = htmlDecode(match[1])

    // 書籍のみに絞る（type : book が含まれていないものを除外）
    const descriptions = extractAll(inner, 'dcterms:description')
    const isBook = descriptions.some(d => d.includes('type : book'))
    if (!isBook) continue

    const title = extractFirst(inner, 'dcterms:title')
    if (!title) continue

    const authors = extractAll(inner, 'dc:creator')
      .map(cleanAuthorName)
      .filter(Boolean)

    // publisher は foaf:name の中の "場所 : 出版社" 形式から取得
    const foafNames = extractAll(inner, 'foaf:name')
    const publisher = extractPublisher(foafNames)

    // 出版年: "2016" or "2016-09" → "2016"
    const year = extractFirst(inner, 'dcterms:issued').replace(/-.*$/, '')

    // ISBN
    const isbnMatch = inner.match(/<dcterms:identifier[^>]*ISBN[^>]*>([^<]+)</)
    const isbn = isbnMatch?.[1]?.trim() ?? ''

    books.push({ id: String(pos++), title, authors, publisher, year, isbn })
  }

  return books
}

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
    const books = parseRecords(xml)
    return NextResponse.json(books.slice(0, 8))
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
