'use client'

import Link from 'next/link'

export default function NavLinks() {
  return (
    <Link
      href="/guides"
      className="rounded-lg px-3 py-1.5 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
    >
      ガイド一覧
    </Link>
  )
}
