export interface VerifiedBook {
  title: string
  author: string
  publisher: string
  year: string
  price: string
}

interface OpenBDSummary {
  isbn?: string
  title?: string
  author?: string
  publisher?: string
  pubdate?: string
}

interface OpenBDPrice {
  PriceAmount?: string
}

interface OpenBDSupplyDetail {
  Price?: OpenBDPrice[]
}

interface OpenBDProductSupply {
  SupplyDetail?: OpenBDSupplyDetail
}

interface OpenBDOnix {
  ProductSupply?: OpenBDProductSupply
}

interface OpenBDItem {
  summary?: OpenBDSummary
  onix?: OpenBDOnix
}

/**
 * OpenBD API で ISBN の実在を確認し、正確なメタデータを返す。
 * 存在しない ISBN は Map に含まれない。
 * タイムアウトや通信エラー時は空 Map を返す（グレースフルデグレード）。
 */
/**
 * タイトルを正規化して比較用の文字列にする。
 * 括弧・スペース・記号を除去し、小文字化する。
 */
function normalizeTitle(title: string): string {
  return title
    .replace(/[\s　]+/g, '')        // 全角・半角スペース除去
    .replace(/[（()）\[\]【】「」『』〈〉《》]/g, '') // 括弧類除去
    .replace(/[：:・、。,.―─\-–—]/g, '')  // 区切り記号除去
    .toLowerCase()
}

/**
 * AI が生成したタイトルと OpenBD のタイトルが同じ書籍を指しているか判定する。
 * どちらかが他方を含んでいれば一致とみなす。
 */
export function titleMatches(aiTitle: string, openbdTitle: string): boolean {
  const a = normalizeTitle(aiTitle)
  const b = normalizeTitle(openbdTitle)
  if (!a || !b) return false
  return a.includes(b) || b.includes(a)
}

export async function verifyISBNs(isbns: string[]): Promise<Map<string, VerifiedBook>> {
  const result = new Map<string, VerifiedBook>()

  if (isbns.length === 0) return result

  try {
    const url = `https://api.openbd.jp/v1/get?isbn=${isbns.join(',')}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })

    if (!res.ok) return result

    const data: (OpenBDItem | null)[] = await res.json()

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      if (!item?.summary) continue

      const isbn = isbns[i]
      const s = item.summary

      // pubdate ("202501" or "1969-01") → 先頭4文字で year 抽出
      const year = s.pubdate ? s.pubdate.slice(0, 4) : ''

      // author の "姓,名" → "姓 名" に変換
      const author = s.author
        ? s.author.replace(/,/g, ' ')
        : ''

      // onix.ProductSupply.SupplyDetail.Price[0].PriceAmount から価格取得
      const priceAmount =
        item.onix?.ProductSupply?.SupplyDetail?.Price?.[0]?.PriceAmount

      const price = priceAmount ? `${priceAmount}円（税込）` : ''

      result.set(isbn, {
        title: s.title || '',
        author,
        publisher: s.publisher || '',
        year,
        price,
      })
    }
  } catch {
    // タイムアウト・ネットワークエラー → 空 Map（グレースフルデグレード）
    return new Map()
  }

  return result
}
