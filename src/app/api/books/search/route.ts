import { NextResponse } from 'next/server'
import {
  htmlDecode,
  extractAll,
  extractFirst,
  extractPublisher,
  cleanAuthorName,
} from '@/lib/ndl'

export type Candidate = {
  title: string
  author: string
  publisherName: string
  publishedYear: number | null
  pages: number | null
  description: string | null
  thumbnail: string | null
  isbn: string | null
}

type GoogleBooksVolume = {
  volumeInfo?: {
    title?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    pageCount?: number
    description?: string
    industryIdentifiers?: { type: string; identifier: string }[]
    imageLinks?: { smallThumbnail?: string; thumbnail?: string }
    language?: string
  }
}

function extractYear(date: string | undefined): number | null {
  if (!date) return null
  const match = date.match(/(\d{4})/)
  return match ? parseInt(match[1]) : null
}

function extractGoogleIsbn(
  identifiers: { type: string; identifier: string }[] | undefined,
): string | null {
  if (!identifiers) return null
  const isbn13 = identifiers.find((id) => id.type === 'ISBN_13')
  const isbn10 = identifiers.find((id) => id.type === 'ISBN_10')
  return isbn13?.identifier ?? isbn10?.identifier ?? null
}

// --- NDL SRU 検索 ---

async function searchNdl(query: string, isIsbn: boolean): Promise<Candidate[]> {
  try {
    const cql = isIsbn ? `isbn="${query}"` : `anywhere="${query}"`
    const url =
      `https://ndlsearch.ndl.go.jp/api/sru` +
      `?operation=searchRetrieve` +
      `&query=${encodeURIComponent(cql)}` +
      `&maximumRecords=20` +
      `&mediatype=1` +
      `&recordSchema=dcndl`

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const xml = await res.text()

    const candidates: Candidate[] = []
    const recordRegex = /<recordData>([\s\S]*?)<\/recordData>/g
    let match

    while ((match = recordRegex.exec(xml)) !== null) {
      const inner = htmlDecode(match[1])

      const title = extractFirst(inner, 'dcterms:title')
      if (!title) continue

      const isbnMatch = inner.match(/<dcterms:identifier[^>]*ISBN[^>]*>([^<]+)</)
      const isbn = isbnMatch?.[1]?.trim() ?? ''
      if (!isbn) continue

      const authors = extractAll(inner, 'dc:creator')
        .map(cleanAuthorName)
        .filter(Boolean)

      const foafNames = extractAll(inner, 'foaf:name')
      const publisher = extractPublisher(foafNames)

      const yearStr = extractFirst(inner, 'dcterms:issued').replace(/-.*$/, '')
      const publishedYear = yearStr ? extractYear(yearStr) : null

      candidates.push({
        title,
        author: authors.join('／'),
        publisherName: publisher,
        publishedYear,
        pages: null,
        description: null,
        thumbnail: null,
        isbn,
      })
    }

    return candidates
  } catch {
    return []
  }
}

// --- 重複判定ヘルパー ---

/** ISBN-10 → ISBN-13 に正規化（比較用） */
function normalizeIsbn(isbn: string): string {
  const cleaned = isbn.replace(/[^0-9X]/gi, '')
  if (cleaned.length === 13) return cleaned
  if (cleaned.length === 10) {
    const base = '978' + cleaned.slice(0, 9)
    let sum = 0
    for (let i = 0; i < 12; i++) sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3)
    const check = (10 - (sum % 10)) % 10
    return base + check
  }
  return cleaned
}

/** タイトルを正規化して比較用キーを生成 */
function normalizeTitle(title: string): string {
  return title
    .replace(/[\s\u3000]+/g, '')          // 空白除去
    .replace(/[（(].*?[）)]/g, '')         // 括弧内除去
    .replace(/[=＝:：].*/g, '')            // サブタイトル除去
    .replace(/[第新改訂増補版]+版$/g, '')   // 版表記除去
    .toLowerCase()
}

// --- 日本語判定 ---

function isJapaneseCandidate(c: Candidate): boolean {
  const text = `${c.title}${c.author}${c.publisherName}`
  return /[\u3000-\u9FFF\uF900-\uFAFF]/.test(text)
}

