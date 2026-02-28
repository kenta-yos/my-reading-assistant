import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'
import { searchNdlByKeywords, NdlSearchQuery, NdlCandidate } from '@/lib/ndl'

export const maxDuration = 60

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
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.2 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
  })

  const prompt = `あなたは読書アドバイザーです。ユーザーが「${bookTitle}」を読もうとしています。

■ この本の概要
${summary}

以下はNDL（国立国会図書館）から取得した書籍候補リストです。各候補の searchIntent はその本が検索された意図です。

${JSON.stringify(numbered, null, 2)}

■ あなたのタスク
1. まずGoogle検索を使い、「${bookTitle}」の内容・テーマ・著者の主張を正確に把握せよ。
2. 次に、候補リストの中で知らない本・判断に迷う本があればGoogle検索で内容を確認せよ。
3. その上で「入門書」を必ず3冊、「発展書」を必ず3冊、合計6冊選べ。

■ カテゴリの定義
- 入門（入門書）: 「${bookTitle}」を読む前に前提知識を補える教科書・入門書・新書。その分野の基礎を平易に解説しているもの。
- 発展（発展書）: 同じテーマをより深く扱う専門書、著者の他の重要著作、知的系譜をたどれる古典・影響源。「${bookTitle}」を読んだ後に進むべき本。

■ 選書の最優先基準
- 対象書籍「${bookTitle}」のテーマと直接関連する本を最優先せよ。
- 分野全般の概論より、対象書籍が扱う具体的なテーマに即した本を選べ。
- 各候補の searchIntent を参考にし、その意図に合ったカテゴリ（入門 or 発展）に分類せよ。
- 候補の内容が不明な場合はGoogle検索で確認し、的外れな本を選ばないこと。

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
- reason は具体的に書くこと（「関連がある」だけでは不十分。Google検索で確認した内容に基づき、なぜこの本がこの対象書籍の入門/発展として適切かを述べよ）
- 明らかに無関係な本は選ばないこと
- 必ずJSON配列のみを返すこと。コードブロック記法や追加テキストは含めないこと`

  const response = await model.generateContent(prompt)
  const text = response.response.text()

  // JSON配列を抽出（コードブロックやテキストが混入する場合に対応）
  let jsonText = text
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) {
    jsonText = codeBlock[1].trim()
  } else {
    const arrayMatch = text.match(/\[[\s\S]*\]/)
    if (arrayMatch) jsonText = arrayMatch[0]
  }
  const raw = JSON.parse(jsonText) as { index: number; reason: string; category: '入門' | '発展' }[]

  // Google検索グラウンディングの引用マーカーを除去
  const selections = raw.map(s => ({
    ...s,
    reason: s.reason
      .replace(/\s*\[\d+(?:,\s*\d+)*\]\s*$/g, '')
      .replace(/\[\d+\]/g, '')
      .trim(),
  }))

  // 同じ候補が複数回選ばれた場合は最初の1つだけ残す
  const seenIndices = new Set<number>()
  const unique = selections.filter(s => {
    if (seenIndices.has(s.index)) return false
    seenIndices.add(s.index)
    return true
  })

  return unique
    .filter(s => s.index >= 0 && s.index < candidates.length)
    .filter(s => s.category === '入門' || s.category === '発展')
    .slice(0, 6)
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

  // SSE ストリームで進捗を返す
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        if (!process.env.GEMINI_API_KEY) {
          send('error', { error: 'GEMINI_API_KEY が設定されていません' })
          controller.close()
          return
        }

        send('progress', { step: 'loading', message: 'ガイド情報を読み込み中…' })

        const guide = await prisma.guide.findUnique({ where: { id } })
        if (!guide) {
          send('error', { error: 'ガイドが見つかりません' })
          controller.close()
          return
        }

        const prereqs = guide.prerequisites as Record<string, unknown> | undefined
        const queries = prereqs?.ndlSearchQueries as NdlSearchQuery[] | undefined

        if (!queries?.length) {
          send('error', { error: '検索クエリがありません' })
          controller.close()
          return
        }

        // Step 1: NDL検索
        send('progress', { step: 'ndl', message: '関連書籍を探しています…' })
        const candidates = await searchNdlByKeywords(queries)

        if (candidates.length === 0) {
          send('error', { error: 'NDL から候補書籍が見つかりませんでした' })
          controller.close()
          return
        }

        send('progress', { step: 'ndl_done', message: `${candidates.length}冊の候補が見つかりました` })

        // Step 2: AI選書
        send('progress', { step: 'ai', message: 'AIが候補を評価中…' })
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const recommendedResources = await selectRelevantBooks(
          candidates,
          guide.title,
          guide.summary || '',
          genAI
        )

        // DB更新
        send('progress', { step: 'saving', message: '結果を保存中…' })
        const updatedPrereqs = { ...prereqs, recommendedResources }
        await prisma.guide.update({
          where: { id },
          data: { prerequisites: updatedPrereqs },
        })

        send('done', { recommendedResources })
        controller.close()
      } catch (error) {
        if (isQuotaError(error)) {
          send('error', { error: 'Gemini API の利用制限に達しました。2〜3分ほど待ってから再度お試しください。' })
        } else {
          console.error('[recommend] failed:', error)
          const message = error instanceof Error ? error.message : '不明なエラー'
          send('error', { error: `推薦エラー: ${message}` })
        }
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
