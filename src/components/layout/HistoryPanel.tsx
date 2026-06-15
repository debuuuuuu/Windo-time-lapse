import { useEffect, useRef, useState } from 'react'
import { Clock, Film, Trash2, X } from 'lucide-react'
import { useTimelapse } from '../../context/TimelapseProvider'
import { frameStorage } from '../../services/storage/FrameStorageService'
import type { TimelapseSession } from '../../types/session'
import { getOriginalDurationMs } from '../../types/session'
import { formatDuration } from '../../utils/formatDuration'

interface HistoryPanelProps {
  open: boolean
  onClose: () => void
}

export function HistoryPanel({ open, onClose }: HistoryPanelProps) {
  const { session, isRecording, loadSession, deleteSession } = useTimelapse()
  const [sessions, setSessions] = useState<TimelapseSession[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)

    void frameStorage.listSessions().then((list) => {
      if (!cancelled) {
        setSessions(list.filter((s) => s.frameCount > 0 || s.status === 'recording'))
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, session?.id, session?.frameCount, session?.status])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => panelRef.current?.focus())
    }
  }, [open])

  if (!open) return null

  const handleSelect = (sessionId: string) => {
    if (isRecording) return
    void loadSession(sessionId)
    onClose()
  }

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (isRecording) return
    if (!window.confirm('Delete this session and all its frames?')) return
    void deleteSession(sessionId).then(() => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    })
  }

  return (
    <>
      <button
        type="button"
        className="history-backdrop"
        aria-label="Close history"
        onClick={onClose}
      />

      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        className="history-panel"
      >
        <div className="history-panel-header">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/60" aria-hidden="true" />
            <h2 id="history-title" className="text-sm font-semibold text-white">
              History
            </h2>
          </div>
          <button type="button" onClick={onClose} className="history-close-btn" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="history-panel-body">
          {loading ? (
            <p className="history-empty">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="history-empty">No saved sessions yet</p>
          ) : (
            <ul className="history-list">
              {sessions.map((item, index) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  active={session?.id === item.id}
                  disabled={isRecording}
                  style={{ animationDelay: `${index * 40}ms` }}
                  onSelect={() => handleSelect(item.id)}
                  onDelete={(e) => handleDelete(e, item.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}

function HistoryItem({
  item,
  active,
  disabled,
  style,
  onSelect,
  onDelete,
}: {
  item: TimelapseSession
  active: boolean
  disabled: boolean
  style?: React.CSSProperties
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const date = new Date(item.stoppedAt ?? item.startedAt)
  const dateLabel = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const intervalLabel =
    item.intervalMs >= 1000 ? `${item.intervalMs / 1000}s` : `${item.intervalMs}ms`
  const duration = formatDuration(getOriginalDurationMs(item))

  return (
    <li
      style={style}
      className={`history-item ${active ? 'history-item-active' : ''} ${disabled ? 'history-item-disabled' : ''}`}
    >
      <button
        type="button"
        className="history-item-main"
        onClick={onSelect}
        disabled={disabled}
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-xs text-white/50 tabular-nums shrink-0">{dateLabel}</span>
          <StatusBadge status={item.status} />
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-white/90 mt-1">
          <span className="tabular-nums">{item.frameCount.toLocaleString()} frames</span>
          <span className="text-white/30">·</span>
          <span className="tabular-nums text-white/70">{duration}</span>
          <span className="text-white/30">·</span>
          <span className="text-white/60">{intervalLabel}</span>
        </div>
        {item.deviceLabel && (
          <p className="text-[11px] text-white/40 truncate mt-0.5">{item.deviceLabel}</p>
        )}
        {item.focusDurationMs && (
          <p className="text-[11px] text-blue-400/70 mt-0.5">
            Focus · {Math.round(item.focusDurationMs / 60000)} min
          </p>
        )}
      </button>

      {item.status !== 'recording' && (
        <button
          type="button"
          className="history-item-delete"
          onClick={onDelete}
          disabled={disabled}
          aria-label="Delete session"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </li>
  )
}

function StatusBadge({ status }: { status: TimelapseSession['status'] }) {
  if (status === 'recording') {
    return (
      <span className="history-badge history-badge-rec">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-fast" />
        Recording
      </span>
    )
  }
  if (status === 'exported') {
    return (
      <span className="history-badge history-badge-exported">
        <Film className="w-3 h-3" />
        Exported
      </span>
    )
  }
  return <span className="history-badge">Stopped</span>
}
