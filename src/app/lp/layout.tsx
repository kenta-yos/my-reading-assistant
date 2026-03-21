export default function LPLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--background)]">
      {children}
    </div>
  )
}
