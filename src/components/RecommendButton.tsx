'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RecommendButton({ guideId }: { guideId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/guides/${guideId}/recommend`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '推薦の取得に失敗しました')
        return
      }
      router.refresh()
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 px-5 py-4 text-sm font-semibold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-300 dark:hover:border-cyan-600 dark:hover:bg-cyan-950/30"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            関連書籍を検索中…
          </span>
        ) : (
          '関連書籍を探す'
        )}
      </button>
      {error && (
        <p className="text-center text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
