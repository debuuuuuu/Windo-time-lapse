import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface GlassDropdownOption {
  value: string | number
  label: string
}

interface GlassDropdownProps {
  id?: string
  label: string
  value: string | number
  options: GlassDropdownOption[]
  onChange: (value: string | number) => void
  disabled?: boolean
  placeholder?: string
}

export function GlassDropdown({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder = 'Select…',
}: GlassDropdownProps) {
  const autoId = useId()
  const triggerId = id ?? autoId
  const listId = `${triggerId}-list`
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const displayLabel = selected?.label ?? placeholder

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIndex((i) => Math.min(i + 1, options.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && highlightIndex >= 0) {
        e.preventDefault()
        onChange(options[highlightIndex].value)
        setOpen(false)
      }
    }

    const handleScroll = () => setOpen(false)

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, highlightIndex, options, onChange])

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value)
      setHighlightIndex(idx >= 0 ? idx : 0)
    }
  }, [open, options, value])

  const toggle = () => {
    if (disabled) return
    setOpen((o) => !o)
  }

  return (
    <div ref={rootRef} className="glass-field flex flex-col gap-1 min-w-0">
      <span id={`${triggerId}-label`} className="dock-label">
        {label}
      </span>

      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${triggerId}-label`}
        aria-controls={listId}
        onClick={toggle}
        className={`glass-select-trigger ${open ? 'glass-select-trigger-open' : ''}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-white/50 motion-safe:transition-transform motion-safe:duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={`${triggerId}-label`}
          className="glass-select-menu"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isHighlighted = index === highlightIndex

            return (
              <li
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                className={`glass-select-option ${isSelected ? 'glass-select-option-selected' : ''} ${
                  isHighlighted ? 'glass-select-option-highlight' : ''
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-blue-400" aria-hidden="true" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
