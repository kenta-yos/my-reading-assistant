import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import DeleteButton from './DeleteButton'
import SectionNav from '@/components/SectionNav'
import RecommendButton from '@/components/RecommendButton'
import ShareButton from '@/components/ShareButton'

type Prerequisites = {
  // 判断フェーズ
  problemFocus?: string
  postReadingOutcome?: string
  difficultyLevel: number | 'beginner' | 'intermediate' | 'advanced'
  difficultyExplanation?: string
  prerequisiteKnowledge?: string[]
  // 準備フェーズ
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

// 新5段階
const numericDifficultyLabel: Record<number, { label: string; className: string }> = {
  1: { label: '入門', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  2: { label: '初級', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' },
  3: { label: '中級', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  4: { label: '上級', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  5: { label: '専門', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

// 旧3段階フォールバック
const legacyDifficultyLabel: Record<string, { label: string; className: string }> = {
  beginner: { label: '入門', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  intermediate: { label: '中級', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  advanced: { label: '上級', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

function getDifficulty(level: number | string | undefined): { label: string; className: string } | null {
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

  const hasJudgmentPhase =
    prereqs?.problemFocus ||
    prereqs?.postReadingOutcome ||
    prereqs?.difficultyExplanation ||
    prereqs?.prerequisiteKnowledge?.length

  const sections = [
    hasJudgmentPhase && { id: 'judgment', label: '判断' },
    prereqs?.terminology?.length > 0 && { id: 'terminology', label: '用語' },
    prereqs?.domainContext && { id: 'context', label: 'コンテクスト' },
    prereqs?.highSchoolBasics?.length > 0 && { id: 'basics', label: '基礎知識' },
    (prereqs?.aboutAuthor || prereqs?.intellectualLineage) && { id: 'author', label: '著者' },
    (prereqs?.recommendedResources?.length || prereqs?.ndlSearchQueries?.length) && { id: 'books', label: '関連書籍' },
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header card */}
      <header className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        <div className="h-1 bg-indigo-600" />
        <div className="p-6 sm:p-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
              <span>{guide.inputType === 'URL' ? 'ウェブ記事' : '書籍'}</span>
              <span>·</span>
              <span>{date}</span>
              {difficulty && (
                <>
                  <span>·</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficulty.className}`}>
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

          <h1 className="text-xl font-bold text-stone-950 dark:text-stone-50 sm:text-2xl">
            {guide.title}
          </h1>
          {prereqs?.bookMetadata && (
            <div className="mt-2 space-y-1">
              {prereqs.bookMetadata.authors?.length ? (
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  {prereqs.bookMetadata.authors.join('、')}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {prereqs.bookMetadata.publisher && (
                  <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                    {prereqs.bookMetadata.publisher}
                  </span>
                )}
                {prereqs.bookMetadata.year && (
                  <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                    {prereqs.bookMetadata.year}年
                  </span>
                )}
              </div>
            </div>
          )}
          {!prereqs?.bookMetadata && guide.inputValue !== guide.title && (
            <p className="mt-1 truncate text-sm text-stone-400">{guide.inputValue}</p>
          )}

          {guide.summary && (
            <div className="mt-6 border-t border-stone-100 pt-5 dark:border-stone-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
                全体像
              </p>
              <p className="leading-relaxed text-stone-900 dark:text-stone-100">{guide.summary}</p>
            </div>
          )}
        </div>
      </header>

      <SectionNav sections={sections} />

      {/* ━━ 判断フェーズ ━━ */}
      {hasJudgmentPhase && (
        <div id="judgment" className="scroll-mt-24 space-y-8 sm:space-y-10">
          <PhaseHeader step={1} title="判断フェーズ" subtitle="この本を読むべきかを見極める" />

          {/* 問題関心 */}
          {prereqs.problemFocus && (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
              <div className="h-0.5 bg-violet-400" />
              <div className="p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400">
                  問題関心
                </p>
                <p className="leading-relaxed text-stone-900 dark:text-stone-100">
                  {prereqs.problemFocus}
                </p>
              </div>
            </div>
          )}

          {/* 読後の変化 */}
          {prereqs.postReadingOutcome && (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
              <div className="h-0.5 bg-violet-400" />
              <div className="p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400">
                  読後の変化
                </p>
                <p className="leading-relaxed text-stone-900 dark:text-stone-100">
                  {prereqs.postReadingOutcome}
                </p>
              </div>
            </div>
          )}

          {/* 難易度・前提知識 */}
          {(difficulty || prereqs.difficultyExplanation || prereqs.prerequisiteKnowledge?.length) && (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
              <div className="h-0.5 bg-violet-400" />
              <div className="p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400">
                  難易度・前提知識
                </p>
                {difficulty && (
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${difficulty.className}`}>
                      {difficulty.label}
                    </span>
                    {typeof prereqs.difficultyLevel === 'number' && (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div
                            key={n}
                            className={`h-2 w-5 rounded-full ${
                              n <= Number(prereqs.difficultyLevel)
                                ? 'bg-violet-400'
                                : 'bg-stone-200 dark:bg-stone-700'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {prereqs.difficultyExplanation && (
                  <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                    {prereqs.difficultyExplanation}
                  </p>
                )}
                {prereqs.prerequisiteKnowledge && prereqs.prerequisiteKnowledge.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
                      必要な前提知識
                    </p>
                    <ul className="space-y-1.5">
                      {prereqs.prerequisiteKnowledge.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ━━ 準備フェーズ ━━ */}
      <PhaseHeader step={2} title="準備フェーズ" subtitle="読むための土台をつくる" />

      {/* Section 01 — 専門用語 */}
      {prereqs?.terminology?.length > 0 && (
        <Section id="terminology" number="01" title="この領域の専門用語" accent="indigo">
          <div className="grid gap-3 sm:grid-cols-2">
            {prereqs.terminology.map((item, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
              >
                <div className="h-0.5 bg-indigo-400" />
                <div className="p-4">
                  <dt className="font-semibold text-stone-950 dark:text-stone-100">{item.term}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-stone-900 dark:text-stone-100">
                    {item.definition}
                  </dd>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Section 02 — 領域のコンテクスト */}
      {prereqs?.domainContext && (
        <Section id="context" number="02" title="この領域のコンテクスト" accent="teal">
          <div className="space-y-3">
            {prereqs.domainContext.overview && (
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                <div className="h-0.5 bg-teal-400" />
                <div className="p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
                    歴史的な流れ
                  </p>
                  <p className="leading-relaxed text-stone-900 dark:text-stone-100">
                    {prereqs.domainContext.overview}
                  </p>
                </div>
              </div>
            )}

            {prereqs.domainContext.keyEvents?.length > 0 && (
              <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
                  押さえておくべき出来事・転換点
                </p>
                <ul className="space-y-5">
                  {prereqs.domainContext.keyEvents.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 border-b border-stone-100 pb-5 last:border-0 last:pb-0 dark:border-stone-800"
                    >
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-teal-400" />
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-stone-100">{item.event}</p>
                        {item.significance && (
                          <p className="mt-1.5 text-sm leading-relaxed text-stone-900 dark:text-stone-100">
                            {item.significance}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 旧データ互換: problemAwareness */}
            {prereqs.domainContext.problemAwareness && (
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                <div className="h-0.5 bg-teal-400" />
                <div className="p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
                    この領域が取り組む問い・対立軸
                  </p>
                  <p className="leading-relaxed text-stone-900 dark:text-stone-100">
                    {prereqs.domainContext.problemAwareness}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Section 03 — 高校レベル基礎知識 */}
      {prereqs?.highSchoolBasics?.length > 0 && (
        <Section id="basics" number="03" title="高校レベルで押さえておきたい基礎知識" accent="amber">
          <div className="space-y-3">
            {prereqs.highSchoolBasics.map((item, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
              >
                <div className="h-0.5 bg-amber-400" />
                <div className="p-5">
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {item.subject}
                    </span>
                    <span className="font-semibold text-stone-950 dark:text-stone-100">{item.concept}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-900 dark:text-stone-100">
                    {item.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Section 04 — 著者・知的系譜 */}
      {(prereqs?.aboutAuthor || prereqs?.intellectualLineage) && (
        <Section id="author" number="04" title="著者と思想的背景" accent="rose">
          <div className="space-y-3">
            {prereqs.aboutAuthor && (
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                <div className="h-0.5 bg-rose-400" />
                <div className="p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
                    著者について
                  </p>
                  <p className="leading-relaxed text-stone-900 dark:text-stone-100">{prereqs.aboutAuthor}</p>
                </div>
              </div>
            )}
            {prereqs.intellectualLineage && (
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                <div className="h-0.5 bg-rose-400" />
                <div className="p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
                    思考の枠組み・知的系譜
                  </p>
                  <p className="leading-relaxed text-stone-900 dark:text-stone-100">
                    {prereqs.intellectualLineage}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Section 05 — 関連書籍 */}
      {(prereqs?.recommendedResources?.length || prereqs?.ndlSearchQueries?.length) && (
        <Section id="books" number="05" title="関連書籍" accent="cyan">
          {prereqs.recommendedResources && prereqs.recommendedResources.length > 0 ? (
            (() => {
              const introBooks = prereqs.recommendedResources!.filter(b => b.category === '入門')
              const advancedBooks = prereqs.recommendedResources!.filter(b => b.category === '発展')
              const uncategorized = prereqs.recommendedResources!.filter(b => !b.category)
              const hasCategories = introBooks.length > 0 || advancedBooks.length > 0

              return (
                <div className="space-y-5">
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
                            <BookCard key={`intro-${i}`} book={book} accent="emerald" />
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
                            <BookCard key={`adv-${i}`} book={book} accent="amber" />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    uncategorized.map((book, i) => (
                      <BookCard key={i} book={book} accent="cyan" />
                    ))
                  )}
                </div>
              )
            })()
          ) : (
            <RecommendButton guideId={guide.id} />
          )}
        </Section>
      )}

      {/* Bottom CTA */}
      <div className="border-t border-stone-100 pb-4 pt-8 text-center dark:border-stone-800">
        <Link
          href="/"
          className="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          ＋ 新しいガイドを生成する
        </Link>
        <p className="mt-4 text-xs text-stone-400 dark:text-stone-500">
          AIが生成したコンテンツです。著者の所属・経歴などの事実情報は念のため原典でご確認ください。
        </p>

        {/* 応援カード */}
        <div className="mt-10 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 text-center dark:border-indigo-900/30 dark:from-indigo-950/20 dark:to-stone-900">
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            サービスの運営にはAIのAPI利用料がかかっています。もしLukaが役に立ったら、応援していただけるととても嬉しいです。
          </p>
          <a
            href="https://ofuse.me/bdd35efd"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            コーヒー1杯分の応援をする
          </a>
        </div>
      </div>
    </div>
  )
}

type AccentColor = 'indigo' | 'teal' | 'amber' | 'rose' | 'cyan' | 'emerald'

const badgeStyle: Record<AccentColor, string> = {
  indigo:  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  teal:    'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  amber:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  rose:    'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  cyan:    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const accentTopBar: Record<AccentColor, string> = {
  indigo:  'bg-indigo-400',
  teal:    'bg-teal-400',
  amber:   'bg-amber-400',
  rose:    'bg-rose-400',
  cyan:    'bg-cyan-400',
  emerald: 'bg-emerald-400',
}

const accentLink: Record<AccentColor, string> = {
  indigo:  'decoration-indigo-300 hover:decoration-indigo-500',
  teal:    'decoration-teal-300 hover:decoration-teal-500',
  amber:   'decoration-amber-300 hover:decoration-amber-500',
  rose:    'decoration-rose-300 hover:decoration-rose-500',
  cyan:    'decoration-cyan-300 hover:decoration-cyan-500',
  emerald: 'decoration-emerald-300 hover:decoration-emerald-500',
}

function BookCard({ book, accent }: { book: Prerequisites['recommendedResources'] extends (infer T)[] | undefined ? T : never; accent: AccentColor }) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
      <div className={`h-0.5 ${accentTopBar[accent]}`} />
      <div className="p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <p className="font-semibold text-stone-950 dark:text-stone-100">
            {book.isbn ? (
              <a
                href={`https://www.hanmoto.com/bd/isbn/${book.isbn}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline underline-offset-2 ${accentLink[accent]}`}
              >
                {book.title}
              </a>
            ) : (
              book.title
            )}
          </p>
        </div>
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
          <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {book.reason}
          </p>
        )}
      </div>
    </div>
  )
}

function PhaseHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
        <span className="text-[10px] font-bold uppercase leading-none text-violet-700 dark:text-violet-300">Step</span>
        <span className="text-sm font-bold leading-tight text-violet-700 dark:text-violet-300">{step}</span>
      </div>
      <div>
        <p className="text-base font-bold text-stone-700 dark:text-stone-300">{title}</p>
        <p className="text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>
      </div>
    </div>
  )
}

function Section({
  id,
  number,
  title,
  accent,
  children,
}: {
  id?: string
  number: string
  title: string
  accent: AccentColor
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2.5">
        <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${badgeStyle[accent]}`}>
          {number}
        </span>
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-50 sm:text-lg">{title}</h2>
      </div>
      {children}
    </section>
  )
}
