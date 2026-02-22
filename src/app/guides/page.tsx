import { prisma } from '@/lib/prisma'
import GuideCard from '@/components/GuideCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GuidesPage() {
  const guides = await prisma.guide.findMany({
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <GuideCard key={guide.id} {...guide} />
          ))}
        </div>
      )}
    </div>
  )
}
