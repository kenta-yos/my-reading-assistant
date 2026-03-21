'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function BookmarkButton({
  guideId,
  initialBookmarked,
}: {
  guideId: string
  initialBookmarked: boolean
}) {
  const { data: session } = useSession()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  if (!session) return null

  const toggle = async () => {
    setLoading(true)
    try {
      if (bookmarked) {
        await fetch('/api/bookmarks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guideId }),
        })
        setBookmarked(false)
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guideId }),
        })
        setBookmarked(true)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        bookmarked
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
          : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300'
      }`}
      title={bookmarked ? 'ブックマーク解除' : 'ブックマーク'}
    >
      {bookmarked ? '★' : '☆'}
    </button>
  )
}
