import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'
import { cleanupExpiredGuides } from '@/lib/cleanup'


export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// 1日の上限（gemini-2.0-flash 無料枠は1500 RPD）
const DAILY_LIMIT = 200

// JST（UTC+9）の今日の日付を返す
function getTodayJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

// Gemini の quota/課金系エラーかどうかを判定
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

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20000)
}

// Google検索グラウンディングの引用マーカーを除去
function stripCitations(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj
      .replace(/\s*\[\d+(?:,\s*\d+)*\]\s*$/g, '')  // 末尾の [2, 4, 7] 形式
      .replace(/\[\d+\]/g, '')                        // 文中の [1] 形式
      .trim()
  }
  if (Array.isArray(obj)) return obj.map(stripCitations)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, stripCitations(v)])
    )
  }
  return obj
}

function parseJsonResponse(text: string): object {
  let parsed: object
  try {
    parsed = JSON.parse(text)
  } catch {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      parsed = JSON.parse(codeBlockMatch[1].trim())
    } else {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSONの解析に失敗しました')
      }
    }
  }
  return stripCitations(parsed) as object
}

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY が設定されていません' },
      { status: 500 }
    )
  }

  const body = await request.json()
  const { inputType, inputValue, bookMetadata } = body as {
    inputType: string
    inputValue: string
    bookMetadata?: {
      title: string
      authors: string[]
      publisher: string
      year: string
      isbn: string
    }
  }

  if (!inputType || !inputValue?.trim()) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 })
  }

  // ── キャッシュチェック（同じ入力のガイドが既にあれば返す）──
  const normalizedInput = inputValue.trim()
  let cached = await prisma.guide.findFirst({
    where: { inputType, inputValue: normalizedInput },
    orderBy: { createdAt: 'desc' },
  })
  // 書籍の場合はISBNでもチェック（タイトル表記揺れをカバー）
  if (!cached && inputType === 'BOOK_TITLE' && bookMetadata?.isbn) {
    const allBookGuides = await prisma.guide.findMany({
      where: { inputType: 'BOOK_TITLE' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    cached = allBookGuides.find((g) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = (g.prerequisites as any)?.bookMetadata
      return meta?.isbn === bookMetadata.isbn
    }) ?? null
  }
  if (cached) {
    return NextResponse.json(cached)
  }
  // ──────────────────────────────────────────────────────

  // ── 使用量チェック ──────────────────────────────────────
  const today = getTodayJST()
  const usage = await prisma.apiUsage.findUnique({ where: { date: today } })

  if ((usage?.count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: `本日の上限（${DAILY_LIMIT}回）に達しました。今日はここまでです。明日またお試しください。`,
      },
      { status: 429 }
    )
  }
  // ──────────────────────────────────────────────────────

  let contentContext = ''

  if (inputType === 'URL') {
    try {
      const response = await fetch(inputValue, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ReadingGuideBot/1.0)' },
        signal: AbortSignal.timeout(10000),
      })
      const html = await response.text()
      contentContext = extractTextFromHtml(html)
    } catch {
      contentContext = ''
    }
  }

  const systemPrompt = `あなたは読書の専門家です。難しい本や記事に挑む読者のために「前提知識ガイド」を作成します。

読者が本を読めない理由は主に4つあります：
1. 専門用語の意味を知らない
2. その領域のコンテクスト（歴史・出来事・問題意識）を知らない
3. 高校レベルの基礎知識（理科・社会・数学・哲学など）が抜けている
4. そもそもその本が何を主張しているか全体像がわかっていない

この4点を軸に、著者情報・思考の枠組み・知的系譜を加えたガイドを作ります。
さらに、読者が「読むかどうか判断する」段階と「読む準備をする」段階を意識して、ガイドを構成します。

■ 文体ルール
- 配列で返す項目（problemFocus, coreQuestions, uniqueness, postReadingOutcome, difficultyBarriers）は「ですます調」を使わず、体言止めや簡潔な言い切りで書くこと。情報量は減らさず、表現だけ引き締める。
  良い例：「18世紀フランスの身分制度を前提とした議論が続く」
  悪い例：「18世紀フランスの身分制度を前提とした議論が続きます」

必ず以下の形式のJSONのみを返してください。コードブロック記法・追加テキスト・引用マーカー（[1]など）は含めないでください。

{
  "title": "コンテンツの正式名称",
  "summary": "この本/記事が何を主張しているか、どんな問いに答えようとしているかの全体像（4〜6文。読む前に「地図」として機能する記述にすること）",
  "prerequisites": {
    "problemFocus": ["この本が扱うテーマ・問題意識を箇条書きで3〜5項目。各項目は1文で簡潔に。なぜこのテーマが重要か、なぜ今読むべきかが伝わるようにすること"],
    "coreQuestions": ["この本が答えようとしている核心的な問いを、疑問文の形で3〜5つ列挙する。抽象的なテーマ名ではなく、読者が『たしかにそれ知りたい』と感じる具体的な問いにすること（例：『なぜ日本の生産性は30年間上がらなかったのか？』『経済成長なき社会で人は何を目指して働くのか？』）"],
    "uniqueness": ["この本ならではの独自性・切り口を箇条書きで3〜4項目。各項目は1文で、『一般的には○○だが、この本は△△』のように対比で書くこと。他書の具体的な書名は出さない。ただし同じ著者の過去の著作と比較する場合に限り書名を出してよい"],
    "postReadingOutcome": ["読了後に得られるものを箇条書きで3〜5項目。各項目は1文で簡潔に。どんな視点・思考の枠組みが手に入るか、世界がどう違って見えるかを具体的に"],
    "recommendedFor": ["この本をおすすめしたい具体的な読者像を3〜5項目で箇条書き。『○○な人』の形で、職業・関心・状況を具体的に書くこと（例：『教育政策に関心があるが専門書は初めての人』『部下のマネジメントに悩んでいる中間管理職』『哲学に興味はあるが何から読めばいいかわからない大学生』）"],
    "difficultyLevel": 3,
    "difficultyBarriers": ["この本を読むときに少し手こずるかもしれないポイントを3〜5項目で箇条書き。読者を脅すのではなく、『ここは最初ちょっと戸惑うかもしれないけど、こうすれば大丈夫』という応援のトーンで書くこと。抽象的な分類ではなく、この本固有の具体的なポイントを挙げる（例：『著者独自の造語が多いので、最初は用語集を手元に置きながら読むと楽』『微分方程式が出てくる章があるが、数式の結論だけ追えば議論の流れはつかめる』『18世紀フランスの政治体制が前提になっている箇所があるので、第2章の前にざっくり予習しておくとスムーズ』）。入門書なら『丁寧な語り口で、予備知識なしでそのまま楽しめる一冊』のように1項目は返すこと"],
    "terminology": [
      {"term": "専門用語", "definition": "この本の文脈での意味と重要性（2〜3文）。この本の中で著者が実際に使っている用語、または著者の議論を理解するために不可欠な概念に限ること"}
    ],
    "domainContext": {
      "overview": "この本が書かれた直接的な背景・問題状況（4〜6文）。分野全般の通史ではなく、著者がなぜこの本を書く必要があったのか、どんな議論や状況に応答しているのかを具体的に書く",
      "keyEvents": [
        {"event": "出来事・転換点の名称", "significance": "この出来事がこの本の議論にどう直結するかを3〜4文で説明。この本が直接言及・前提としている出来事に限ること"}
      ]
    },
"aboutAuthor": "著者の経歴・専門・主要著作（3〜4文）",
    "intellectualLineage": "著者の思考の枠組み、影響を受けた思想家・著作、この本が暗黙に対話している論者や学派（3〜5文）",
    "ndlSearchQueries": [
      {"keywords": ["キーワード1", "キーワード2"], "intent": "この検索の意図"}
    ]
  }
}

difficultyLevel は1〜5の整数で返すこと：
1 = 入門（前提知識不要・一般向け）
2 = 初級（一般常識があれば読める）
3 = 中級（大学教養レベルの基礎知識が必要）
4 = 上級（その分野の専門的な予備知識が必要）
5 = 専門（大学院レベル・研究者向け）

ndlSearchQueries は4〜6項目。各項目の keywords は2〜3語の配列。具体的な書名を含めるな。
入門書を見つけるためのクエリ（例: ["教育社会学", "入門"]、["社会学", "教科書"]）を2〜3項目、発展書を見つけるためのクエリ（例: 著者名+テーマ、関連する専門概念）を2〜3項目、意識的に分けて生成せよ。intent にはその検索の意図（入門書を探す／発展書を探す）を明記すること。

■ 項目数の厳守（これより少ないと不十分）
- terminology: 必ず10〜15項目
- keyEvents: 必ず3〜6項目
- problemFocus: 必ず3〜5項目
- coreQuestions: 必ず3〜5項目
- uniqueness: 必ず3〜4項目
- postReadingOutcome: 必ず3〜5項目
- difficultyBarriers: 必ず3〜5項目
- recommendedFor: 必ず3〜5項目
項目数を節約するな。指定の下限を下回ることは許容しない。

■ 精度に関する最重要ルール
- terminology は「この本の中で著者が実際に使っているキーワード」または「著者の議論を追うために不可欠な概念」だけを挙げよ。その分野で一般的に重要でも、この本の議論に直接登場しない用語は含めるな。
- domainContext の overview と keyEvents は「この本が直接扱っている文脈」に限定せよ。その分野の通史や一般的な歴史を書くな。著者がこの本の中で前提としている出来事・議論・状況だけを書け。
- 各セクションで「この本の」「この著者の」「この議論の」という限定を常に意識せよ。分野全般の概論に逃げないこと。

keyEvents の significance は「ただ重要」ではなく、その出来事がこの本の具体的にどの議論・どの章と結びつくかを書く。
`

  const userPrompt =
    inputType === 'URL'
      ? `以下のウェブページ/記事の前提知識ガイドを作成してください。

URL: ${inputValue}
${contentContext ? `\nページの内容（抜粋）:\n${contentContext}` : ''}`
      : (() => {
          const meta = bookMetadata
          const lines = [`以下の書籍の前提知識ガイドを作成してください。`, ``, `書籍タイトル: ${inputValue}`]
          if (meta?.authors?.length) lines.push(`著者: ${meta.authors.join('、')}`)
          if (meta?.publisher) lines.push(`出版社: ${meta.publisher}`)
          if (meta?.year) lines.push(`出版年: ${meta.year}年`)
          if (meta?.isbn) lines.push(`ISBN: ${meta.isbn}`)
          return lines.join('\n')
        })()

  // ── Gemini API 呼び出し ────────────────────────────────
  let responseText: string
  try {
    // URL入力は既にページ内容を取得済みなのでGoogle検索グラウンディング不要
    // 書籍タイトルのみの場合はGoogle検索で情報を補完
    const modelConfig: Parameters<typeof genAI.getGenerativeModel>[0] = {
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: { temperature: 0.2 },
    }
    if (inputType !== 'URL') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modelConfig.tools = [{ googleSearch: {} } as any]
    }
    const model = genAI.getGenerativeModel(modelConfig)
    const aiResponse = await model.generateContent(userPrompt)
    const response = aiResponse.response

    // 安全フィルタでブロックされた場合
    const blockReason = response.promptFeedback?.blockReason
    if (blockReason) {
      return NextResponse.json(
        { error: `コンテンツがブロックされました（${blockReason}）。別のURLまたはタイトルでお試しください。` },
        { status: 400 }
      )
    }

    const candidate = response.candidates?.[0]
    const finishReason = candidate?.finishReason
    if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
      return NextResponse.json(
        { error: `AIの応答が中断されました（${finishReason}）。別のURLまたはタイトルでお試しください。` },
        { status: 400 }
      )
    }

    responseText = response.text()
  } catch (error) {
    if (isQuotaError(error)) {
      return NextResponse.json(
        {
          error:
            'Gemini API の利用制限に達しました。2〜3分ほど待ってから再度お試しください。',
        },
        { status: 429 }
      )
    }
    const message = error instanceof Error ? error.message : '不明なエラー'
    return NextResponse.json({ error: `AI生成エラー: ${message}` }, { status: 500 })
  }
  // ──────────────────────────────────────────────────────

  if (!responseText) {
    return NextResponse.json(
      { error: 'AIからの応答が空でした。別のURLまたはタイトルでお試しください。' },
      { status: 500 }
    )
  }

  let guideData: {
    title?: string
    summary?: string
    prerequisites?: object
  }
  try {
    guideData = parseJsonResponse(responseText) as typeof guideData
  } catch {
    return NextResponse.json(
      { error: 'ガイドデータの解析に失敗しました' },
      { status: 500 }
    )
  }

  // 成功時のみカウントをインクリメント
  await prisma.apiUsage.upsert({
    where: { date: today },
    create: { date: today, count: 1 },
    update: { count: { increment: 1 } },
  })

  // 期限切れガイドを非同期でクリーンアップ（失敗しても無視）
  // cleanupExpiredGuides().catch(() => {})

  // 書籍メタデータを prerequisites に保存
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prereqs = (guideData.prerequisites ?? {}) as any
  if (bookMetadata) {
    prereqs.bookMetadata = {
      authors: bookMetadata.authors,
      publisher: bookMetadata.publisher,
      year: bookMetadata.year,
      isbn: bookMetadata.isbn,
    }
  }

  const guide = await prisma.guide.create({
    data: {
      title: guideData.title || inputValue,
      inputType,
      inputValue,
      summary: guideData.summary || '',
      prerequisites: prereqs,
    },
  })

  return NextResponse.json(guide)
}
