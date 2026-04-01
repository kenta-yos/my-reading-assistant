import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '読書アシスタントLuka — 読みたい気持ちを、あと押しする',
  description: 'どんな内容？自分に読める？前提知識は？——本のタイトルを入れるだけで、AIが読書の準備をまるごとサポート。',
}

export default function LandingPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-indigo-900 to-stone-950 px-6 py-16 text-center sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_70%)]" />
        <div className="relative mx-auto max-w-2xl">
          <Image
            src="/luka.png"
            alt="Luka"
            width={80}
            height={80}
            className="mx-auto rounded-full shadow-2xl shadow-indigo-500/20 ring-2 ring-white/10"
            priority
          />
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            その本、読む前に
            <br />
            <span className="text-indigo-300">ルカに相談してみて</span>
          </h1>
          <p className="mx-auto mt-4 px-4 text-xs leading-relaxed text-indigo-200/80 sm:px-0 sm:text-base">
            本のタイトルを入れるだけで、
            <br className="sm:hidden" />
            AIが読書の準備をまるごとサポートします。
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-indigo-900 shadow-lg shadow-white/10 transition hover:bg-indigo-50 hover:shadow-xl"
          >
            無料で使ってみる
          </Link>
        </div>
      </section>

      {/* ── 悩み共感 ── */}
      <section className="bg-stone-50 px-6 py-12 dark:bg-stone-950 sm:py-16">
        <div className="mx-auto max-w-xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            こんな経験、ありませんか？
          </p>
          <div className="mt-6 space-y-3">
            {[
              '気になる本を見つけたけど、自分に理解できるか不安で手が出せない',
              '読み始めたものの、前提知識が足りずに途中で挫折してしまった',
              'この本が結局何を言いたいのか、読む前にざっくり知りたい',
              '同じテーマの本がたくさんあって、どれを選べばいいかわからない',
            ].map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl bg-white/80 px-4 py-3.5 shadow-sm ring-1 ring-stone-950/5 dark:bg-stone-900/80 dark:ring-white/5"
              >
                <span className="mt-0.5 text-sm text-stone-300 dark:text-stone-600">{i + 1}.</span>
                <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lukaができること ── */}
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Lukaが準備してくれること
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { title: 'この本は何を語っているのか', desc: '全体像と著者の問いを整理。読む前に「地図」を手に入れる。' },
              { title: '自分に読めるかどうか', desc: '難易度とつまずきポイントを具体的に。不安を安心に変える。' },
              { title: '知っておくべきキーワード', desc: '専門用語や背景知識を事前に把握。読み始めてから戸惑わない。' },
              { title: 'この本ならではの価値', desc: '他の本との違いと、読後に得られる視点を明確に。' },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/80 p-5 shadow-sm ring-1 ring-stone-950/5 dark:bg-stone-900/80 dark:ring-white/5"
              >
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 使い方 ── */}
      <section className="bg-stone-50 px-6 py-12 dark:bg-stone-950 sm:py-16">
        <div className="mx-auto max-w-xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            使い方はシンプル
          </p>
          <div className="mt-6 space-y-5">
            {[
              { step: '1', title: '本のタイトルを入力', desc: '書名を入れるか、バーコードをスキャン。ウェブ記事のURLでもOK。' },
              { step: '2', title: 'ルカがガイドを生成', desc: 'AIが書籍情報を分析し、30秒ほどで読書ガイドを作成します。' },
              { step: '3', title: '読む準備が整う', desc: 'すべてがわかった状態で本を開けます。' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">{item.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 開発者 ── */}
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-sm">
          <div className="rounded-xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-950/5 dark:bg-stone-900/80 dark:ring-white/5">
            <div className="flex items-center gap-4">
              <Image
                src="/ken_blue.png"
                alt="Kenta"
                width={48}
                height={48}
                className="flex-shrink-0 rounded-full"
              />
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-50">Kenta</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">学術と日常をつなぐ</p>
                <a
                  href="https://linktr.ee/ken_book_lover"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-block text-xs font-medium text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  @ken_book_lover
                </a>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              「難しそうで手が出ない」を「読んでみようかな」に変えたくて、Lukaをつくりました。
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-stone-950 px-6 py-14 text-center sm:py-16">
        <div className="mx-auto max-w-lg">
          <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            次に読む本、決まってますか？
          </h2>
          <p className="mt-3 text-sm text-indigo-200/80">
            タイトルを入れるだけ。読む準備は、ルカにおまかせ。
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-indigo-900 shadow-lg shadow-white/10 transition hover:bg-indigo-50 hover:shadow-xl"
          >
            無料で使ってみる
          </Link>
          <p className="mt-3 text-xs text-indigo-300/60">
            ログインなしでも2回無料でお試しいただけます
          </p>
        </div>
      </section>
    </div>
  )
}
