'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async () => {
    await fetch(`/api/guides/${id}`, { method: 'DELETE' })
    router.push('/guides')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">本当に削除しますか？</span>
        <button
          onClick={handleDelete}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          削除
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400"
        >
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:border-red-200 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-800 dark:hover:text-red-400"
    >
      削除
    </button>
  )
}
