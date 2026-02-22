export default function GuideLoading() {
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header card skeleton */}
      <div className="animate-pulse overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        <div className="h-1 bg-indigo-300 dark:bg-indigo-700" />
        <div className="space-y-4 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-2">
              <div className="h-3.5 w-10 rounded-full bg-stone-100 dark:bg-stone-800" />
              <div className="h-3.5 w-3 rounded-full bg-stone-100 dark:bg-stone-800" />
              <div className="h-3.5 w-20 rounded-full bg-stone-100 dark:bg-stone-800" />
            </div>
            <div className="h-7 w-14 rounded-lg bg-stone-100 dark:bg-stone-800" />
          </div>
          <div className="h-7 w-3/4 rounded-full bg-stone-200 dark:bg-stone-700" />
          <div className="border-t border-stone-100 pt-5 dark:border-stone-800">
            <div className="mb-3 h-2.5 w-10 rounded-full bg-stone-100 dark:bg-stone-800" />
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded-full bg-stone-100 dark:bg-stone-800" />
              <div className="h-3.5 w-full rounded-full bg-stone-100 dark:bg-stone-800" />
              <div className="h-3.5 w-4/5 rounded-full bg-stone-100 dark:bg-stone-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Section skeletons */}
      {[
        { accent: 'bg-indigo-300', w: 'w-32' },
        { accent: 'bg-teal-300', w: 'w-40' },
        { accent: 'bg-amber-300', w: 'w-48' },
        { accent: 'bg-rose-300', w: 'w-36' },
      ].map((s, i) => (
        <div key={i} className="animate-pulse space-y-4">
          <div className="flex items-center gap-2.5">
            <div className={`h-5 w-7 rounded-md ${s.accent} opacity-40`} />
            <div className={`h-5 ${s.w} rounded-full bg-stone-200 dark:bg-stone-700`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[...Array(i === 0 ? 4 : 2)].map((_, j) => (
              <div
                key={j}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
              >
                <div className={`h-0.5 ${s.accent} opacity-40`} />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-2/5 rounded-full bg-stone-200 dark:bg-stone-700" />
                  <div className="h-3 w-full rounded-full bg-stone-100 dark:bg-stone-800" />
                  <div className="h-3 w-4/5 rounded-full bg-stone-100 dark:bg-stone-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
