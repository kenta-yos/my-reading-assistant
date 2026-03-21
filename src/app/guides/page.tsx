import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import GuideList from './GuideList'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GuidesPage() {
  const session = await auth()
  const userId = session?.user?.id ?? null

  const guides = await prisma.guide.findMany({
    where: userId ? { userId } : { userId: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      inputType: true,
      inputValue: true,
      summary: true,
      createdAt: true,
    },
  })

  // ログインユーザーのブックマーク済みガイドIDを取得
  let bookmarkedIds: Set<string> = new Set()
  if (userId) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: { guideId: true },
    })
    bookmarkedIds = new Set(bookmarks.map((b) => b.guideId))
  }

  const guidesWithBookmark = guides.map((g) => ({
    ...g,
    bookmarked: bookmarkedIds.has(g.id),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">ガイド一覧</h1>
          <p className="mt-0.5 text-sm text-stone-500">{guides.length}件保存済み</p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          ＋ 新しく生成
        </Link>
      </div>

      {guides.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-4 text-5xl">📭</p>
          <p className="mb-4 text-stone-500">まだガイドがありません。</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            最初のガイドを生成する
          </Link>
        </div>
      ) : (
        <GuideList guides={guidesWithBookmark} isLoggedIn={!!userId} />
      )}
    </div>
  )
}
