import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import DeleteButton from './DeleteButton'
import SectionNav from '@/components/SectionNav'
import RecommendButton from '@/components/RecommendButton'
import ShareButton from '@/components/ShareButton'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const guide = await prisma.guide.findUnique({ where: { id } })
  if (!guide) return {}

  const title = `${guide.title} の読書ガイド`
  const description = guide.summary
    ? guide.summary.slice(0, 150) + (guide.summary.length > 150 ? '...' : '')
    : `「${guide.title}」を読むための準備ガイド`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: ['/luka.png'],
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

type Prerequisites = {
  problemFocus?: string | string[]
  coreQuestions?: string[]
  uniqueness?: string | string[]
  postReadingOutcome?: string | string[]
  difficultyLevel: number | 'beginner' | 'intermediate' | 'advanced'
  difficultyDimensions?: {
    vocabulary: number
    concepts: number
    formality: number
    volume: number
    culturalContext: number
  }
  difficultyBarriers?: string[]
  difficultyExplanation?: string
  prerequisiteKnowledge?: string[]
  terminology: { term: string; definition: string }[]
  domainContext: {
    overview: string
    keyEvents: { event: string; significance: string }[]
    problemAwareness?: string
  }
  highSchoolBasics: { subject: string; concept: string; explanation: string }[]
  aboutAuthor: string
  intellectualLineage: string
  recommendedResources?: {
    title: string
    author: string
    publisher: string
    year: string
    isbn: string
    reason: string
    category?: '入門' | '発展'
  }[]
  ndlSearchQueries?: { keywords: string[]; intent: string }[]
  bookMetadata?: { authors?: string[]; publisher?: string; year?: string }
}

