import { useState } from 'react'
import { Download, History, Timer } from 'lucide-react'
import { useTimelapse } from '../../context/TimelapseProvider'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { formatDuration } from '../../utils/formatDuration'
import { HistoryPanel } from './HistoryPanel'

/** Animated countdown ring progress indicator */
function CountdownRing({
  remainingMs,
  totalMs,
  size = 20,
}: {
  remainingMs: number
  totalMs: number
  size?: number
}) {
  const r = (size - 3) / 2
  const circ = 2 * Math.PI * r
  const progress = Math.max(0, Math.min(1, remainingMs / totalMs))
  const dash = circ * progress

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0 -rotate-90"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={2.5}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#60a5fa"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        className="motion-safe:transition-all motion-safe:duration-1000"
      />
    </svg>
  )
}

export function AppHeader() {
  const {
    isRecording,
    frameCount,
    wallElapsedMs,
    focusRemainingMs,
    focusDurationMs,
    isFocusTimerEnabled,
  } = useTimelapse()
  const { canInstall, install } = useInstallPrompt()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [showFocusInHeader, setShowFocusInHeader] = useState(() => {
    return localStorage.getItem('showFocusInHeader') !== 'false'
  })

  const toggleFocusHeader = () => {
    const next = !showFocusInHeader
    setShowFocusInHeader(next)
    localStorage.setItem('showFocusInHeader', String(next))
  }

  const showFocusChip =
    isRecording &&
    isFocusTimerEnabled &&
    focusRemainingMs !== null &&
    focusDurationMs !== null &&
    showFocusInHeader

  return (
    <>
      <header
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4 pointer-events-none"
        role="banner"
      >
        <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
          <img
            src={`${import.meta.env.BASE_URL}favicon.png`}
            alt=""
            width={24}
            height={24}
            className="w-6 h-6 rounded-sm drop-shadow-lg"
            aria-hidden="true"
          />
          <h1 className="text-base font-semibold text-white tracking-tight drop-shadow-lg">
            Timelapse Recorder
          </h1>
          {canInstall ? (
            <button
              type="button"
              onClick={() => void install()}
              className="glass-chip install-btn"
              aria-label="Install app to pin in browser or taskbar"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Install
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            disabled={isRecording}
            className="glass-chip history-btn"
            aria-label="Open session history"
            aria-expanded={historyOpen}
          >
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            History
          </button>

          {/* Focus timer toggle (only shows when timer is enabled and not recording, or always via settings) */}
          {isFocusTimerEnabled && !isRecording && (
            <button
              type="button"
              onClick={toggleFocusHeader}
              className={`glass-chip history-btn ${showFocusInHeader ? 'focus-header-chip-active' : ''}`}
              aria-label={showFocusInHeader ? 'Hide focus countdown from header' : 'Show focus countdown in header'}
              title={showFocusInHeader ? 'Hide countdown from header' : 'Show countdown in header'}
            >
              <Timer className="w-3.5 h-3.5" aria-hidden="true" />
              {showFocusInHeader ? 'Countdown on' : 'Countdown off'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
          {/* Focus timer countdown chip */}
          {showFocusChip && focusRemainingMs !== null && focusDurationMs !== null && (
            <div
              className="glass-chip focus-countdown-chip"
              role="timer"
              aria-label={`Focus timer: ${formatDuration(focusRemainingMs)} remaining`}
              aria-live="off"
            >
              <CountdownRing remainingMs={focusRemainingMs} totalMs={focusDurationMs} />
              <span className="tabular-nums text-blue-300 font-semibold">
                {formatDuration(focusRemainingMs)}
              </span>
            </div>
          )}

          {isRecording ? (
            <>
              <span className="glass-chip glass-chip-rec" role="status" aria-label="Recording active">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-fast" aria-hidden="true" />
                REC
              </span>
              <span className="glass-chip tabular-nums" aria-label={`${frameCount} frames, ${formatDuration(wallElapsedMs)} elapsed`}>
                {frameCount} · {formatDuration(wallElapsedMs)}
              </span>
            </>
          ) : (
            <span className="glass-chip" role="status">
              <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
              Live
            </span>
          )}
        </div>
      </header>

      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}
