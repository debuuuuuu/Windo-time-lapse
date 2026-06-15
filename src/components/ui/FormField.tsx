import type { ReactNode } from 'react'

interface FormFieldProps {
  id: string
  label: string
  hint?: string
  children: ReactNode
  compact?: boolean
}

export function FormField({ id, label, hint, children, compact, glass }: FormFieldProps & { glass?: boolean }) {
  return (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
      <label
        htmlFor={id}
        className={`font-semibold ${compact ? 'text-xs' : 'text-base'} ${
          glass ? 'text-white drop-shadow-sm' : 'text-[#1C1C1E]'
        }`}
      >
        {label}
      </label>
      {hint && !compact && (
        <p id={`${id}-hint`} className="text-sm text-[#48484A] leading-relaxed -mt-1">
          {hint}
        </p>
      )}
      {children}
    </div>
  )
}

export const selectClassName =
  'w-full min-h-[52px] px-4 text-base text-[#1C1C1E] bg-white border-2 border-[#C7C7CC] rounded-xl focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/20 disabled:bg-[#F2F2F7] disabled:text-[#8E8E93] disabled:cursor-not-allowed'

export const selectCompactClassName =
  'w-full h-9 px-2.5 text-sm text-[#1C1C1E] bg-white border border-[#C7C7CC] rounded-lg focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 disabled:bg-[#F2F2F7] disabled:cursor-not-allowed'

export const inputClassName =
  'w-full min-h-[52px] px-4 text-base text-[#1C1C1E] bg-white border-2 border-[#C7C7CC] rounded-xl focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/20 disabled:bg-[#F2F2F7] disabled:text-[#8E8E93] disabled:cursor-not-allowed'

export const inputCompactClassName =
  'w-full h-9 px-2.5 text-sm text-[#1C1C1E] bg-white border border-[#C7C7CC] rounded-lg focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 disabled:bg-[#F2F2F7] disabled:cursor-not-allowed'

export const buttonPrimaryClassName =
  'w-full min-h-[56px] px-6 text-lg font-semibold text-white bg-[#007AFF] rounded-xl hover:bg-[#0066DD] active:bg-[#0055CC] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export const buttonCompactPrimaryClassName =
  'w-full h-10 px-4 text-sm font-semibold text-white bg-[#007AFF] rounded-lg hover:bg-[#0066DD] active:bg-[#0055CC] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export const buttonDangerClassName =
  'w-full min-h-[56px] px-6 text-lg font-semibold text-white bg-[#FF3B30] rounded-xl hover:bg-[#E0352B] active:bg-[#CC2E26] focus:outline-none focus:ring-4 focus:ring-[#FF3B30]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export const buttonCompactDangerClassName =
  'w-full h-10 px-4 text-sm font-semibold text-white bg-[#FF3B30] rounded-lg hover:bg-[#E0352B] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export const buttonSecondaryClassName =
  'w-full min-h-[52px] px-6 text-base font-semibold text-[#1C1C1E] bg-[#E5E5EA] rounded-xl hover:bg-[#D1D1D6] active:bg-[#C7C7CC] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/20 transition-colors'

export const buttonCompactSecondaryClassName =
  'w-full h-9 px-4 text-sm font-semibold text-[#1C1C1E] bg-[#E5E5EA] rounded-lg hover:bg-[#D1D1D6] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-colors'

export const selectGlassClassName =
  'w-full h-9 px-2.5 text-sm text-white bg-white/15 border border-white/25 rounded-lg backdrop-blur-sm focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed'

export const inputGlassClassName =
  'w-full h-9 px-2.5 text-sm text-white bg-white/15 border border-white/25 rounded-lg backdrop-blur-sm placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed'

export const buttonGlassPrimaryClassName =
  'w-full h-10 px-4 text-sm font-semibold text-white bg-[#007AFF]/90 rounded-lg hover:bg-[#007AFF] backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export const buttonGlassDangerClassName =
  'w-full h-10 px-4 text-sm font-semibold text-white bg-[#FF3B30]/90 rounded-lg hover:bg-[#FF3B30] backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export const buttonGlassSecondaryClassName =
  'w-full h-9 px-4 text-sm font-semibold text-white bg-white/15 border border-white/25 rounded-lg hover:bg-white/25 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors'

export const buttonGlassDeleteClassName =
  'w-full h-9 px-4 text-sm font-semibold text-white bg-[#FF3B30]/25 border border-[#FF3B30]/40 rounded-lg hover:bg-[#FF3B30]/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
