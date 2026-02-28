import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'
import { searchNdlByKeywords, NdlSearchQuery, NdlCandidate } from '@/lib/ndl'

export const maxDuration = 60

// gemini-2.0-flash は 1500 RPD なので日次制限チェック不要

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('resource exhausted') ||
    msg.includes('billing') ||
    msg.includes('429')
  )
}

async function selectRelevantBooks(
  candidates: NdlCandidate[],
  bookTitle: string,
  summary: string,
  genAI: GoogleGenerativeAI
): Promise<{ title: string; author: string; publisher: string; year: string; isbn: string; reason: string; category: '入門' | '発展' }[]> {
  const numbered = candidates.map((c, i) => ({
    index: i,
    title: c.title,
    authors: c.authors.join('、'),
    publisher: c.publisher,
    year: c.year,
    searchIntent: c.searchIntent,
  }))

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })

  const prompt = `あなたは読書アドバイザーです。ユーザーが「${bookTitle}」を読もうとしています。

■ この本の概要
${summary}

以下はNDL（国立国会図書館）から取得した書籍候補リストです。各候補の searchIntent はその本が検索された意図です。

${JSON.stringify(numbered, null, 2)}

この中から「入門書」を必ず2冊、「発展書」を必ず2冊、合計4冊選んでください。

■ カテゴリの定義
- 入門（入門書）: 「${bookTitle}」を読む前に前提知識を補える教科書・入門書・新書。その分野の基礎を平易に解説しているもの。
- 発展（発展書）: 同じテーマをより深く扱う専門書、著者の他の重要著作、知的系譜をたどれる古典・影響源。「${bookTitle}」を読んだ後に進むべき本。

■ 選書の最優先基準
- 対象書籍「${bookTitle}」のテーマと直接関連する本を最優先せよ。
- 分野全般の概論より、対象書籍が扱う具体的なテーマに即した本を選べ。
- 各候補の searchIntent を参考にし、その意図に合ったカテゴリ（入門 or 発展）に分類せよ。

■ その他の優先基準
- 同程度の候補なら出版年が新しい方を優先せよ。ただし分野の古典的名著は例外として許容する。
- 単著を優先せよ。

■ 絶対に選んではいけない本
全集、辞典、事典、ハンドブック、年鑑、白書、統計集、雑誌、紀要、論文集、講座もの、シリーズ全巻セット。
タイトルに「全集」「辞典」「事典」「ハンドブック」「年鑑」「白書」「講座」「紀要」「研究報告」が含まれる本は選ぶな。

以下のJSON配列のみを返してください：
[{"index": 0, "reason": "選んだ理由を2〜3文で", "category": "入門"}]

注意：
- index は上記リストの index をそのまま使うこと
- category は必ず "入門" または "発展" のどちらかにすること
- reason は具体的に書くこと（「関連がある」だけでは不十分）
- 明らかに無関係な本は選ばないこと`

  const response = await model.generateContent(prompt)
  const text = response.response.text()
  const selections = JSON.parse(text) as { index: number; reason: string; category: '入門' | '発展' }[]

  return selections
    .filter(s => s.index >= 0 && s.index < candidates.length)
    .filter(s => s.category === '入門' || s.category === '発展')
    .slice(0, 4)
    .map(s => {
      const c = candidates[s.index]
      return {
        title: c.title,
        author: c.authors.join('、'),
        publisher: c.publisher,
        year: c.year,
        isbn: c.isbn,
        reason: s.reason,
        category: s.category,
      }
    })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません' }, { status: 500 })
  }

  const guide = await prisma.guide.findUnique({ where: { id } })
  if (!guide) {
    return NextResponse.json({ error: 'ガイドが見つかりません' }, { status: 404 })
  }

  const prereqs = guide.prerequisites as Record<string, unknown> | undefined
  const queries = prereqs?.ndlSearchQueries as NdlSearchQuery[] | undefined

  if (!queries?.length) {
    return NextResponse.json({ error: '検索クエリがありません' }, { status: 400 })
  }

  try {
    const candidates = await searchNdlByKeywords(queries)
    if (candidates.length === 0) {
      return NextResponse.json({ error: 'NDL から候補書籍が見つかりませんでした' }, { status: 404 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const recommendedResources = await selectRelevantBooks(
      candidates,
      guide.title,
      guide.summary || '',
      genAI
    )

    // ガイドの prerequisites を更新
    const updatedPrereqs = { ...prereqs, recommendedResources }
    await prisma.guide.update({
      where: { id },
      data: { prerequisites: updatedPrereqs },
    })

    return NextResponse.json({ recommendedResources })
  } catch (error) {
    if (isQuotaError(error)) {
      return NextResponse.json(
        { error: 'Gemini API の利用制限に達しました。2〜3分ほど待ってから再度お試しください。' },
        { status: 429 }
      )
    }
    console.error('[recommend] failed:', error)
    const message = error instanceof Error ? error.message : '不明なエラー'
    return NextResponse.json({ error: `推薦エラー: ${message}` }, { status: 500 })
  }
}
