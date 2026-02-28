import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import Image from 'next/image'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '読書アシスタントLuka',
  description: '読む前に、Lukaに聞いてみて。本のタイトルかURLを入れるだけ。',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      >
        <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/95 backdrop-blur-sm dark:border-stone-800/80 dark:bg-stone-950/95">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <Image
                src="/luka.png"
                alt="Luka"
                width={28}
                height={28}
                className="rounded-full transition group-hover:opacity-90"
              />
              <span className="font-semibold text-stone-900 dark:text-stone-50">Luka</span>
            </Link>
            <Link
              href="/guides"
              className="rounded-lg px-3 py-1.5 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            >
              ガイド一覧
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">{children}</main>
        <footer className="border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-1.5 px-4 py-4">
            <a
              href="https://bsky.app/profile/yomuhito21.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-400 transition hover:text-sky-500 dark:text-stone-500 dark:hover:text-sky-400"
            >
              機能要望・フィードバックはこちら（@yomuhito21.bsky.social）
            </a>
            <a
              href="https://ofuse.me/bdd35efd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-400 transition hover:text-indigo-500 dark:text-stone-500 dark:hover:text-indigo-400"
            >
              Lukaを応援する
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
