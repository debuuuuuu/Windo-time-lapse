import { useState } from 'react'
import { Download, History } from 'lucide-react'
import { useTimelapse } from '../../context/TimelapseProvider'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { formatDuration } from '../../utils/formatDuration'
import { HistoryPanel } from './HistoryPanel'

export function AppHeader() {
  const { isRecording, frameCount, wallElapsedMs } = useTimelapse()
  const { canInstall, install } = useInstallPrompt()
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
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
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {isRecording ? (
            <>
              <span className="glass-chip glass-chip-rec">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-fast" />
                REC
              </span>
              <span className="glass-chip tabular-nums">
                {frameCount} · {formatDuration(wallElapsedMs)}
              </span>
            </>
          ) : (
            <span className="glass-chip">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Live
            </span>
          )}
        </div>
      </header>

      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}
