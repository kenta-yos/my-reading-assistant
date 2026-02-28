'use client'

import { useState } from 'react'

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    const text = `${title} - 読書アシスタントLuka`

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url })
        return
      } catch {
        return
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBluesky = () => {
    const url = window.location.href
    const text = `${title}\n読書アシスタントLukaで前提知識ガイドを生成しました`
    const bskyUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(text + '\n' + url)}`
    window.open(bskyUrl, '_blank', 'noopener,noreferrer')
  }

  const handleX = () => {
    const url = window.location.href
    const text = `${title}\n読書アシスタントLukaで前提知識ガイドを生成しました`
    const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(xUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleShare}
        title={copied ? 'コピーしました' : '共有'}
        className="rounded-lg border border-stone-200 p-1.5 text-stone-500 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-indigo-800 dark:hover:text-indigo-400"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-500">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
          </svg>
        )}
      </button>
      <button
        onClick={handleX}
        title="Xに投稿"
        className="rounded-lg border border-stone-200 p-1.5 text-stone-500 transition hover:border-stone-400 hover:text-stone-900 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:text-stone-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
      <button
        onClick={handleBluesky}
        title="Blueskyに投稿"
        className="rounded-lg border border-stone-200 p-1.5 text-stone-500 transition hover:border-sky-200 hover:text-sky-500 dark:border-stone-700 dark:text-stone-400 dark:hover:border-sky-800 dark:hover:text-sky-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 568 501" fill="currentColor" className="h-4 w-4">
          <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.889-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C10.945 203.659 1 75.291 1 57.946 1-28.906 76.135-1.612 123.121 33.664z" />
        </svg>
      </button>
    </div>
  )
}
