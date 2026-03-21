import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import GuideCard from '@/components/GuideCard'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ブックマーク',
}

export default async function BookmarksPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      guide: {
        select: {
          id: true,
          title: true,
          inputType: true,
          inputValue: true,
          summary: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const guides = bookmarks.map((b) => b.guide)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">ブックマーク</h1>
          <p className="mt-0.5 text-sm text-stone-500">{guides.length}件</p>
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
          <p className="mb-4 text-5xl">☆</p>
          <p className="mb-4 text-stone-500">まだブックマークがありません。</p>
          <p className="text-sm text-stone-400">ガイドの右上にある ☆ ボタンで保存できます。</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <GuideCard key={guide.id} {...guide} />
          ))}
        </div>
      )}
    </div>
  )
}