const numericDifficultyLabel: Record<number, { label: string; audience: string; className: string }> = {
  1: { label: '入門', audience: '予備知識なしで楽しめる', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  2: { label: '初級', audience: '興味さえあれば読み進められる', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' },
  3: { label: '中級', audience: '大学の教養科目くらいの知識があると読みやすい', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  4: { label: '上級', audience: 'この分野をある程度学んだことがある人向け', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  5: { label: '専門', audience: '大学院・研究者・実務家向け', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

const legacyDifficultyLabel: Record<string, { label: string; className: string }> = {
  beginner: { label: '入門', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  intermediate: { label: '中級', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  advanced: { label: '上級', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

function getDifficulty(level: number | string | undefined): { label: string; audience?: string; className: string } | null {
  if (level == null) return null
  if (typeof level === 'number') return numericDifficultyLabel[level] ?? null
  return legacyDifficultyLabel[level] ?? null
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const guide = await prisma.guide.findUnique({ where: { id } })
  if (!guide) notFound()

  const prereqs = guide.prerequisites as unknown as Prerequisites
  const difficulty = getDifficulty(prereqs?.difficultyLevel)
  const date = new Date(guide.createdAt).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const sections = [
    prereqs?.problemFocus && { id: 'focus', label: '問題関心' },
    prereqs?.coreQuestions?.length && { id: 'questions', label: '問い' },
    prereqs?.uniqueness && { id: 'uniqueness', label: 'オリジナリティ' },
    prereqs?.postReadingOutcome && { id: 'outcome', label: '得られる体験' },
    (difficulty || prereqs?.difficultyBarriers?.length) && { id: 'difficulty', label: '難易度' },
    prereqs?.terminology?.length > 0 && { id: 'terminology', label: 'キーワード' },
    prereqs?.domainContext && { id: 'context', label: 'コンテクスト' },
    (prereqs?.recommendedResources?.length || prereqs?.ndlSearchQueries?.length) && { id: 'books', label: '関連書籍' },
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className="space-y-14 sm:space-y-16">
      {/* Header */}
      <header className="relative space-y-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-white to-stone-50 px-5 py-7 shadow-sm ring-1 ring-stone-200/60 dark:from-indigo-950/20 dark:via-stone-900 dark:to-stone-950 dark:ring-stone-800/60 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-stone-400 dark:text-stone-500">
            <span>{guide.inputType === 'URL' ? 'ウェブ記事' : '書籍'}</span>
            <span>·</span>
            <span>{date}</span>
            {difficulty && (
              <>
                <span>·</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${difficulty.className}`}>
                  {difficulty.label}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <ShareButton title={guide.title} />
            <DeleteButton id={guide.id} />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 sm:text-4xl">
          {guide.title}
        </h1>

        {prereqs?.bookMetadata && (
          <div className="space-y-1.5">
            {prereqs.bookMetadata.authors?.length ? (
              <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                {prereqs.bookMetadata.authors.join('、')}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {prereqs.bookMetadata.publisher && (
                <span className="inline-block rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200/60 dark:bg-stone-800/80 dark:text-stone-300 dark:ring-stone-700/60">
                  {prereqs.bookMetadata.publisher}
                </span>
              )}
              {prereqs.bookMetadata.year && (
                <span className="inline-block rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200/60 dark:bg-stone-800/80 dark:text-stone-300 dark:ring-stone-700/60">
                  {prereqs.bookMetadata.year}年
                </span>
              )}
            </div>
          </div>
        )}
        {!prereqs?.bookMetadata && guide.inputValue !== guide.title && (
          <p className="truncate text-sm text-stone-400">{guide.inputValue}</p>
        )}

        {guide.summary && (
          <p className="text-base leading-[1.8] text-stone-600 dark:text-stone-300 sm:text-[17px]">{guide.summary}</p>
        )}

        {prereqs?.aboutAuthor && (
          <p className="border-l-2 border-stone-200 pl-4 text-sm leading-relaxed text-stone-500 italic dark:border-stone-700 dark:text-stone-400">{prereqs.aboutAuthor}</p>
        )}
      </header>

      <SectionNav sections={sections} />

      {/* 問題関心 */}
      {prereqs?.problemFocus && (
        <section id="focus" className="scroll-mt-28 space-y-5">
          <SectionHeading title="問題関心" />
          <BulletCard items={prereqs.problemFocus} />
        </section>
      )}

      {/* この本が答えようとしている問い */}
      {prereqs?.coreQuestions && prereqs.coreQuestions.length > 0 && (
        <section id="questions" className="scroll-mt-28 space-y-5">
          <SectionHeading title="この本が答えようとしている問い" />
          <BulletCard items={prereqs.coreQuestions} marker="?" />
        </section>
      )}

      {/* 本書のオリジナリティ */}
      {prereqs?.uniqueness && (
        <section id="uniqueness" className="scroll-mt-28 space-y-5">
          <SectionHeading title="本書のオリジナリティ" />
          <BulletCard items={prereqs.uniqueness} />
        </section>
      )}

      {/* この本で得られる体験 */}
      {prereqs?.postReadingOutcome && (
        <section id="outcome" className="scroll-mt-28 space-y-5">
          <SectionHeading title="この本で得られる体験" />
          <BulletCard items={prereqs.postReadingOutcome} />
        </section>
      )}

      {/* 難易度 */}
      {(difficulty || prereqs?.difficultyBarriers?.length) && (
        <section id="difficulty" className="scroll-mt-28 space-y-5">
          <SectionHeading title="難易度" />
          <div className="rounded-2xl bg-white/80 p-6 space-y-4 shadow-sm ring-1 ring-stone-950/5 backdrop-blur-sm dark:bg-stone-900/80 dark:ring-white/5">
            {difficulty && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold shadow-sm ${difficulty.className}`}>
                    {difficulty.label}
                  </span>
                  {typeof prereqs.difficultyLevel === 'number' && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`h-2 w-5 rounded-full ${
                            n <= Number(prereqs.difficultyLevel)
                              ? 'bg-stone-400 dark:bg-stone-500'
                              : 'bg-stone-200 dark:bg-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {difficulty.audience && (
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {difficulty.audience}
                  </p>
                )}
              </div>
            )}

            {/* 旧5軸内訳（後方互換） */}
            {prereqs?.difficultyDimensions && !prereqs?.difficultyBarriers && (
              <DifficultyDimensions dimensions={prereqs.difficultyDimensions} />
            )}

            {prereqs?.difficultyBarriers && prereqs.difficultyBarriers.length > 0 && (
              <ul className="space-y-2">
                {prereqs.difficultyBarriers.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-stone-400 dark:bg-stone-500" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {prereqs?.difficultyExplanation && (
              <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {prereqs.difficultyExplanation}
              </p>
            )}
          </div>
        </section>
      )}

      {/* 関連キーワード */}
      {prereqs?.terminology?.length > 0 && (
        <section id="terminology" className="scroll-mt-28 space-y-5">
          <SectionHeading title="関連キーワード" />
          <div className="grid gap-3 sm:grid-cols-2">
            {prereqs.terminology.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-stone-950/5 backdrop-blur-sm transition-shadow hover:shadow-md dark:bg-stone-900/80 dark:ring-white/5"
              >
                <dt className="font-semibold text-stone-950 dark:text-stone-100">{item.term}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  {item.definition}
                </dd>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* コンテクスト */}
      {prereqs?.domainContext && (
        <section id="context" className="scroll-mt-28 space-y-5">
          <SectionHeading title="この領域のコンテクスト" />
          <div className="rounded-2xl bg-white/80 p-6 space-y-4 shadow-sm ring-1 ring-stone-950/5 backdrop-blur-sm dark:bg-stone-900/80 dark:ring-white/5">
            {prereqs.domainContext.overview && (
              <p className="text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
                {prereqs.domainContext.overview}
              </p>
            )}

            {prereqs.domainContext.keyEvents?.length > 0 && (
              <ul className="space-y-4">
                {prereqs.domainContext.keyEvents.map((item, i) => (
                  <li
                    key={i}
                    className="border-b border-stone-100 pb-4 last:border-0 last:pb-0 dark:border-stone-800"
                  >
                    <p className="font-semibold text-stone-900 dark:text-stone-100">{item.event}</p>
                    {item.significance && (
                      <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                        {item.significance}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {prereqs.domainContext.problemAwareness && (
              <p className="text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
                {prereqs.domainContext.problemAwareness}
              </p>
            )}
          </div>
        </section>
      )}

      {/* 関連書籍 */}
      {(prereqs?.recommendedResources?.length || prereqs?.ndlSearchQueries?.length) && (
        <section id="books" className="scroll-mt-28 space-y-5">
          <SectionHeading title="関連書籍" />
          {prereqs.recommendedResources && prereqs.recommendedResources.length > 0 ? (
            (() => {
              const introBooks = prereqs.recommendedResources!.filter(b => b.category === '入門')
              const advancedBooks = prereqs.recommendedResources!.filter(b => b.category === '発展')
              const uncategorized = prereqs.recommendedResources!.filter(b => !b.category)
              const hasCategories = introBooks.length > 0 || advancedBooks.length > 0

              return (
                <div className="space-y-6">
                  {hasCategories ? (
                    <>
                      {introBooks.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                              入門
                            </span>
                            <span className="text-xs text-stone-400">読む前に前提知識を補う</span>
                          </div>
                          {introBooks.map((book, i) => (
                            <BookCard key={`intro-${i}`} book={book} />
                          ))}
                        </div>
                      )}
                      {advancedBooks.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              発展
                            </span>
                            <span className="text-xs text-stone-400">読んだ後にさらに深める</span>
                          </div>
                          {advancedBooks.map((book, i) => (
                            <BookCard key={`adv-${i}`} book={book} />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    uncategorized.map((book, i) => (
                      <BookCard key={i} book={book} />
                    ))
                  )}
                </div>
              )
            })()
          ) : (
            <RecommendButton guideId={guide.id} />
          )}
        </section>
      )}

      {/* Bottom */}
      <footer className="space-y-8 pt-8 text-center">
        <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent dark:via-stone-800" />
        <Link
          href="/"
          className="inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30"
        >
          ＋ 新しいガイドを生成する
        </Link>
        <p className="text-xs text-stone-400 dark:text-stone-500">
          AIが生成したコンテンツです。誤った情報が含まれている可能性もありますので、あくまでも参考情報としてご利用ください。
        </p>

        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-8 text-center shadow-sm ring-1 ring-indigo-100/80 dark:from-indigo-950/30 dark:via-stone-900 dark:to-violet-950/20 dark:ring-indigo-800/30">
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            サービスの運営にはAIのAPI利用料がかかっています。もしLukaが役に立ったら、応援していただけるととても嬉しいです。
          </p>
          <a
            href="https://ofuse.me/bdd35efd"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 dark:from-indigo-500 dark:to-indigo-400"
          >
            コーヒー1杯分の応援をする
          </a>
        </div>
      </footer>
    </div>
  )
}

/* ── Shared Components ── */

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-indigo-300 dark:from-indigo-400 dark:to-indigo-600" />
      <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-xl">{title}</h2>
    </div>
  )
}

function BulletCard({ label, items, marker }: { label?: string; items: string | string[]; marker?: string }) {
  const list = Array.isArray(items) ? items : [items]
  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-950/5 backdrop-blur-sm dark:bg-stone-900/80 dark:ring-white/5">
      {label && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">
          {label}
        </p>
      )}
      <ul className="space-y-3">
        {list.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-stone-800 dark:text-stone-200">
            {marker ? (
              <span className="mt-0.5 flex-shrink-0 text-lg font-medium text-indigo-500 dark:text-indigo-400">{marker}</span>
            ) : (
              <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-300 dark:bg-indigo-500" />
            )}
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function BookCard({ book }: { book: NonNullable<Prerequisites['recommendedResources']>[number] }) {
  return (
    <div className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-stone-950/5 backdrop-blur-sm dark:bg-stone-900/80 dark:ring-white/5">
      <p className="font-semibold text-stone-950 dark:text-stone-100">
        {book.isbn ? (
          <a
            href={`https://www.hanmoto.com/bd/isbn/${book.isbn}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-stone-300 underline-offset-2 hover:decoration-indigo-400 dark:decoration-stone-600"
          >
            {book.title}
          </a>
        ) : (
          book.title
        )}
      </p>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
        {book.author}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {book.publisher && (
          <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-300">
            {book.publisher}
          </span>
        )}
        {book.year && (
          <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-300">
            {book.year}年
          </span>
        )}
      </div>
      {book.reason && (
        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {book.reason}
        </p>
      )}
    </div>
  )
}

/* ── Legacy compat ── */

const dimensionLabels: { key: string; label: string }[] = [
  { key: 'vocabulary', label: '専門用語' },
  { key: 'concepts', label: '概念の抽象度' },
  { key: 'formality', label: '数式・形式性' },
  { key: 'volume', label: '分量・密度' },
  { key: 'culturalContext', label: '文化的前提' },
]

function DifficultyDimensions({ dimensions }: { dimensions: NonNullable<Prerequisites['difficultyDimensions']> }) {
  return (
    <div className="space-y-2">
      {dimensionLabels.map(({ key, label }) => {
        const value = dimensions[key as keyof typeof dimensions] ?? 0
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-24 flex-shrink-0 text-xs text-stone-500 dark:text-stone-400">{label}</span>
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 flex-1 rounded-full ${
                    n <= value
                      ? 'bg-stone-400 dark:bg-stone-500'
                      : 'bg-stone-200 dark:bg-stone-700'
                  }`}
                />
              ))}
            </div>
            <span className="w-5 text-right text-xs font-medium text-stone-500 dark:text-stone-400">{value}</span>
          </div>
        )
      })}
    </div>
  )
}
