import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import DeleteButton from './DeleteButton'
import BookmarkButton from '@/components/BookmarkButton'

type Prerequisites = {
  terminology: { term: string; definition: string }[]
  domainContext: {
    overview: string
    keyEvents: { event: string; significance: string }[]
    problemAwareness: string
  }
  highSchoolBasics: { subject: string; concept: string; explanation: string }[]
  aboutAuthor: string
  intellectualLineage: string
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
}

const difficultyLabel: Record<string, { label: string; className: string }> = {
  beginner: {
    label: '入門',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  intermediate: {
    label: '中級',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  advanced: {
    label: '上級',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
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
  const difficulty = difficultyLabel[prereqs?.difficultyLevel ?? ''] ?? null
  const date = new Date(guide.createdAt).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header card */}
      <header className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        <div className="h-1 bg-indigo-600" />
        <div className="p-6 sm:p-8">
          <div className="mb-4 flex items-start justify-between gap-4">
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
            <div className="flex items-center gap-2">
              <BookmarkButton id={guide.id} bookmarked={guide.bookmarked} />
              <DeleteButton id={guide.id} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-stone-950 dark:text-stone-50 sm:text-2xl">
            {guide.title}
          </h1>
          {guide.inputValue !== guide.title && (
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

      {/* Section 01 — 専門用語 */}
      {prereqs?.terminology?.length > 0 && (
        <Section number="01" title="この領域の専門用語" accent="indigo">
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
        <Section number="02" title="この領域のコンテクスト" accent="teal">
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
        <Section number="03" title="高校レベルで押さえておきたい基礎知識" accent="amber">
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
        <Section number="04" title="著者と思想的背景" accent="rose">
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
      </div>
    </div>
  )
}

type AccentColor = 'indigo' | 'teal' | 'amber' | 'rose'

const badgeStyle: Record<AccentColor, string> = {
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  teal:   'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  amber:  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  rose:   'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
}

function Section({
  number,
  title,
  accent,
  children,
}: {
  number: string
  title: string
  accent: AccentColor
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
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
