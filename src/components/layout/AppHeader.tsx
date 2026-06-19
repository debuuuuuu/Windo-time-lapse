import { useState } from 'react'
import { Download, History, Timer, User, ExternalLink, X } from 'lucide-react'
import { useTimelapse } from '../../context/TimelapseProvider'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { formatDuration } from '../../utils/formatDuration'
import { HistoryPanel } from './HistoryPanel'

const PORTFOLIO_URL = 'https://debuuuuu-potfolio.vercel.app/'

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

/** About me modal */
function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="support-modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="support-close-btn"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="support-avatar" aria-hidden="true">
          <User className="w-6 h-6 text-white/70" />
        </div>

        <h2 id="about-title" className="support-title">
          Hey, I'm Debu 👋
        </h2>

        <p className="support-body">
          I'm a developer who builds things that scratch my own itch. This app
          started because I couldn't find a timelapse tool that was free,
          offline, and didn't need an account — so I built one.
        </p>

        <p className="support-body">
          I'm planning to keep building — scheduled recording, motion-triggered
          capture, and a proper <strong>Chrome Web Store extension</strong> are
          next. It's an ongoing project, not a one-time upload.
        </p>

        {/* Divider */}
        <div className="support-divider" aria-hidden="true" />

        {/* Portfolio link */}
        <div className="support-footer-links">
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="support-link-btn support-link-btn-primary"
          >
            <User className="w-3.5 h-3.5" />
            See my other work
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>
    </div>
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
  const [supportOpen, setSupportOpen] = useState(false)
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

          {/* Focus timer toggle */}
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

          {/* ── About me / Support modal trigger ── */}
          <button
            type="button"
            id="support-btn"
            onClick={() => setSupportOpen(true)}
            className="glass-chip history-btn"
            aria-label="About me"
          >
            <User className="w-3.5 h-3.5" aria-hidden="true" />
            About me
          </button>
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

      {/* Support modal */}
      {supportOpen && <AboutModal onClose={() => setSupportOpen(false)} />}
    </>
  )
}
