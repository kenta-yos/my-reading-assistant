'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await fetch(`/api/guides/${id}`, { method: 'DELETE' })
    router.push('/guides')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {!isDeleting && (
          <span className="text-sm text-stone-500">本当に削除しますか？</span>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isDeleting && (
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isDeleting ? '削除中...' : '削除'}
        </button>
        {!isDeleting && (
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400"
          >
            キャンセル
          </button>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-500 hover:border-red-200 hover:text-red-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-red-800 dark:hover:text-red-400"
    >
      削除
    </button>
  )
}
