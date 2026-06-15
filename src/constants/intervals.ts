export interface IntervalOption {
  value: number
  label: string
}

export const CAPTURE_INTERVALS: IntervalOption[] = [
  { value: 500, label: '0.5 Seconds' },
  { value: 1000, label: '1 Second' },
  { value: 5000, label: '5 Seconds' },
  { value: 10000, label: '10 Seconds' },
  { value: 30000, label: '30 Seconds' },
  { value: -1, label: 'Custom' },
]

export const CUSTOM_INTERVAL_VALUE = -1

export const DEFAULT_INTERVAL_MS = 1000

export const JPEG_QUALITY = 0.82

export const STORAGE_REFRESH_EVERY_N_FRAMES = 10
