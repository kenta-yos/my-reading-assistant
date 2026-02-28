import Link from 'next/link'

type GuideCardProps = {
  id: string
  title: string
  inputType: string
  inputValue: string
  summary: string
  createdAt: Date | string
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
}: GuideCardProps) {
  return (
    <Link href={`/guides/${id}`} className="group block">
      <article className="h-full overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:border-indigo-300 hover:shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="h-0.5 bg-indigo-500 opacity-0 transition group-hover:opacity-100" />
        <div className="p-5">
          <p className="mb-2.5 text-xs text-stone-500">
            {inputTypeLabel(inputType)} · {formatDateTimeJST(createdAt)}
          </p>
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
}: Pick<GuideCardProps, 'id' | 'title' | 'inputType' | 'createdAt'>) {
  return (
    <Link href={`/guides/${id}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-stone-200 bg-white transition group-hover:border-indigo-300 group-hover:shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="h-0.5 bg-indigo-400 opacity-0 transition group-hover:opacity-100" />
        <div className="p-4">
          <p className="mb-1.5 text-xs text-stone-500">
            {inputTypeLabel(inputType)} · {formatDateShortJST(createdAt)}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
            {title}
          </h3>
        </div>
      </article>
    </Link>
  )
}
