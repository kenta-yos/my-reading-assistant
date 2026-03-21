import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '利用統計',
}

export default async function StatsPage() {
  const [usageRecords, totalGuides, recentGuides] = await Promise.all([
    prisma.apiUsage.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    }),
    prisma.guide.count(),
    prisma.guide.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        inputType: true,
        createdAt: true,
      },
    }),
  ])

  const totalRequests = usageRecords.reduce((sum, r) => sum + r.count, 0)
  const avgPerDay = usageRecords.length > 0 ? Math.round(totalRequests / usageRecords.length) : 0
  const peakDay = usageRecords.length > 0
    ? usageRecords.reduce((max, r) => (r.count > max.count ? r : max))
    : null

  // 直近7日のデータ（グラフ用）
  const last7 = usageRecords.slice(0, 7).reverse()
  const maxCount = Math.max(...last7.map((r) => r.count), 1)

  return (
    <div className="space-y-8 sm:space-y-10">
      <header>
        <h1 className="text-xl font-bold text-stone-950 dark:text-stone-50 sm:text-2xl">
          利用統計
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          直近30日間のAPI利用状況とガイド生成数
        </p>
      </header>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="総ガイド数" value={totalGuides.toString()} />
        <StatCard label="直近30日リクエスト" value={totalRequests.toString()} />
        <StatCard label="1日平均" value={`${avgPerDay}回`} />
        <StatCard
          label="ピーク日"
          value={peakDay ? `${peakDay.count}回` : '-'}
          sub={peakDay?.date}
        />
      </div>

      {/* 直近7日グラフ */}
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
          直近7日間のリクエスト数
        </p>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {last7.map((r) => {
            const height = Math.max(4, (r.count / maxCount) * 100)
            return (
              <div key={r.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-stone-500">{r.count}</span>
                <div
                  className="w-full rounded-t bg-indigo-400 transition-all dark:bg-indigo-500"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-stone-400">
                  {r.date.slice(5)}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* 直近30日テーブル */}
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        <div className="p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
            日別リクエスト数（直近30日）
          </p>
          <div className="space-y-1">
            {usageRecords.map((r) => (
              <div key={r.date} className="flex items-center gap-3">
                <span className="w-24 flex-shrink-0 text-xs tabular-nums text-stone-500">{r.date}</span>
                <div className="flex flex-1">
                  <div
                    className="h-3 rounded-full bg-indigo-200 dark:bg-indigo-800"
                    style={{ width: `${Math.max(2, (r.count / 200) * 100)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-stone-600 dark:text-stone-400">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 最近のガイド */}
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        <div className="p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
            最近生成されたガイド
          </p>
          <ul className="space-y-2">
            {recentGuides.map((g) => (
              <li key={g.id} className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500 dark:bg-stone-700 dark:text-stone-400">
                  {g.inputType === 'URL' ? 'URL' : '書籍'}
                </span>
                <a
                  href={`/guides/${g.id}`}
                  className="flex-1 truncate text-stone-800 underline decoration-stone-300 underline-offset-2 hover:decoration-indigo-400 dark:text-stone-200 dark:decoration-stone-600"
                >
                  {g.title}
                </a>
                <span className="flex-shrink-0 text-xs tabular-nums text-stone-400">
                  {new Date(g.createdAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-stone-400">{sub}</p>}
    </div>
  )
}
