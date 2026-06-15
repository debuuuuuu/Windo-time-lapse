import { useEffect, useState, type InputHTMLAttributes } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  Circle,
  Film,
  RotateCcw,
  Square,
  Trash2,
  Zap,
} from 'lucide-react'
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
  } = useTimelapse()

  const [showCustom, setShowCustom] = useState(false)
  const [showCustomFocus, setShowCustomFocus] = useState(false)
  const [customSeconds, setCustomSeconds] = useState(String(intervalMs / 1000))
  const [customFocusInput, setCustomFocusInput] = useState(String(customFocusMinutes))
  const [dockVisible, setDockVisible] = useState(false)

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
    if (window.confirm(`Delete ${session?.frameCount ?? 0} frames? This cannot be undone.`)) {
      void deleteSession()
    }
  }

  return (
    <div
      id="main-content"
      className={`glass-dock absolute bottom-0 left-0 right-0 z-30 mx-auto max-w-5xl px-4 pb-4 pt-0 pointer-events-auto motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out ${
        dockVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <div className="glass-dock-inner rounded-2xl p-4 flex flex-col gap-3">
        <fieldset
          disabled={isRecording}
          className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-0 m-0 p-0 min-w-0"
        >
          <GlassDropdown
            id="camera-select"
            label="Camera"
            value={deviceId}
            options={cameraOptions}
            onChange={(v) => void changeCamera(String(v))}
            disabled={isRecording}
          />

          <GlassDropdown
            id="interval-select"
            label="Interval"
            value={showCustom ? CUSTOM_INTERVAL_VALUE : intervalMs}
            options={intervalOptions}
            onChange={handleIntervalChange}
            disabled={isRecording}
          />

          <GlassDropdown
            id="focus-timer-select"
            label="Focus timer"
            value={showCustomFocus ? FOCUS_TIMER_CUSTOM : focusTimerValue}
            options={focusTimerOptions}
            onChange={handleFocusTimerChange}
            disabled={isRecording}
          />

          {showCustom && (
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
          )}

          {showCustomFocus && (
            <DockInput
              id="custom-focus-minutes"
              label="Focus (min)"
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
          )}

          {canExport && (
            <div className="flex flex-col gap-1 sm:col-span-3">
              <span className="dock-label">FPS</span>
              <div className="flex gap-1 h-9">
                {FPS_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    disabled={isExporting}
                    onClick={() => setFps(f)}
                    className={`glass-fps-btn flex-1 ${fps === f ? 'glass-fps-btn-active' : ''}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        <div className="flex flex-wrap items-center gap-2">
          <label className="timer-burnin-toggle">
            <input
              type="checkbox"
              checked={clockVisible}
              onChange={(e) => setClockVisible(e.target.checked)}
            />
            <span>Show live clock</span>
          </label>
          <label className="timer-burnin-toggle">
            <input
              type="checkbox"
              checked={clockBurnIn}
              onChange={(e) => setClockBurnIn(e.target.checked)}
            />
            <span>Burn clock into video</span>
          </label>
          <label className="timer-burnin-toggle">
            <input
              type="checkbox"
              checked={timerOverlayVisible}
              onChange={(e) => setTimerOverlayVisible(e.target.checked)}
            />
            <span>Show recording timer</span>
          </label>
          <label className="timer-burnin-toggle">
            <input
              type="checkbox"
              checked={timerBurnIn}
              onChange={(e) => setTimerBurnIn(e.target.checked)}
            />
            <span>Burn timer into video</span>
          </label>
        </div>

        <div className="flex flex-wrap items-stretch gap-2">
          <StatPill label="Frames" value={frameCount.toLocaleString()} />
          <StatPill
            label="Time"
            value={isRecording ? formatDuration(wallElapsedMs) : '—'}
            accent
          />

          <div className="flex-1 min-w-[140px] flex gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={() => void startRecording()}
                disabled={!canRecord}
                className="dock-btn dock-btn-primary flex-1"
              >
                <Circle className="w-4 h-4 fill-current" />
                Record
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void stopRecording()}
                className="dock-btn dock-btn-stop flex-1"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop
              </button>
            )}

            {canExport && (
              <button
                type="button"
                onClick={() => void triggerExport()}
                disabled={isExporting}
                className="dock-btn dock-btn-primary flex-1"
              >
                <Film className="w-4 h-4" />
                Export
              </button>
            )}

            {exportUrl && exportResult && session && (
              <a
                href={exportUrl}
                download={`timelapse_${session.id}.mp4`}
                className="dock-btn dock-btn-success flex-1"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Download
              </a>
            )}

            {exportUrl && (
              <button type="button" onClick={resetExport} className="dock-btn dock-btn-ghost px-3">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="dock-btn dock-btn-danger px-3"
                title="Delete frames"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 min-h-[20px]">
          {isRecording && (
            <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1.5 shrink-0 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-fast" />
              Recording
            </span>
          )}

          {isExporting && (
            <div className="flex-1 min-w-0">
              <ExportProgressBar progress={exportProgress} />
            </div>
          )}

          {exportUrl && exportResult && !isExporting && (
            <span className="text-[11px] text-emerald-400 font-medium shrink-0 animate-fade-in">
              Ready · {formatDurationSeconds(exportResult.durationSec)}
            </span>
          )}

          {canExport && exportBackend === 'gpu' && (
            <span className="text-[10px] text-blue-400/90 flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3" />
              GPU export
            </span>
          )}

          {canExport && exportBackend === 'ffmpeg' && (
            <span
              className="text-[10px] text-amber-400/90 flex items-center gap-1 shrink-0"
              title={describeExportFallback(fallbackReason)}
            >
              <AlertTriangle className="w-3 h-3" />
              FFmpeg export (slower)
            </span>
          )}

          {focusJustCompleted && !isRecording && (
            <span className="text-[11px] text-emerald-400 font-medium shrink-0 animate-fade-in">
              Focus session complete
            </span>
          )}

          {!isRecording && hasFrames && !isExporting && !exportUrl && !focusJustCompleted && (
            <span className="text-[11px] text-white/40 shrink-0">
              {session?.stoppedAt && session.startedAt
                ? `${formatDuration(session.stoppedAt - session.startedAt)} recorded`
                : 'Ready to export'}
            </span>
          )}

          {!isRecording && !hasFrames && !isExporting && !exportUrl && !focusJustCompleted && (
            <span className="text-[11px] text-white/40 shrink-0">
              {isFocusTimerEnabled ? 'Record to start focus timelapse' : 'Record to capture frames'}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2 shrink-0 min-w-[100px]">
            <span className="text-[10px] text-white/40 tabular-nums">{formatBytes(usedBytes)}</span>
            <div
              className="w-16 h-1 rounded-full bg-white/10 overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(percentage)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-500 ${
                  percentage > 80 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {exportProgress.step === 'failed' && (
          <div className="flex items-center gap-2 animate-fade-in" role="alert">
            <p className="text-xs text-red-400 flex-1 truncate">{exportProgress.message}</p>
            <button type="button" onClick={resetExport} className="dock-btn dock-btn-ghost text-xs px-3 py-1.5">
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
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
    <div className="glass-stat-pill flex flex-col justify-center px-3 py-1.5 min-w-[72px]">
      <span className="text-[9px] uppercase tracking-wider text-white/45 font-medium">{label}</span>
      <span
        className={`text-lg font-bold tabular-nums leading-tight motion-safe:transition-colors ${
          accent ? 'text-blue-400' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
