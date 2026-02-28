'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BookSearchInput, { type SelectedBook } from './BookSearchInput'

const PROGRESS_STEPS_URL = [
  { message: 'ページの内容を取得しています...', percent: 12 },
  { message: '内容をルカが読み込んでいます...', percent: 28 },
  { message: '前提知識を洗い出しています...', percent: 48 },
  { message: 'ガイドを構成しています...', percent: 68 },
  { message: 'もうすぐ完成です...', percent: 88 },
]

const PROGRESS_STEPS_BOOK = [
  { message: '書籍情報を確認しています...', percent: 12 },
  { message: 'ルカが調べています...', percent: 28 },
  { message: '前提知識を洗い出しています...', percent: 48 },
  { message: 'ガイドを構成しています...', percent: 68 },
  { message: 'もうすぐ完成です...', percent: 88 },
]

// 各ステップに進むまでの秒数（累積）
const STEP_TIMES = [0, 5, 11, 18, 26]

function ProgressDisplay({
  inputType,
  startedAt,
}: {
  inputType: 'URL' | 'BOOK_TITLE'
  startedAt: number
}) {
  const steps = inputType === 'URL' ? PROGRESS_STEPS_URL : PROGRESS_STEPS_BOOK
  const [stepIndex, setStepIndex] = useState(0)
  const [displayPercent, setDisplayPercent] = useState(0)

  useEffect(() => {
    setStepIndex(0)
    setDisplayPercent(0)

    const timers: ReturnType<typeof setTimeout>[] = []

    // ステップを時間で切り替え
    STEP_TIMES.forEach((sec, i) => {
      const elapsed = Date.now() - startedAt
      const delay = Math.max(0, sec * 1000 - elapsed)
      timers.push(
        setTimeout(() => {
          setStepIndex(i)
          setDisplayPercent(steps[i].percent)
        }, delay)
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [startedAt, inputType, steps])

  return (
    <div className="space-y-3">
      {/* プログレスバー */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div
          className="h-2 rounded-full bg-indigo-500 transition-all duration-1000 ease-out"
          style={{ width: `${displayPercent}%` }}
        />
        {/* 光るアニメーション */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      {/* メッセージとパーセント */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-stone-600 dark:text-stone-400">
            {steps[stepIndex].message}
          </span>
        </div>
        <span className="text-xs tabular-nums text-stone-400">{displayPercent}%</span>
      </div>

      <p className="text-xs text-stone-400">このままお待ちください。</p>
    </div>
  )
}

export default function GuideForm() {
  const router = useRouter()
  const [inputType, setInputType] = useState<'URL' | 'BOOK_TITLE'>('BOOK_TITLE')
  const [urlValue, setUrlValue] = useState('')
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [startedAt, setStartedAt] = useState(0)
  const [error, setError] = useState('')
  const startedAtRef = useRef(0)

  const canSubmit =
    !isLoading && (inputType === 'URL' ? urlValue.trim().length > 0 : selectedBook !== null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const now = Date.now()
    setIsLoading(true)
    setStartedAt(now)
    startedAtRef.current = now
    setError('')

    const payload =
      inputType === 'URL'
        ? { inputType: 'URL', inputValue: urlValue.trim() }
        : {
            inputType: 'BOOK_TITLE',
            inputValue: selectedBook!.title,
            bookMetadata: selectedBook,
          }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let message = `サーバーエラー (${res.status})`
        try {
          const data = await res.json()
          message = data.error || message
        } catch {
          // JSON parse failed — likely HTML error page (e.g. Vercel timeout)
        }
        setError(message)
        return
      }

      const data = await res.json()
      // ページ遷移でアンマウントされるので loading は解除しない
      router.push(`/guides/${data.id}`)
    } catch {
      setError('ネットワークエラーが発生しました。通信状況を確認してください。')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* 入力タイプ切り替え */}
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
        <button
          type="button"
          onClick={() => setInputType('BOOK_TITLE')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
            inputType === 'BOOK_TITLE'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          📚 本のタイトル
        </button>
        <button
          type="button"
          onClick={() => setInputType('URL')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
            inputType === 'URL'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          🔗 ウェブ記事
        </button>
      </div>

      {/* 入力エリア */}
      {inputType === 'BOOK_TITLE' ? (
        <BookSearchInput
          selected={selectedBook}
          onSelect={setSelectedBook}
          onClear={() => setSelectedBook(null)}
        />
      ) : (
        <div className="space-y-1.5">
          <input
            type="url"
            value={urlValue}
            onChange={e => setUrlValue(e.target.value)}
            placeholder="https://..."
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <p className="text-xs text-slate-500">
            ニュース記事・ブログ・解説記事など、気になるウェブページのURLを貼り付けてください
          </p>
        </div>
      )}

      {/* エラー */}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          ⚠ {error}
        </p>
      )}

      {/* 進捗表示 */}
      {isLoading && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
          <ProgressDisplay inputType={inputType} startedAt={startedAt} />
        </div>
      )}

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
      >
        {isLoading ? 'ガイド作成中...' : 'ルカにガイドを頼む'}
      </button>
    </form>
  )
}