function isJapaneseVolume(vol: GoogleBooksVolume['volumeInfo']): boolean {
  if (!vol) return false
  if (vol.language === 'ja') return true
  const text = `${vol.title ?? ''}${vol.authors?.join('') ?? ''}${vol.publisher ?? ''}`
  return /[\u3000-\u9FFF\uF900-\uFAFF]/.test(text)
}

// --- メインハンドラ ---

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ candidates: [] })
  }

  // ISBN検索の場合、Google Booksで見つからなければOpenBDでタイトルを取得して再検索
  let searchQuery = q
  const isbnMatch = q.match(/^isbn[:\s]*(\d{10,13})$/i)
  const isIsbn = !!isbnMatch

  // NDL検索を先に発火（並行実行）
  const ndlPromise = searchNdl(
    isIsbn ? isbnMatch![1] : q.replace(/[\u3000\u00A0]/g, ' ').replace(/\s+/g, ' ').trim(),
    isIsbn,
  )

  if (isIsbn) {
    const isbn = isbnMatch![1]
    const isbnUrl = new URL('https://www.googleapis.com/books/v1/volumes')
    isbnUrl.searchParams.set('q', `isbn:${isbn}`)
    isbnUrl.searchParams.set('maxResults', '5')
    isbnUrl.searchParams.set('printType', 'books')
    if (process.env.GOOGLE_BOOKS_API_KEY) {
      isbnUrl.searchParams.set('key', process.env.GOOGLE_BOOKS_API_KEY)
    }
    const isbnRes = await fetch(isbnUrl.toString())
    const isbnData = isbnRes.ok ? await isbnRes.json() : { items: [] }

    if (!isbnData.items || isbnData.items.length === 0) {
      try {
        const obdRes = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`)
        if (obdRes.ok) {
          const obdData = await obdRes.json()
          const title = obdData?.[0]?.summary?.title
          if (title) {
            searchQuery = title
          }
        }
      } catch {
        // OpenBDも失敗した場合はISBNのまま検索
      }
    }
  }

  // 全角スペース・連続スペースを正規化
  searchQuery = searchQuery.replace(/[\u3000\u00A0]/g, ' ').replace(/\s+/g, ' ').trim()

  // Google Books API
  const googleUrl = new URL('https://www.googleapis.com/books/v1/volumes')
  googleUrl.searchParams.set('q', searchQuery)
  googleUrl.searchParams.set('maxResults', '20')
  googleUrl.searchParams.set('printType', 'books')
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    googleUrl.searchParams.set('key', process.env.GOOGLE_BOOKS_API_KEY)
  }

  const googlePromise = fetch(googleUrl.toString()).then(async (res) => {
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? []) as GoogleBooksVolume[]
  }).catch(() => [] as GoogleBooksVolume[])

  // Google Books と NDL を同時に待つ
  const [googleResult, ndlResult] = await Promise.allSettled([googlePromise, ndlPromise])

  const googleItems: GoogleBooksVolume[] =
    googleResult.status === 'fulfilled' ? googleResult.value : []
  const ndlCandidates: Candidate[] =
    ndlResult.status === 'fulfilled' ? ndlResult.value : []

  // --- Google Books 候補を Candidate に変換 ---
  const googleCandidates: Candidate[] = []
  const googleSeenIsbns = new Set<string>()

  // 日本語書籍優先 + 新しい順でソート
  const sortedGoogle = [...googleItems].sort((a, b) => {
    const aJa = isJapaneseVolume(a.volumeInfo) ? 0 : 1
    const bJa = isJapaneseVolume(b.volumeInfo) ? 0 : 1
    if (aJa !== bJa) return aJa - bJa
    const aYear = extractYear(a.volumeInfo?.publishedDate) ?? 0
    const bYear = extractYear(b.volumeInfo?.publishedDate) ?? 0
    return bYear - aYear
  })

  for (const item of sortedGoogle) {
    const vol = item.volumeInfo
    if (!vol?.title) continue

    const isbn = extractGoogleIsbn(vol.industryIdentifiers)
    if (isbn) {
      if (googleSeenIsbns.has(isbn)) continue
      googleSeenIsbns.add(isbn)
    }

    const thumbnail =
      vol.imageLinks?.thumbnail ?? vol.imageLinks?.smallThumbnail ?? null

    googleCandidates.push({
      title: vol.title,
      author: vol.authors?.join('／') ?? '',
      publisherName: vol.publisher ?? '',
      publishedYear: extractYear(vol.publishedDate),
      pages: vol.pageCount && vol.pageCount > 0 ? vol.pageCount : null,
      description: vol.description ?? null,
      thumbnail: thumbnail ? thumbnail.replace(/^http:/, 'https:') : null,
      isbn,
    })
  }

  // --- マージ: Google 候補を先に、NDL 候補を追加（ISBN・タイトル重複はGoogle優先） ---
  const mergedCandidates: Candidate[] = [...googleCandidates]
  const mergedNormalizedIsbns = new Set(
    googleCandidates
      .map((c) => c.isbn)
      .filter((isbn): isbn is string => isbn !== null)
      .map(normalizeIsbn),
  )
  const mergedTitles = new Set(
    googleCandidates.map((c) => normalizeTitle(c.title)),
  )

  for (const ndlCandidate of ndlCandidates) {
    if (ndlCandidate.isbn && mergedNormalizedIsbns.has(normalizeIsbn(ndlCandidate.isbn))) continue
    if (mergedTitles.has(normalizeTitle(ndlCandidate.title))) continue
    if (ndlCandidate.isbn) mergedNormalizedIsbns.add(normalizeIsbn(ndlCandidate.isbn))
    mergedTitles.add(normalizeTitle(ndlCandidate.title))
    mergedCandidates.push(ndlCandidate)
  }

  // マージ後ソート: 日本語優先 + 新しい順
  mergedCandidates.sort((a, b) => {
    const aJa = isJapaneseCandidate(a) ? 0 : 1
    const bJa = isJapaneseCandidate(b) ? 0 : 1
    if (aJa !== bJa) return aJa - bJa
    const aYear = a.publishedYear ?? 0
    const bYear = b.publishedYear ?? 0
    return bYear - aYear
  })

  // 上位8件に絞る
  const candidates = mergedCandidates.slice(0, 8)
  const candidateIsbns = candidates.map((c) => c.isbn)

  if (candidates.length === 0) {
    return NextResponse.json({ candidates: [] })
  }

  // OpenBD 補完
  const validIsbns = candidateIsbns.filter(
    (isbn): isbn is string => isbn !== null,
  )

  if (validIsbns.length > 0) {
    try {
      const openBDRes = await fetch(
        `https://api.openbd.jp/v1/get?isbn=${validIsbns.join(',')}`,
      )
      if (openBDRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const openBDData: Array<any | null> = await openBDRes.json()

        const pagesMap: Record<string, number> = {}
        const descMap: Record<string, string> = {}
        const publisherMap: Record<string, string> = {}

        for (const entry of openBDData) {
          if (!entry) continue
          const entryIsbn = entry.summary?.isbn
          if (!entryIsbn) continue

          if (entry.summary?.pages) {
            const p = parseInt(entry.summary.pages, 10)
            if (!isNaN(p) && p > 0) pagesMap[entryIsbn] = p
          }

          if (entry.summary?.publisher) {
            publisherMap[entryIsbn] = entry.summary.publisher
          }

          const extents: Array<{
            ExtentType?: string
            ExtentValue?: string
          }> = entry.onix?.DescriptiveDetail?.Extent ?? []
          const pageExtent = extents.find((e) => e.ExtentType === '11')
          if (pageExtent?.ExtentValue) {
            const p = parseInt(pageExtent.ExtentValue, 10)
            if (!isNaN(p) && p > 0 && !pagesMap[entryIsbn]) pagesMap[entryIsbn] = p
          }

          const textContents: Array<{ TextType?: string; Text?: string }> =
            entry.onix?.CollateralDetail?.TextContent ?? []
          const detailed = textContents.find((tc) => tc.TextType === '03')
          const short = textContents.find((tc) => tc.TextType === '02')
          const desc = detailed?.Text || short?.Text
          if (desc) descMap[entryIsbn] = desc
        }

        for (let i = 0; i < candidates.length; i++) {
          const isbn = candidateIsbns[i]
          if (!isbn) continue
          if (candidates[i].pages === null && pagesMap[isbn]) {
            candidates[i].pages = pagesMap[isbn]
          }
          if (!candidates[i].publisherName && publisherMap[isbn]) {
            candidates[i].publisherName = publisherMap[isbn]
          }
          if (descMap[isbn]) {
            candidates[i].description = descMap[isbn]
          }
        }
      }
    } catch {
      // OpenBD 失敗時はそのまま返す
    }
  }

  return NextResponse.json({ candidates })
}
