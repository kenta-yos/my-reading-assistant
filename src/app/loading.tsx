export default function HomeLoading() {
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero skeleton */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-7 sm:p-10">
        <div className="flex items-center gap-5">
          <div className="h-[72px] w-[72px] flex-shrink-0 rounded-full bg-white/20" />
          <div className="flex-1 space-y-2.5">
            <div className="h-5 w-3/4 rounded-full bg-white/20" />
            <div className="h-3.5 w-full rounded-full bg-white/15" />
          </div>
        </div>
      </div>

      {/* Form skeleton */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 dark:border-stone-700 dark:bg-stone-900">
        <div className="h-10 rounded-lg bg-stone-100 dark:bg-stone-800" />
        <div className="mt-4 h-[52px] rounded-xl bg-stone-100 dark:bg-stone-800" />
        <div className="mt-4 h-[52px] rounded-xl bg-indigo-100 dark:bg-indigo-900/30" />
        <div className="mt-5 border-t border-stone-100 pt-4 dark:border-stone-800">
          <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800" />
        </div>
      </div>

      {/* Recent guides skeleton */}
      <div className="space-y-4">
        <div className="h-4 w-24 rounded-full bg-stone-200 dark:bg-stone-700" />
        <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
            >
              <div className="h-0.5 bg-stone-200 dark:bg-stone-700" />
              <div className="space-y-2.5 p-5">
                <div className="h-3 w-20 rounded-full bg-stone-100 dark:bg-stone-800" />
                <div className="h-4 w-full rounded-full bg-stone-200 dark:bg-stone-700" />
                <div className="h-4 w-4/5 rounded-full bg-stone-200 dark:bg-stone-700" />
                <div className="h-3 w-full rounded-full bg-stone-100 dark:bg-stone-800" />
                <div className="h-3 w-3/4 rounded-full bg-stone-100 dark:bg-stone-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
