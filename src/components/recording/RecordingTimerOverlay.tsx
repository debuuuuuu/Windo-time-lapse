import { useTimelapse } from '../../context/TimelapseProvider'
import { formatTimerDisplay, resolveTimerDisplayMs } from '../../utils/timerDisplay'
import type { TimerOverlayMode } from '../../constants/timerOverlay'

export function RecordingTimerOverlay() {
  const {
    isRecording,
    wallElapsedMs,
    focusRemainingMs,
    focusDurationMs,
    isFocusTimerEnabled,
    timerMode,
    timerOverlayVisible,
    setTimerMode,
  } = useTimelapse()

  if (!timerOverlayVisible) return null

  const displayMs = isRecording
    ? resolveTimerDisplayMs(
        timerMode,
        wallElapsedMs,
        focusRemainingMs,
        isFocusTimerEnabled,
      )
    : timerMode === 'focus' && isFocusTimerEnabled && focusDurationMs
      ? focusDurationMs
      : 0

  return (
    <div className="recording-timer-host pointer-events-none">
      <div className="recording-timer-overlay">
        <div
          className="recording-timer-display timer-slashed-zero"
          aria-live={isRecording ? 'polite' : 'off'}
          aria-label={`Recording timer ${formatTimerDisplay(displayMs)}`}
        >
          {formatTimerDisplay(displayMs)}
        </div>
        <TimerModePill
          mode={timerMode}
          focusAvailable={isFocusTimerEnabled}
          onModeChange={setTimerMode}
        />
        {!isRecording && (
          <span className="recording-timer-idle-hint">Starts on Record</span>
        )}
      </div>
    </div>
  )
}

function TimerModePill({
  mode,
  focusAvailable,
  onModeChange,
}: {
  mode: TimerOverlayMode
  focusAvailable: boolean
  onModeChange: (mode: TimerOverlayMode) => void
}) {
  return (
    <div className="recording-timer-mode-pill pointer-events-auto">
      <span className="recording-timer-mode-label">MODE:</span>
      <button
        type="button"
        className={`recording-timer-mode-btn ${mode === 'stopwatch' ? 'recording-timer-mode-active' : ''}`}
        onClick={() => onModeChange('stopwatch')}
      >
        Stopwatch
      </button>
      <span className="recording-timer-mode-sep" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        disabled={!focusAvailable}
        className={`recording-timer-mode-btn ${mode === 'focus' ? 'recording-timer-mode-active' : ''}`}
        onClick={() => onModeChange('focus')}
        title={focusAvailable ? 'Count down focus time' : 'Set focus timer in dock first'}
      >
        Focus Timer
      </button>
    </div>
  )
}
