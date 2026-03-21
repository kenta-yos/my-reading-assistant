import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import Image from 'next/image'
import Providers from '@/components/Providers'
import UserMenu from '@/components/UserMenu'
import NavLinks from '@/components/NavLinks'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: '読書アシスタントLuka',
    template: '%s | Luka',
  },
  description: 'どんな内容？自分に読める？前提知識は？——本のタイトルやURLを入れるだけで、ルカが読書の準備をまるごとサポート。',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: '読書アシスタントLuka',
    title: '読書アシスタントLuka',
    description: 'どんな内容？自分に読める？前提知識は？——本のタイトルやURLを入れるだけで、ルカが読書の準備をまるごとサポート。',
    images: ['/luka.png'],
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary',
    title: '読書アシスタントLuka',
    description: 'どんな内容？自分に読める？前提知識は？——本のタイトルやURLを入れるだけで、ルカが読書の準備をまるごとサポート。',
    images: ['/luka.png'],
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
        <Providers>
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
              <div className="flex items-center gap-1">
                <NavLinks />
                <UserMenu />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">{children}</main>
          <footer className="border-t border-stone-200/80 dark:border-stone-800/80">
            <div className="mx-auto max-w-3xl px-4 py-6 text-center space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-stone-400 dark:text-stone-500">
                <Link href="/terms" className="transition hover:text-stone-600 dark:hover:text-stone-300">利用規約</Link>
                <span>·</span>
                <Link href="/privacy" className="transition hover:text-stone-600 dark:hover:text-stone-300">プライバシーポリシー</Link>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
