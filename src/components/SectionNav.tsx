'use client'

import { useEffect, useRef, useState } from 'react'

type SectionItem = { id: string; label: string }

export default function SectionNav({ sections }: { sections: SectionItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ids = sections.map((s) => s.id)
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            setVisible(true)
          }
        }
        // Hide if none are intersecting
        const anyVisible = entries.some((e) => e.isIntersecting)
        if (!anyVisible) {
          // Check if all observed elements are above viewport (scrolled past)
          const allAbove = elements.every((el) => {
            const rect = el.getBoundingClientRect()
            return rect.bottom < 0
          })
          if (!allAbove) {
            // We're above the first section — hide nav
            const firstRect = elements[0].getBoundingClientRect()
            if (firstRect.top > window.innerHeight * 0.3) {
              setVisible(false)
            }
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  const handleClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      setActiveId(id)
    }
  }

  if (sections.length === 0) return null

  return (
    <div
      ref={navRef}
      className={`sticky top-[49px] z-10 border-b border-stone-200/80 bg-white/95 backdrop-blur-sm transition-all duration-300 dark:border-stone-800/80 dark:bg-stone-950/95 ${
        visible
          ? 'opacity-100'
          : 'pointer-events-none max-h-0 overflow-hidden border-b-0 opacity-0'
      }`}
    >
      <nav className="-mx-4 flex flex-wrap gap-1.5 px-4 py-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => handleClick(section.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              activeId === section.id
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
