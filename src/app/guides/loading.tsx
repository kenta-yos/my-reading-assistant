export default function GuidesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-6 w-28 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
          <div className="h-3.5 w-16 animate-pulse rounded-full bg-stone-100 dark:bg-stone-800" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-indigo-100 dark:bg-indigo-900/30" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
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
              <div className="h-3 w-2/3 rounded-full bg-stone-100 dark:bg-stone-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
