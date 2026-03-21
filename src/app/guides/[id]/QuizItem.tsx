'use client'

import { useState } from 'react'

export default function QuizItem({
  index,
  question,
  answer,
  topic,
}: {
  index: number
  question: string
  answer: string
  topic: string
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="rounded-lg border border-stone-200 dark:border-stone-700">
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            {index + 1}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed text-stone-900 dark:text-stone-100">
              {question}
            </p>
            <span className="mt-1 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:bg-stone-700 dark:text-stone-400">
              {topic}
            </span>
          </div>
          <span className="mt-0.5 flex-shrink-0 text-xs text-violet-400">
            {revealed ? '隠す' : '答えを見る'}
          </span>
        </div>
      </button>
      {revealed && (
        <div className="border-t border-stone-100 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/50">
          <p className="pl-8 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}
