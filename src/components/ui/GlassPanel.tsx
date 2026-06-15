import type { ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  title?: string
  className?: string
  position?: 'left' | 'right' | 'top' | 'bottom'
}

export function GlassPanel({ children, title, className = '', position }: GlassPanelProps) {
  const positionClass =
    position === 'left'
      ? 'left-3 top-14 bottom-3 w-[min(100%,220px)]'
      : position === 'right'
        ? 'right-3 top-14 bottom-3 w-[min(100%,200px)]'
        : position === 'top'
          ? 'left-3 right-3 top-3'
          : ''

  return (
    <div
      className={`glass-panel absolute z-20 flex flex-col gap-2 p-3 rounded-2xl overflow-y-auto overflow-x-hidden ${positionClass} ${className}`}
    >
      {title && (
        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest shrink-0 drop-shadow-sm">
          {title}
        </p>
      )}
      {children}
    </div>
  )
}
