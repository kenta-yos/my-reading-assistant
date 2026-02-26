export type BookResult = {
  title: string
  authors: string[]
  publisher: string
  year: string
  isbn: string
}

export function htmlDecode(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export function extractAll(xml: string, fullTag: string): string[] {
  const results: string[] = []
  const regex = new RegExp(`<${fullTag}(?:\\s[^>]*)?>([^<]+)</${fullTag}>`, 'g')
  let m
  while ((m = regex.exec(xml)) !== null) {
    const val = m[1].trim()
    if (val) results.push(val)
  }
  return results
}

export function extractFirst(xml: string, fullTag: string): string {
  return extractAll(xml, fullTag)[0] ?? ''
}

export const LIBRARY_SUFFIXES = ['図書館', '図書室', '図書センター', '資料館', 'ライブラリー']

export function extractPublisher(foafNames: string[]): string {
  for (const name of foafNames) {
    if (name.includes(',')) continue
    if (LIBRARY_SUFFIXES.some(s => name.endsWith(s))) continue
    if (name === '国立国会図書館') continue
    return name.trim()
  }
  return ''
}

export function cleanAuthorName(raw: string): string {
  return raw
    .replace(/\s*[,，]\s*.*$/, '')
    .replace(/\s+(?:著|訳|編|監修|著者|文|絵|写真|選|校|注|解説|原著).*/u, '')
    .replace(/\[.*?\]/g, '')
    .trim()
}

export function parseRecords(sruXml: string): BookResult[] {
  const books: BookResult[] = []
  const recordRegex = /<recordData>([\s\S]*?)<\/recordData>/g
  let match

  while ((match = recordRegex.exec(sruXml)) !== null) {
    const inner = htmlDecode(match[1])

    const descriptions = extractAll(inner, 'dcterms:description')
    const isBook = descriptions.some(d => d.includes('type : book'))
    if (!isBook) continue

    const title = extractFirst(inner, 'dcterms:title')
    if (!title) continue

    const authors = extractAll(inner, 'dc:creator')
      .map(cleanAuthorName)
      .filter(Boolean)

    const foafNames = extractAll(inner, 'foaf:name')
    const publisher = extractPublisher(foafNames)

    const year = extractFirst(inner, 'dcterms:issued').replace(/-.*$/, '')

    const isbnMatch = inner.match(/<dcterms:identifier[^>]*ISBN[^>]*>([^<]+)</)
    const isbn = isbnMatch?.[1]?.trim() ?? ''

    books.push({ title, authors, publisher, year, isbn })
  }

  return books
}

type RelatedBookQuery = {
  query: string
  reason: string
}

type RecommendedBook = {
  title: string
  author: string
  publisher: string
  year: string
  isbn: string
  reason: string
}

export async function searchRelatedBooks(
  queries: RelatedBookQuery[]
): Promise<RecommendedBook[]> {
  if (!queries?.length) return []

  const results = await Promise.allSettled(
    queries.map(async ({ query, reason }) => {
      const url =
        `https://ndlsearch.ndl.go.jp/api/sru` +
        `?operation=searchRetrieve` +
        `&query=title%3D${encodeURIComponent(`"${query}"`)}` +
        `&maximumRecords=3` +
        `&recordSchema=dcndl`

      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      })
      const xml = await res.text()
      const books = parseRecords(xml)

      if (books.length === 0) return null

      const book = books[0]
      return {
        title: book.title,
        author: book.authors.join('、'),
        publisher: book.publisher,
        year: book.year,
        isbn: book.isbn,
        reason,
      }
    })
  )

  const books: RecommendedBook[] = []
  const seenIsbns = new Set<string>()

  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const book = result.value
    if (book.isbn && seenIsbns.has(book.isbn)) continue
    if (book.isbn) seenIsbns.add(book.isbn)
    books.push(book)
  }

  return books
}
