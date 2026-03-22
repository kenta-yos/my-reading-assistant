import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import GuideForm from '@/components/GuideForm'
import GuideCard from '@/components/GuideCard'

export const dynamic = 'force-dynamic'

const USER_DAILY_LIMIT = 5
const ANON_DAILY_LIMIT = 1

function getTodayJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

export default async function Home() {
  const session = await auth()
  const userId = session?.user?.id ?? null
  const today = getTodayJST()
  const dailyLimit = userId ? USER_DAILY_LIMIT : ANON_DAILY_LIMIT

  const [recentGuides, userUsage] = await Promise.all([
    prisma.guide.findMany({
      where: userId ? { userId } : { userId: null },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        inputType: true,
        inputValue: true,
        summary: true,
        createdAt: true,
      },
    }),
    prisma.userUsage.findUnique({
      where: { userId_date: { userId: userId ?? 'anonymous', date: today } },
    }),
  ])

  const usedCount = userUsage?.count ?? 0
  const usagePercent = Math.min(100, Math.round((usedCount / dailyLimit) * 100))

  const usageColor =
    usagePercent >= 90 ? 'bg-red-400'
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
              読みたい気持ちを、<br className="sm:hidden" />あと押しする
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-indigo-200 sm:text-sm">
              どんな内容なんだろう...？難しそうだけど読めるかな...？
              <br />
              そんなときは、本のタイトルや気になるネット記事のURLを入れるだけで、ルカが読書の準備をまるごとサポートしてくれます。
            </p>
            <Link
              href="/lp"
              className="mt-3 inline-block text-xs font-medium text-indigo-300 transition hover:text-white"
            >
              Lukaについて詳しく →
            </Link>
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
              </span>
              <span
                className={`text-xs ${
                  usagePercent >= 90
                    ? 'text-red-500'
                    : usagePercent >= 70
                    ? 'text-amber-600'
                    : 'text-stone-400'
                }`}
              >
                {usedCount} / {dailyLimit}
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
      {/* 応援カード */}
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 dark:border-indigo-900/30 dark:from-indigo-950/20 dark:to-stone-900 sm:p-8">
        <div className="flex items-center gap-4">
          <Image
            src="/ken_blue.png"
            alt="Kenta"
            width={48}
            height={48}
            className="flex-shrink-0 rounded-full"
          />
          <div>
            <p className="font-bold text-stone-900 dark:text-stone-50">Kenta</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">学術と日常をつなぐ</p>
            <a
              href="https://linktr.ee/ken_book_lover"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-medium text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              @ken_book_lover
            </a>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
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
      </section>
    </div>
  )
}
