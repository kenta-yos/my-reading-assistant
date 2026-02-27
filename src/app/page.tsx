import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { cleanupExpiredGuides } from '@/lib/cleanup'
import GuideForm from '@/components/GuideForm'
import GuideCard from '@/components/GuideCard'

export const dynamic = 'force-dynamic'

const DAILY_LIMIT = 200

function getTodayJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

export default async function Home() {
  // 期限切れガイドをクリーンアップ（失敗しても無視）
  cleanupExpiredGuides().catch(() => {})

  const [recentGuides, todayUsage] = await Promise.all([
    prisma.guide.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        inputType: true,
        inputValue: true,
        summary: true,
        createdAt: true,
        bookmarked: true,
      },
    }),
    prisma.apiUsage.findUnique({ where: { date: getTodayJST() } }),
  ])

  const usedCount = todayUsage?.count ?? 0
  const isBlocked = todayUsage?.blocked ?? false
  const usagePercent = Math.min(100, Math.round((usedCount / DAILY_LIMIT) * 100))

  const usageColor =
    isBlocked ? 'bg-red-400'
    : usagePercent >= 90 ? 'bg-red-400'
    : usagePercent >= 70 ? 'bg-amber-400'
    : 'bg-emerald-400'

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-7 sm:p-10">
        <div className="flex items-center gap-5">
          <Image
            src="/luka.png"
            alt="Luka"
            width={72}
            height={72}
            className="flex-shrink-0 rounded-full shadow-lg ring-2 ring-white/25"
            priority
          />
          <div>
            <h1 className="text-xl font-bold leading-snug text-white sm:text-2xl">
              きみの好奇心に、<br className="sm:hidden" />最高のブーストを
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-indigo-200 sm:text-sm">
              本のタイトルや気になるネット記事のURLを入れるだけで、ルカが前提知識をまとめてくれます
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 dark:border-stone-700 dark:bg-stone-900">
          <GuideForm />
          <div className="mt-5 border-t border-stone-100 pt-4 dark:border-stone-800">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                本日の使用量
                {isBlocked && <span className="ml-2 text-red-500">⚠ 停止中</span>}
              </span>
              <span
                className={`text-xs ${
                  isBlocked || usagePercent >= 90
                    ? 'text-red-500'
                    : usagePercent >= 70
                    ? 'text-amber-600'
                    : 'text-stone-400'
                }`}
              >
                {usedCount} / {DAILY_LIMIT}
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-stone-100 dark:bg-stone-800">
              <div
                className={`h-1 rounded-full transition-all ${usageColor}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recent guides */}
      {recentGuides.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              最近のガイド
            </h2>
            <Link
              href="/guides"
              className="text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            >
              すべて見る →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {recentGuides.map((guide) => (
              <GuideCard key={guide.id} {...guide} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
