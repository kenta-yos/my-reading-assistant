'use client'

import { useState } from 'react'
import GuideCard from '@/components/GuideCard'

type Guide = {
  id: string
  title: string
  inputType: string
  inputValue: string
  summary: string
  createdAt: Date | string
  bookmarked: boolean
}

export default function GuideList({
  guides,
  isLoggedIn,
}: {
  guides: Guide[]
  isLoggedIn: boolean
}) {
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)

  const filtered = showBookmarkedOnly
    ? guides.filter((g) => g.bookmarked)
    : guides

  return (
    <div className="space-y-4">
      {isLoggedIn && guides.some((g) => g.bookmarked) && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowBookmarkedOnly(false)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              !showBookmarkedOnly
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setShowBookmarkedOnly(true)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              showBookmarkedOnly
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200'
            }`}
          >
            ★ ブックマーク
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-stone-500">ブックマークしたガイドはまだありません。</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((guide) => (
            <GuideCard key={guide.id} {...guide} />
          ))}
        </div>
      )}
    </div>
  )
}
