'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEP_LABELS: Record<string, string> = {
  loading: 'ガイド情報を読み込み中…',
  ndl: '関連書籍を探しています…',
  ndl_done: '候補が見つかりました',
  ai: 'AIが候補を評価中…',
  saving: '結果を保存中…',
}

export default function RecommendButton({ guideId }: { guideId: string }) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    setProgress('')

    try {
      const res = await fetch(`/api/guides/${guideId}/recommend`, { method: 'POST' })

      if (!res.body) {
        setError('ストリームを取得できませんでした')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7)
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (eventType === 'progress') {
              const label = STEP_LABELS[data.step] || data.message
              // ndl_done の場合は件数情報を使う
              setProgress(data.step === 'ndl_done' ? data.message : label)
            } else if (eventType === 'error') {
              setError(data.error)
              return
            } else if (eventType === 'done') {
              router.refresh()
              return
            }
          }
        }
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
      setProgress('')
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
          <span className="flex flex-col items-center gap-1.5">
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              関連書籍を検索中
            </span>
            {progress && (
              <span className="text-xs font-normal text-cyan-500 dark:text-cyan-400">
                {progress}
              </span>
            )}
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
