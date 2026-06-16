import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCamera } from '../hooks/useCamera'
import { useTimelapseSession } from '../hooks/useTimelapseSession'
import { useExport } from '../hooks/useExport'
import { useFocusTimer } from '../hooks/useFocusTimer'
import { useRecordingClock } from '../hooks/useRecordingClock'
import { useLiveClock } from '../hooks/useLiveClock'
import { useTimerOverlaySettings } from '../hooks/useTimerOverlaySettings'
import { frameStorage } from '../services/storage/FrameStorageService'
import type { StorageStats } from '../types/storage'
import type { ClockBurnInSnapshot, TimerBurnInSnapshot } from '../types/capture'
import { DEFAULT_INTERVAL_MS } from '../constants/intervals'
import { DEFAULT_FPS, type FpsOption } from '../constants/fps'
import type { TimerOverlayMode } from '../constants/timerOverlay'
import { resolveTimerDisplayMs } from '../utils/timerDisplay'
import { formatLiveClock } from '../utils/formatLiveClock'

const PREFERRED_INTERVAL_KEY = 'preferredIntervalMs'
const PREFERRED_FPS_KEY = 'preferredFps'
const WELCOME_SEEN_KEY = 'timelapse_welcome_seen'
export const STORAGE_QUOTA_EXCEEDED_EVENT = 'timelapse:storage-quota-exceeded'

interface TimelapseContextValue {
  devices: MediaDeviceInfo[]
  deviceId: string
  intervalMs: number
  fps: FpsOption
  stream: MediaStream | null
  permissionError: string | null
  isInitializing: boolean
  isRecording: boolean
  frameCount: number
  elapsedMs: number
  wallElapsedMs: number
  session: ReturnType<typeof useTimelapseSession>['session']
  storageStats: StorageStats
  storageError: string | null
  exportProgress: ReturnType<typeof useExport>['progress']
  exportResult: ReturnType<typeof useExport>['exportResult']
  exportUrl: string | null
  isExporting: boolean
  videoRef: ReturnType<typeof useCamera>['videoRef']
  focusTimerValue: number
  customFocusMinutes: number
  focusDurationMs: number | null
  focusRemainingMs: number | null
  isFocusTimerEnabled: boolean
  focusJustCompleted: boolean
  timerMode: TimerOverlayMode
  timerOverlayVisible: boolean
  timerBurnIn: boolean
  clockVisible: boolean
  clockBurnIn: boolean
  liveTime: string
  liveDate: string
  setFocusTimer: (value: number) => void
  setCustomFocusMinutes: (minutes: number) => void
  clearFocusJustCompleted: () => void
  setTimerMode: (mode: TimerOverlayMode) => void
  setTimerOverlayVisible: (visible: boolean) => void
  setTimerBurnIn: (enabled: boolean) => void
  setClockVisible: (visible: boolean) => void
  setClockBurnIn: (enabled: boolean) => void
  setIntervalMs: (ms: number) => void
  setFps: (fps: FpsOption) => void
  changeCamera: (deviceId: string) => Promise<void>
  requestCameraAccess: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  triggerExport: () => Promise<void>
  resetExport: () => void
  deleteSession: (sessionId?: string) => Promise<void>
  loadSession: (sessionId: string) => Promise<void>
  refreshStorageStats: () => Promise<void>
}

const TimelapseContext = createContext<TimelapseContextValue | undefined>(undefined)

