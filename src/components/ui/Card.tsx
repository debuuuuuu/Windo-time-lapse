import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  id?: string
}

export function Card({ children, className = '', title, subtitle, id }: CardProps) {
  const titleId = title && id ? `${id}-title` : undefined

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={`bg-white rounded-2xl shadow-sm border-2 border-[#E5E5EA] overflow-hidden ${className}`}
    >
      {(title || subtitle) && (
        <div className="px-5 pt-5 pb-2">
          {title && (
            <h2 id={titleId} className="text-lg font-bold text-[#1C1C1E]">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-base text-[#48484A] mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}

export function CardDivider() {
  return <div className="h-px bg-[#E5E5EA]" role="separator" />
}
