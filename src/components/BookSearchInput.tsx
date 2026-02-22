'use client'

import { useState, useEffect, useRef } from 'react'
import type { BookCandidate } from '@/app/api/books/search/route'

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
  const [results, setResults] = useState<BookCandidate[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

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

  // デバウンス検索
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
        const data: BookCandidate[] = await res.json()
        setResults(data)
        setIsOpen(data.length > 0)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (book: BookCandidate) => {
    onSelect({
      title: book.title,
      authors: book.authors,
      publisher: book.publisher,
      year: book.year,
      isbn: book.isbn,
    })
    setQuery('')
    setIsOpen(false)
    setResults([])
  }

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
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="書名を入力（例：サピエンス全史）"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-10 text-base text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
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

      {/* ドロップダウン */}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {results.map(book => (
            <li key={book.id}>
              <button
                type="button"
                onClick={() => handleSelect(book)}
                className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2 text-sm">
                  {book.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {[
                    book.authors.slice(0, 2).join('・') + (book.authors.length > 2 ? ' ほか' : ''),
                    book.publisher,
                    book.year ? `${book.year}年` : '',
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
  )
}
