'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookmarkButton({
  id,
  bookmarked,
}: {
  id: string
  bookmarked: boolean
}) {
  const router = useRouter()
  const [isBookmarked, setIsBookmarked] = useState(bookmarked)
  const [isLoading, setIsLoading] = useState(false)

  const toggle = async () => {
    if (isLoading) return
    setIsLoading(true)
    const newValue = !isBookmarked
    setIsBookmarked(newValue) // optimistic update
    try {
      const res = await fetch(`/api/guides/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarked: newValue }),
      })
      if (!res.ok) setIsBookmarked(!newValue) // revert on error
      else router.refresh()
    } catch {
      setIsBookmarked(!newValue) // revert on error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      title={isBookmarked ? 'ブックマーク解除' : 'ブックマークする'}
      className={`rounded-lg border p-1.5 transition disabled:opacity-60 ${
        isBookmarked
          ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
          : 'border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-500 dark:border-stone-700 dark:text-stone-400 dark:hover:border-amber-700 dark:hover:text-amber-400'
      }`}
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isBookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      )}
    </button>
  )
}
