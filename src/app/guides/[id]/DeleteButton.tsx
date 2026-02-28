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
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-stone-800">
          <p className="text-center text-sm font-medium text-stone-700 dark:text-stone-200">
            このガイドを削除しますか？
          </p>
          <p className="mt-1 text-center text-xs text-stone-400">
            この操作は取り消せません
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setConfirming(false)}
              disabled={isDeleting}
              className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700"
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isDeleting && (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isDeleting ? '削除中…' : '削除する'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title="削除"
      className="rounded-lg border border-stone-200 p-1.5 text-stone-500 transition hover:border-red-200 hover:text-red-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-red-800 dark:hover:text-red-400"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
      </svg>
    </button>
  )
}
