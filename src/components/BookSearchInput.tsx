'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Candidate } from '@/app/api/books/search/route'
import BarcodeScanner from './BarcodeScanner'

export type SelectedBook = {
  title: string
  authors: string[]
  publisher: string
  year: string
  isbn: string
}

type Props = {
  onSelect: (book: SelectedBook) => void
  onClear: () => void
  selected: SelectedBook | null
}

export default function BookSearchInput({ onSelect, onClear, selected }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Candidate[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 外クリックでドロップダウンを閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Candidate → SelectedBook 変換
  const toSelectedBook = (c: Candidate): SelectedBook => ({
    title: c.title,
    authors: c.author ? c.author.split('／') : [],
    publisher: c.publisherName,
    year: c.publishedYear ? String(c.publishedYear) : '',
    isbn: c.isbn ?? '',
  })

  // デバウンス検索
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsSearching(true)
      try {
        const res = await fetch(
          `/api/books/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        )
        const data: { candidates: Candidate[] } = await res.json()
        setResults(data.candidates)
        setIsOpen(data.candidates.length > 0)
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (candidate: Candidate) => {
    onSelect(toSelectedBook(candidate))
    setQuery('')
    setIsOpen(false)
    setResults([])
  }

  // バーコードスキャン完了
  const handleBarcodeScan = useCallback(
    async (isbn: string) => {
      setShowScanner(false)
      setIsSearching(true)
      try {
        const res = await fetch(
          `/api/books/search?q=${encodeURIComponent(`isbn:${isbn}`)}`,
        )
        const data: { candidates: Candidate[] } = await res.json()
        if (data.candidates.length > 0) {
          onSelect(toSelectedBook(data.candidates[0]))
        } else {
          setQuery(isbn)
        }
      } catch {
        setQuery(isbn)
      } finally {
        setIsSearching(false)
      }
    },
    [onSelect],
  )

  // 選択済みの表示
  if (selected) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/30">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
              {selected.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500 dark:text-slate-400">
              {selected.authors.length > 0 && (
                <span>著者: {selected.authors.slice(0, 2).join('、')}{selected.authors.length > 2 ? ' ほか' : ''}</span>
              )}
              {selected.publisher && <span>· {selected.publisher}</span>}
              {selected.year && <span>· {selected.year}年</span>}
              {selected.isbn && (
                <span className="text-xs text-slate-400">ISBN: {selected.isbn}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex-shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="選択を解除"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="書名を入力（例：サピエンス全史）"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-20 text-base text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {/* カメラ（バーコード）ボタン */}
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="text-slate-400 hover:text-indigo-500 transition-colors"
              aria-label="バーコードで検索"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
            </button>
            {/* 検索インジケーター / アイコン */}
            <div className="text-slate-400">
              {isSearching ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* ドロップダウン */}
        {isOpen && results.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {results.map((candidate, i) => (
              <li key={candidate.isbn ?? i}>
                <button
                  type="button"
                  onClick={() => handleSelect(candidate)}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2 text-sm">
                    {candidate.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {[
                      candidate.author,
                      candidate.publisherName,
                      candidate.publishedYear ? `${candidate.publishedYear}年` : '',
                    ].filter(Boolean).join('　')}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 2文字以上で結果なし */}
        {isOpen && !isSearching && results.length === 0 && query.length >= 2 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            「{query}」に一致する本が見つかりませんでした
          </div>
        )}
      </div>

      {/* バーコードスキャナーモーダル */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  )
}