export function TimelapseProvider({ children }: { children: React.ReactNode }) {
  const [intervalMs, setIntervalMsState] = useState(() => {
    const cached = localStorage.getItem(PREFERRED_INTERVAL_KEY)
    return cached ? Number(cached) : DEFAULT_INTERVAL_MS
  })
  const [fps, setFpsState] = useState<FpsOption>(() => {
    const cached = localStorage.getItem(PREFERRED_FPS_KEY)
    return (cached ? Number(cached) : DEFAULT_FPS) as FpsOption
  })
  const [storageStats, setStorageStats] = useState<StorageStats>({
    usedBytes: 0,
    quotaBytes: 0,
    percentage: 0,
  })
  const [storageError, setStorageError] = useState<string | null>(null)

  const autoStartCamera =
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(WELCOME_SEEN_KEY) === 'true'

  const camera = useCamera({ autoStart: autoStartCamera })
  const overlaySettings = useTimerOverlaySettings()
  const liveClock = useLiveClock(overlaySettings.clockVisible)

  const refreshStorageStats = useCallback(async () => {
    const stats = await frameStorage.getStorageEstimate()
    setStorageStats(stats)
  }, [])

  const sessionHook = useTimelapseSession({
    intervalMs,
    deviceLabel: camera.getDeviceLabel(camera.deviceId),
    getVideoDimensions: camera.getVideoDimensions,
    videoRef: camera.videoRef,
    onStorageRefresh: refreshStorageStats,
  })

  const wallElapsedMs = useRecordingClock(
    sessionHook.isRecording,
    sessionHook.getRecordingStartedAt,
  )

  const exportHook = useExport()

  const stopRecordingRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const focusTimer = useFocusTimer({
    isRecording: sessionHook.isRecording,
    onAutoStop: async () => stopRecordingRef.current(),
  })

  const burnInContextRef = useRef({
    timerBurnIn: overlaySettings.timerBurnIn,
    timerMode: overlaySettings.timerMode,
    focusDurationMs: focusTimer.focusDurationMs,
    startedAt: 0,
    focusRemainingMs: null as number | null,
    isFocusTimerEnabled: focusTimer.isFocusTimerEnabled,
  })

  burnInContextRef.current = {
    timerBurnIn: overlaySettings.timerBurnIn,
    timerMode: overlaySettings.timerMode,
    focusDurationMs: focusTimer.focusDurationMs,
    startedAt: sessionHook.getRecordingStartedAt() ?? 0,
    focusRemainingMs: focusTimer.focusRemainingMs,
    isFocusTimerEnabled: focusTimer.isFocusTimerEnabled,
  }

  const getTimerBurnIn = useCallback((): TimerBurnInSnapshot | null => {
    const ctx = burnInContextRef.current
    if (!ctx.timerBurnIn || !ctx.startedAt) return null

    const wall = Date.now() - ctx.startedAt
    const focusRemaining =
      ctx.focusDurationMs !== null ? Math.max(0, ctx.focusDurationMs - wall) : null

    const displayMs = resolveTimerDisplayMs(
      ctx.timerMode,
      wall,
      focusRemaining,
      ctx.isFocusTimerEnabled,
    )

    return {
      enabled: true,
      mode: ctx.timerMode,
      displayMs,
    }
  }, [])

  const getClockBurnIn = useCallback((): ClockBurnInSnapshot | null => {
    if (!overlaySettings.clockBurnIn) return null
    const { time, date } = formatLiveClock(new Date())
    return { enabled: true, time, date }
  }, [overlaySettings.clockBurnIn])

  const setIntervalMs = useCallback((ms: number) => {
    setIntervalMsState(ms)
    localStorage.setItem(PREFERRED_INTERVAL_KEY, ms.toString())
  }, [])

  const setFps = useCallback((f: FpsOption) => {
    setFpsState(f)
    localStorage.setItem(PREFERRED_FPS_KEY, f.toString())
  }, [])

  // Storage quota exceeded: auto-stop recording and notify user
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail ?? 'Storage is full. Recording stopped.'
      setStorageError(msg)
      void stopRecordingRef.current()
    }
    window.addEventListener(STORAGE_QUOTA_EXCEEDED_EVENT, handler)
    return () => window.removeEventListener(STORAGE_QUOTA_EXCEEDED_EVENT, handler)
  }, [])

  useEffect(() => {
    void refreshStorageStats()
    void sessionHook.loadLatestSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(async () => {
    focusTimer.disarm()
    await sessionHook.stopRecording()
  }, [focusTimer, sessionHook])

  useEffect(() => {
    stopRecordingRef.current = stopRecording
  }, [stopRecording])

  const startRecording = useCallback(async () => {
    focusTimer.clearJustCompleted()
    const duration = focusTimer.focusDurationMs ?? undefined

    if (duration) {
      overlaySettings.setTimerMode('focus')
    }

    await sessionHook.startRecording(duration, getTimerBurnIn, getClockBurnIn)
    const startedAt = sessionHook.getRecordingStartedAt()
    if (startedAt) {
      burnInContextRef.current.startedAt = startedAt
    }
    focusTimer.arm(startedAt ?? undefined)
  }, [focusTimer, sessionHook, getTimerBurnIn, getClockBurnIn, overlaySettings.setTimerMode])

  const triggerExport = useCallback(async () => {
    if (!sessionHook.session || sessionHook.session.frameCount === 0) return

    await exportHook.triggerExport(
      sessionHook.session.id,
      sessionHook.session.frameCount,
      fps,
    )
    await sessionHook.markExported(fps)
  }, [exportHook, fps, sessionHook])

  const deleteSession = useCallback(async (sessionId?: string) => {
    exportHook.resetExport()
    await sessionHook.deleteSession(sessionId)
  }, [exportHook, sessionHook])

  const loadSession = useCallback(async (sessionId: string) => {
    exportHook.resetExport()
    await sessionHook.loadSession(sessionId)
  }, [exportHook, sessionHook])

  const value = useMemo<TimelapseContextValue>(
    () => ({
      devices: camera.devices,
      deviceId: camera.deviceId,
      intervalMs,
      fps,
      stream: camera.stream,
      permissionError: camera.permissionError,
      isInitializing: camera.isInitializing,
      isRecording: sessionHook.isRecording,
      frameCount: sessionHook.frameCount,
      elapsedMs: sessionHook.elapsedMs,
      wallElapsedMs,
      session: sessionHook.session,
      storageStats,
      storageError,
      exportProgress: exportHook.progress,
      exportResult: exportHook.exportResult,
      exportUrl: exportHook.exportUrl,
      isExporting: exportHook.isExporting,
      videoRef: camera.videoRef,
      focusTimerValue: focusTimer.focusTimerValue,
      customFocusMinutes: focusTimer.customFocusMinutes,
      focusDurationMs: focusTimer.focusDurationMs,
      focusRemainingMs: focusTimer.focusRemainingMs,
      isFocusTimerEnabled: focusTimer.isFocusTimerEnabled,
      focusJustCompleted: focusTimer.justCompleted,
      timerMode: overlaySettings.timerMode,
      timerOverlayVisible: overlaySettings.timerOverlayVisible,
      timerBurnIn: overlaySettings.timerBurnIn,
      clockVisible: overlaySettings.clockVisible,
      clockBurnIn: overlaySettings.clockBurnIn,
      liveTime: liveClock.time,
      liveDate: liveClock.date,
      setFocusTimer: focusTimer.setFocusTimer,
      setCustomFocusMinutes: focusTimer.setCustomFocusMinutes,
      clearFocusJustCompleted: focusTimer.clearJustCompleted,
      setTimerMode: overlaySettings.setTimerMode,
      setTimerOverlayVisible: overlaySettings.setTimerOverlayVisible,
      setTimerBurnIn: overlaySettings.setTimerBurnIn,
      setClockVisible: overlaySettings.setClockVisible,
      setClockBurnIn: overlaySettings.setClockBurnIn,
      setIntervalMs,
      setFps,
      changeCamera: camera.changeCamera,
      requestCameraAccess: camera.requestCameraAccess,
      startRecording,
      stopRecording,
      triggerExport,
      resetExport: exportHook.resetExport,
      deleteSession,
      loadSession,
      refreshStorageStats,
    }),
    [
      camera,
      exportHook,
      fps,
      focusTimer,
      intervalMs,
      overlaySettings,
      liveClock,
      refreshStorageStats,
      sessionHook,
      setIntervalMs,
      setFps,
      startRecording,
      stopRecording,
      storageStats,
      storageError,
      triggerExport,
      deleteSession,
      loadSession,
      wallElapsedMs,
    ],
  )

  return (
    <TimelapseContext.Provider value={value}>{children}</TimelapseContext.Provider>
  )
}

export function useTimelapse() {
  const context = useContext(TimelapseContext)
  if (!context) {
    throw new Error('useTimelapse must be used within TimelapseProvider')
  }
  return context
}
