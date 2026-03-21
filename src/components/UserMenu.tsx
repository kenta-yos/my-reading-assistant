'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'

export default function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (status === 'loading') {
    return <div className="h-7 w-7 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        ログイン
      </Link>
    )
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-stone-100 dark:hover:bg-stone-800"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            {session.user?.name?.[0] ?? '?'}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white p-2 shadow-lg ring-1 ring-stone-200/60 dark:bg-stone-900 dark:ring-stone-700/60">
          <p className="px-3 py-2 text-xs text-stone-500 dark:text-stone-400 truncate">
            {session.user?.email}
          </p>
          <a
            href="/bookmarks"
            className="block rounded-lg px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            ★ ブックマーク
          </a>
          <button
            onClick={() => signOut()}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            ログアウト
          </button>
          <div className="my-1 h-px bg-stone-100 dark:bg-stone-800" />
          <button
            onClick={async () => {
              if (!confirm('本当に退会しますか？アカウントとブックマークが削除されます。この操作は取り消せません。')) return
              await fetch('/api/account/delete', { method: 'DELETE' })
              signOut()
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-xs text-stone-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            退会する
          </button>
        </div>
      )}
    </div>
  )
}
