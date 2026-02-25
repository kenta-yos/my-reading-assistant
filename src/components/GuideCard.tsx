import Link from 'next/link'

type GuideCardProps = {
  id: string
  title: string
  inputType: string
  inputValue: string
  summary: string
  createdAt: Date | string
  bookmarked?: boolean
  compact?: boolean
}

function formatDateTimeJST(date: Date | string): string {
  return new Date(date).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShortJST(date: Date | string): string {
  return new Date(date).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function inputTypeLabel(inputType: string) {
  return inputType === 'URL' ? 'ウェブ記事' : '書籍'
}

export default function GuideCard({
  id,
  title,
  inputType,
  summary,
  createdAt,
  bookmarked = false,
}: GuideCardProps) {
  return (
    <Link href={`/guides/${id}`} className="group block">
      <article className="h-full overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:border-indigo-300 hover:shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="h-0.5 bg-indigo-500 opacity-0 transition group-hover:opacity-100" />
        <div className="p-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-xs text-stone-500">
              {inputTypeLabel(inputType)} · {formatDateTimeJST(createdAt)}
            </p>
            {bookmarked && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5 flex-shrink-0 text-amber-500"
              >
                <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            )}
          </div>
          <h3 className="mb-2 line-clamp-2 font-semibold text-stone-950 transition group-hover:text-indigo-700 dark:text-stone-100 dark:group-hover:text-indigo-400">
            {title}
          </h3>
          {summary && (
            <p className="line-clamp-2 text-sm leading-relaxed text-stone-800 dark:text-stone-200">
              {summary}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

export function GuideCardCompact({
  id,
  title,
  inputType,
  createdAt,
  bookmarked = false,
}: Pick<GuideCardProps, 'id' | 'title' | 'inputType' | 'createdAt' | 'bookmarked'>) {
  return (
    <Link href={`/guides/${id}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-stone-200 bg-white transition group-hover:border-indigo-300 group-hover:shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="h-0.5 bg-indigo-400 opacity-0 transition group-hover:opacity-100" />
        <div className="flex items-start justify-between gap-2 p-4">
          <div className="min-w-0">
            <p className="mb-1.5 text-xs text-stone-500">
              {inputTypeLabel(inputType)} · {formatDateShortJST(createdAt)}
            </p>
            <h3 className="line-clamp-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
              {title}
            </h3>
          </div>
          {bookmarked && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500"
            >
              <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          )}
        </div>
      </article>
    </Link>
  )
}
