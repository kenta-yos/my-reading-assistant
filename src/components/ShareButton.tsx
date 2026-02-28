'use client'

import { useState } from 'react'

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    const text = `${title} - 読書アシスタントLuka`

    // Web Share API が使えればそちらを使う
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url })
        return
      } catch {
        // ユーザーがキャンセルした場合は何もしない
        return
      }
    }

    // フォールバック: クリップボードにコピー
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-500 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-indigo-800 dark:hover:text-indigo-400"
    >
      {copied ? 'コピーしました' : '共有'}
    </button>
  )
}
