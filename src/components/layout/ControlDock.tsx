import { useEffect, useState, type InputHTMLAttributes } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  Circle,
  Film,
  Pause,
  Play,
  RotateCcw,
  Square,
  Trash2,
  Zap,
} from 'lucide-react'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useTimelapse } from '../../context/TimelapseProvider'
import { CAPTURE_INTERVALS, CUSTOM_INTERVAL_VALUE } from '../../constants/intervals'
import {
  FOCUS_TIMER_CUSTOM,
  FOCUS_TIMER_PRESETS,
} from '../../constants/focusTimer'
import { FPS_OPTIONS } from '../../constants/fps'
import { ExportProgressBar } from '../export/ExportProgressBar'
import { formatDuration, formatDurationSeconds } from '../../utils/formatDuration'
import { formatBytes } from '../../utils/formatBytes'
import { describeExportFallback, usePreferredExportBackend } from '../../hooks/usePreferredExportBackend'
import { GlassDropdown } from '../ui/GlassDropdown'

const PRESET_VALUES = CAPTURE_INTERVALS.filter((i) => i.value !== CUSTOM_INTERVAL_VALUE)

export function ControlDock() {
  const {
    devices,
    deviceId,
    intervalMs,
    isRecording,
    isPaused,
    frameCount,
    wallElapsedMs,
    fps,
    setFps,
    session,
    stream,
    permissionError,
    storageStats,
    exportProgress,
    exportUrl,
    exportResult,
    isExporting,
    changeCamera,
    setIntervalMs,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    triggerExport,
    resetExport,
    deleteSession,
    focusTimerValue,
    customFocusMinutes,
    isFocusTimerEnabled,
    focusJustCompleted,
    setFocusTimer,
    setCustomFocusMinutes,
    clearFocusJustCompleted,
    timerBurnIn,
    setTimerBurnIn,
    timerOverlayVisible,
    setTimerOverlayVisible,
    clockVisible,
    clockBurnIn,
    setClockVisible,
    setClockBurnIn,
    storageError,
  } = useTimelapse()

  const [showCustom, setShowCustom] = useState(false)
  const [showCustomFocus, setShowCustomFocus] = useState(false)
  const [customSeconds, setCustomSeconds] = useState(String(intervalMs / 1000))
  const [customFocusInput, setCustomFocusInput] = useState(String(customFocusMinutes))
  const [dockVisible, setDockVisible] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [liveStatus, setLiveStatus] = useState('')

  useEffect(() => {
    const t = requestAnimationFrame(() => setDockVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  useEffect(() => {
    const isCustom = !PRESET_VALUES.some((p) => p.value === intervalMs)
    setShowCustom(isCustom)
    if (isCustom) setCustomSeconds(String(intervalMs / 1000))
  }, [intervalMs])

  useEffect(() => {
    setShowCustomFocus(focusTimerValue === FOCUS_TIMER_CUSTOM)
    if (focusTimerValue === FOCUS_TIMER_CUSTOM) {
      setCustomFocusInput(String(customFocusMinutes))
    }
  }, [focusTimerValue, customFocusMinutes])

  const hasFrames = session && session.frameCount > 0
  const canRecord = Boolean(stream) && !permissionError
  const canExport = hasFrames && !isRecording && exportProgress.step === 'idle' && !exportUrl
  const canDelete = hasFrames && !isRecording && !isExporting
  const { usedBytes, percentage } = storageStats
  const { backend: exportBackend, fallbackReason } = usePreferredExportBackend(
    session?.width ?? 0,
    session?.height ?? 0,
    fps,
    Boolean(canExport || isExporting),
  )

  const cameraOptions = devices.length
    ? devices.map((d) => ({
        value: d.deviceId,
        label: d.label || `Camera ${d.deviceId.slice(0, 6)}`,
      }))
    : [{ value: '', label: 'No camera' }]

  const intervalOptions = CAPTURE_INTERVALS.map((item) => ({
    value: item.value,
    label:
      item.value === CUSTOM_INTERVAL_VALUE
        ? 'Custom'
        : item.label.replace(' Seconds', 's').replace(' Second', 's'),
  }))

  const focusTimerOptions = FOCUS_TIMER_PRESETS.map((item) => ({
    value: item.value,
    label: item.label,
  }))

  const handleFocusTimerChange = (val: string | number) => {
    const value = Number(val)
    if (value === FOCUS_TIMER_CUSTOM) {
      setShowCustomFocus(true)
      const minutes = Number(customFocusInput)
      if (minutes > 0) setCustomFocusMinutes(minutes)
    } else {
      setShowCustomFocus(false)
    }
    setFocusTimer(value)
    clearFocusJustCompleted()
  }

  const handleIntervalChange = (val: string | number) => {
    const value = Number(val)
    if (value === CUSTOM_INTERVAL_VALUE) {
      setShowCustom(true)
      const seconds = Number(customSeconds)
      if (seconds > 0) setIntervalMs(seconds * 1000)
    } else {
      setShowCustom(false)
      setIntervalMs(value)
    }
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirmed = () => {
    setShowDeleteConfirm(false)
    setLiveStatus('Session deleted')
    void deleteSession()
  }

  // Announce recording state changes to screen readers
  useEffect(() => {
    if (isRecording && !isPaused) setLiveStatus('Recording started')
    else if (isPaused) setLiveStatus('Recording paused')
    else if (liveStatus.startsWith('Recording')) setLiveStatus('Recording stopped')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, isPaused])

  return (
    <>
      {/* Screen reader live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveStatus}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete session?"
        message={`This will permanently delete ${session?.frameCount ?? 0} frames. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div
        id="main-content"
        role="main"
        className={`glass-dock absolute bottom-0 left-0 right-0 z-30 mx-auto max-w-5xl px-4 pb-4 pt-0 pointer-events-auto motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out ${
          dockVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="glass-dock-inner rounded-2xl flex flex-col shadow-2xl">
          {/* ── SETTINGS PANEL (Darker Background) ── */}
          <div className="bg-black/20 p-4 pb-5 border-b border-white/5 flex flex-col gap-3 relative">
            <div className="flex flex-wrap items-center justify-between mb-1 gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                Capture Settings
              </span>

              <fieldset
                disabled={isRecording}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 m-0 min-w-0"
                aria-label="On-screen overlays"
              >
                <legend className="sr-only">On-screen overlays</legend>
                <span id="live-clock-desc" className="sr-only">
                  Show the current time on screen while recording
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white text-white/60 text-[11px] font-medium transition-colors">
                  <input
                    type="checkbox"
                    checked={clockVisible}
                    onChange={(e) => setClockVisible(e.target.checked)}
                    className="accent-blue-500 w-3.5 h-3.5"
                    aria-describedby="live-clock-desc"
                  />
                  Live Clock
                </label>
                <span id="burn-clock-desc" className="sr-only">
                  Permanently embeds the live clock into exported video frames
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white text-white/60 text-[11px] font-medium transition-colors">
                  <input
                    type="checkbox"
                    checked={clockBurnIn}
                    onChange={(e) => setClockBurnIn(e.target.checked)}
                    className="accent-blue-500 w-3.5 h-3.5"
                    aria-describedby="burn-clock-desc"
                  />
                  Burn Clock
                </label>
                <div className="w-px h-3 bg-white/10 hidden sm:block" aria-hidden="true" />
                <span id="live-timer-desc" className="sr-only">
                  Show elapsed recording time on screen
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white text-white/60 text-[11px] font-medium transition-colors">
                  <input
                    type="checkbox"
                    checked={timerOverlayVisible}
                    onChange={(e) => setTimerOverlayVisible(e.target.checked)}
                    className="accent-blue-500 w-3.5 h-3.5"
                    aria-describedby="live-timer-desc"
                  />
                  Live Timer
                </label>
                <span id="burn-timer-desc" className="sr-only">
                  Permanently embeds the recording timer into exported video frames
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white text-white/60 text-[11px] font-medium transition-colors">
                  <input
                    type="checkbox"
                    checked={timerBurnIn}
                    onChange={(e) => setTimerBurnIn(e.target.checked)}
                    className="accent-blue-500 w-3.5 h-3.5"
                    aria-describedby="burn-timer-desc"
                  />
                  Burn Timer
                </label>
              </fieldset>
            </div>

            <fieldset
              disabled={isRecording}
              className="flex flex-wrap items-end gap-3 border-0 m-0 p-0 min-w-0"
            >
              <legend className="sr-only">Capture settings</legend>
              <div className="flex-1 min-w-[200px]">
                <GlassDropdown
                  id="camera-select"
                  label="Camera Source"
                  value={deviceId}
                  options={cameraOptions}
                  onChange={(v) => void changeCamera(String(v))}
                  disabled={isRecording}
                />
              </div>

              <div className="w-[130px]">
                <GlassDropdown
                  id="interval-select"
                  label="Interval"
                  value={showCustom ? CUSTOM_INTERVAL_VALUE : intervalMs}
                  options={intervalOptions}
                  onChange={handleIntervalChange}
                  disabled={isRecording}
                />
              </div>

              {showCustom && (
                <div className="w-[80px]">
                  <DockInput
                    id="custom-interval"
                    label="Seconds"
                    type="number"
                    min="0.5"
                    max="3600"
                    step="0.5"
                    value={customSeconds}
                    onChange={(e) => {
                      setCustomSeconds(e.target.value)
                      const s = Number(e.target.value)
                      if (s > 0) setIntervalMs(s * 1000)
                    }}
                  />
                </div>
              )}

              <div className="w-[130px]">
                <GlassDropdown
                  id="focus-timer-select"
                  label="Focus Timer"
                  value={showCustomFocus ? FOCUS_TIMER_CUSTOM : focusTimerValue}
                  options={focusTimerOptions}
                  onChange={handleFocusTimerChange}
                  disabled={isRecording}
                />
              </div>

              {showCustomFocus && (
                <div className="w-[80px]">
                  <DockInput
                    id="custom-focus-minutes"
                    label="Minutes"
                    type="number"
                    min="1"
                    max="480"
                    step="1"
                    value={customFocusInput}
                    onChange={(e) => {
                      setCustomFocusInput(e.target.value)
                      const minutes = Number(e.target.value)
                      if (minutes > 0) setCustomFocusMinutes(minutes)
                    }}
                  />
                </div>
              )}

              {canExport && (
                <fieldset
                  disabled={isExporting}
                  className="w-[220px] flex flex-col gap-1 sm:ml-auto border-0 m-0 p-0 min-w-0"
                >
                  <legend className="dock-label">Export Framerate (FPS)</legend>
                  <div className="flex gap-1 h-[36px]" role="radiogroup" aria-label="Output frame rate">
                    {FPS_OPTIONS.map((f) => (
                      <label
                        key={f}
                        className={`glass-fps-btn flex flex-1 items-center justify-center ${
                          fps === f ? 'glass-fps-btn-active' : ''
                        } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name="export-fps"
                          value={f}
                          checked={fps === f}
                          onChange={() => setFps(f)}
                          className="sr-only"
                          disabled={isExporting}
                        />
                        {f}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </fieldset>
          </div>

          {/* ── ACTIONS & STATUS PANEL ── */}
          <div className="p-4 flex flex-col gap-3 bg-gradient-to-b from-white/[0.02] to-transparent">
            <div className="flex flex-wrap items-stretch gap-4">
              {/* Stats Block */}
              <div className="flex items-stretch gap-2">
                <StatPill label="Frames Captured" value={frameCount.toLocaleString()} />
                <StatPill
                  label="Elapsed Time"
                  value={isRecording ? formatDuration(wallElapsedMs) : '—'}
                  accent
                />
              </div>

              {/* Primary Actions */}
              <div
                className="flex-1 min-w-[200px] flex gap-2"
                aria-busy={isExporting}
              >
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    disabled={!canRecord}
                    className="dock-btn dock-btn-primary flex-1 py-3 text-sm"
                    aria-label={
                      canRecord
                        ? 'Start recording'
                        : 'Start recording unavailable — grant camera access first'
                    }
                  >
                    <Circle className="w-4 h-4 fill-current animate-pulse-fast" aria-hidden="true" />
                    Start Recording
                  </button>
                ) : (
                  <div className="flex w-full gap-2">
                    <button
                      type="button"
                      onClick={() => isPaused ? resumeRecording() : pauseRecording()}
                      className={`dock-btn flex-1 py-3 text-sm font-bold ${
                        isPaused 
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                          : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                      }`}
                      aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
                    >
                      {isPaused ? <Play className="w-4 h-4 fill-current" aria-hidden="true" /> : <Pause className="w-4 h-4 fill-current" aria-hidden="true" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void stopRecording()}
                      className="dock-btn dock-btn-stop flex-1 py-3 text-sm font-bold"
                      aria-label="Stop recording"
                    >
                      <Square className="w-4 h-4 fill-current" aria-hidden="true" />
                      Stop
                    </button>
                  </div>
                )}

                {canExport && (
                  <button
                    type="button"
                    onClick={() => void triggerExport()}
                    disabled={isExporting}
                    className="dock-btn dock-btn-primary flex-1"
                    aria-label="Render timelapse video"
                  >
                    <Film className="w-4 h-4" aria-hidden="true" />
                    Render Video
                  </button>
                )}

                {exportUrl && exportResult && session && (
                  <a
                    href={exportUrl}
                    download={`timelapse_${session.id}.mp4`}
                    className="dock-btn dock-btn-success flex-1"
                    aria-label={`Download timelapse video, ${formatDurationSeconds(exportResult.durationSec)} long`}
                  >
                    <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
                    Save MP4
                  </a>
                )}

                {exportUrl && (
                  <button
                    type="button"
                    onClick={resetExport}
                    className="dock-btn dock-btn-ghost px-4"
                    aria-label="Reset export and render again"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="dock-btn dock-btn-danger px-4"
                    aria-label={`Delete session with ${session?.frameCount ?? 0} frames`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Storage & Status Information */}
              <div className="flex flex-col justify-center min-w-[160px] sm:ml-auto">
                <div className="w-full flex items-center justify-between text-[10px] text-white/50 uppercase font-bold tracking-widest mb-1.5">
                  <span>Storage Used</span>
                  <span>{formatBytes(usedBytes)}</span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden shadow-inner"
                  role="progressbar"
                  aria-label="Storage used"
                  aria-valuenow={Math.round(percentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${formatBytes(usedBytes)}, ${Math.round(percentage)} percent`}
                >
                  <div
                    className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-500 ${
                      percentage > 80 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="min-h-[20px] mt-2 flex flex-wrap items-center justify-end gap-2 w-full">
                  {isRecording && !isPaused && (
                    <span
                      className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 animate-fade-in"
                      role="status"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-fast" aria-hidden="true" />
                      Recording Active
                    </span>
                  )}
                  {isRecording && isPaused && (
                    <span
                      className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 animate-fade-in"
                      role="status"
                    >
                      <Pause className="w-3 h-3 fill-current" aria-hidden="true" />
                      Paused
                    </span>
                  )}

                  {exportUrl && exportResult && !isExporting && (
                    <span
                      className="text-[11px] text-emerald-400 font-bold animate-fade-in flex items-center gap-1.5"
                      role="status"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                      Ready ({formatDurationSeconds(exportResult.durationSec)})
                    </span>
                  )}

                  {canExport && exportBackend === 'gpu' && (
                    <span className="text-[10px] text-blue-400/90 flex items-center gap-1 font-medium">
                      <Zap className="w-3 h-3" aria-hidden="true" /> GPU accelerated export
                    </span>
                  )}

                  {canExport && exportBackend === 'ffmpeg' && (
                    <span
                      className="text-[10px] text-amber-400/90 flex items-center gap-1 font-medium"
                      aria-label={describeExportFallback(fallbackReason)}
                    >
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" /> FFmpeg software export
                    </span>
                  )}

                  {focusJustCompleted && !isRecording && (
                    <span className="text-[11px] text-emerald-400 font-bold animate-fade-in" role="status">
                      Focus session complete
                    </span>
                  )}

                  {!isRecording && hasFrames && !isExporting && !exportUrl && !focusJustCompleted && (
                    <span className="text-[11px] text-white/40 font-medium">
                      {session?.stoppedAt && session.startedAt
                        ? `${formatDuration(session.stoppedAt - session.startedAt)} recorded`
                        : 'Ready to render'}
                    </span>
                  )}

                  {!isRecording && !hasFrames && !isExporting && !exportUrl && !focusJustCompleted && (
                    <span className="text-[11px] text-white/40 font-medium">
                      {isFocusTimerEnabled ? 'Hit record to start focus timer' : 'Hit record to begin'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Full-width status bars */}
            {isExporting && (
              <div className="w-full animate-fade-in mt-1" aria-live="polite">
                <ExportProgressBar progress={exportProgress} />
              </div>
            )}

            {exportProgress.step === 'failed' && (
              <div className="flex items-center gap-2 animate-fade-in bg-red-500/10 border border-red-500/20 p-2 rounded-lg mt-1" role="alert">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-red-400 flex-1 truncate font-medium">
                  Export failed: {exportProgress.message}
                </p>
                <button
                  type="button"
                  onClick={resetExport}
                  className="dock-btn dock-btn-ghost text-xs px-3 py-1 h-7"
                  aria-label="Dismiss export error"
                >
                  Dismiss
                </button>
              </div>
            )}

            {storageError && (
              <div className="flex items-center gap-2 animate-fade-in bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg mt-1" role="alert" aria-live="assertive">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-amber-400 flex-1 font-medium">
                  {storageError}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function DockInput({
  id,
  label,
  ...props
}: {
  id: string
  label: string
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="glass-field flex flex-col gap-1 min-w-0 animate-slide-up">
      <label htmlFor={id} className="dock-label">
        {label}
      </label>
      <input id={id} {...props} className="glass-select-trigger glass-input text-left" />
    </div>
  )
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="glass-stat-pill flex flex-col justify-center px-3 py-1.5 min-w-[72px]"
      role="group"
      aria-label={`${label}: ${value}`}
    >
      <span className="text-[9px] uppercase tracking-wider text-white/45 font-medium" aria-hidden="true">
        {label}
      </span>
      <span
        className={`text-lg font-bold tabular-nums leading-tight motion-safe:transition-colors ${
          accent ? 'text-blue-400' : 'text-white'
        }`}
        aria-hidden="true"
      >
        {value}
      </span>
    </div>
  )
}
