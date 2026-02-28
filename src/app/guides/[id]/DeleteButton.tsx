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
      className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-500 hover:border-red-200 hover:text-red-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-red-800 dark:hover:text-red-400"
    >
      削除
    </button>
  )
}
