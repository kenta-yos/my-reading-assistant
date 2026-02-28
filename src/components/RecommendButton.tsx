'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'idle' | 'loading' | 'ndl' | 'ndl_done' | 'ai' | 'saving' | 'done'

const STEP_CONFIG: Record<Step, { label: string; percent: number }> = {
  idle:     { label: '', percent: 0 },
  loading:  { label: 'ガイド情報を読み込み中…', percent: 5 },
  ndl:      { label: '関連書籍を探しています…', percent: 15 },
  ndl_done: { label: '候補が見つかりました', percent: 30 },
  ai:       { label: 'AIが候補を評価中…', percent: 40 },
  saving:   { label: '結果を保存中…', percent: 90 },
  done:     { label: '完了しました', percent: 100 },
}

// AI評価中にゆっくりパーセンテージを進めるフック
function useAnimatedPercent(step: Step) {
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const target = STEP_CONFIG[step].percent
    setPercent(target)

    // AI ステップ中は 40% → 85% までゆっくり進める
    if (step !== 'ai') return

    let current = target
    const id = setInterval(() => {
      current += 0.5
      if (current >= 85) {
        clearInterval(id)
        return
      }
      setPercent(Math.round(current))
    }, 500)

    return () => clearInterval(id)
  }, [step])

  return percent
}

export default function RecommendButton({ guideId }: { guideId: string }) {
  const [step, setStep] = useState<Step>('idle')
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const percent = useAnimatedPercent(step)

  const loading = step !== 'idle' || isPending

  const handleClick = async () => {
    setStep('loading')
    setError(null)

    try {
      const res = await fetch(`/api/guides/${guideId}/recommend`, { method: 'POST' })

      if (!res.body) {
        setError('ストリームを取得できませんでした')
        setStep('idle')
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
              const s = data.step as Step
              setStep(s)
              setProgressMessage(data.message || STEP_CONFIG[s]?.label || '')
            } else if (eventType === 'error') {
              setError(data.error)
              setStep('idle')
              return
            } else if (eventType === 'done') {
              setStep('done')
              // startTransition で refresh 完了を待つ
              startTransition(() => {
                router.refresh()
              })
              return
            }
          }
        }
      }
    } catch {
      setError('通信エラーが発生しました')
      setStep('idle')
    }
  }

  // refresh 完了後にリセット
  useEffect(() => {
    if (step === 'done' && !isPending) {
      setStep('idle')
    }
  }, [step, isPending])

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 px-5 py-4 text-sm font-semibold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-300 dark:hover:border-cyan-600 dark:hover:bg-cyan-950/30"
      >
        {loading ? (
          <span className="flex flex-col items-center gap-2">
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              関連書籍を検索中
            </span>
            {/* プログレスバー */}
            <span className="flex w-full items-center gap-2">
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-cyan-100 dark:bg-cyan-900/40">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-cyan-400 transition-all duration-700 ease-out dark:bg-cyan-500"
                  style={{ width: `${percent}%` }}
                />
              </span>
              <span className="w-8 text-right text-xs tabular-nums text-cyan-500 dark:text-cyan-400">
                {percent}%
              </span>
            </span>
            {progressMessage && (
              <span className="text-xs font-normal text-cyan-500 dark:text-cyan-400">
                {progressMessage}
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
