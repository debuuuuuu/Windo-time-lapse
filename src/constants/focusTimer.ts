export interface FocusTimerOption {
  value: number
  label: string
}

export const FOCUS_TIMER_OFF = 0
export const FOCUS_TIMER_CUSTOM = -1

export const FOCUS_TIMER_PRESETS: FocusTimerOption[] = [
  { value: FOCUS_TIMER_OFF, label: 'Off' },
  { value: 25 * 60 * 1000, label: '25 min' },
  { value: 50 * 60 * 1000, label: '50 min' },
  { value: FOCUS_TIMER_CUSTOM, label: 'Custom' },
]

export const DEFAULT_FOCUS_CUSTOM_MINUTES = 25
export const PREFERRED_FOCUS_TIMER_KEY = 'preferredFocusTimerMs'
export const PREFERRED_FOCUS_CUSTOM_MINUTES_KEY = 'preferredFocusCustomMinutes'
