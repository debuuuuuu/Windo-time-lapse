import type { TimerOverlayMode } from '../constants/timerOverlay'
import { formatDuration } from './formatDuration'

export function resolveTimerDisplayMs(
  mode: TimerOverlayMode,
  wallElapsedMs: number,
  focusRemainingMs: number | null,
  isFocusTimerEnabled: boolean,
): number {
  if (mode === 'focus' && isFocusTimerEnabled && focusRemainingMs !== null) {
    return focusRemainingMs
  }
  return wallElapsedMs
}

export function formatTimerDisplay(ms: number): string {
  return formatDuration(ms)
}
