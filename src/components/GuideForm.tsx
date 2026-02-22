'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BookSearchInput, { type SelectedBook } from './BookSearchInput'

export default function GuideForm() {
  const router = useRouter()
  const [inputType, setInputType] = useState<'URL' | 'BOOK_TITLE'>('BOOK_TITLE')
  const [urlValue, setUrlValue] = useState('')
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit =
    !isLoading && (inputType === 'URL' ? urlValue.trim().length > 0 : selectedBook !== null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsLoading(true)
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

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '生成に失敗しました')
        return
      }

      router.push(`/guides/${data.id}`)
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
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
          🔗 URL
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
        <input
          type="url"
          value={urlValue}
          onChange={e => setUrlValue(e.target.value)}
          placeholder="https://example.com/article"
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
      )}

      {/* エラー */}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          ⚠ {error}
        </p>
      )}

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            ルカが調べています...（30秒ほどかかります）
          </span>
        ) : (
          'ルカにガイドを頼む'
        )}
      </button>
    </form>
  )
}
