import { useCallback, useRef, useState } from 'react'
import { frameCaptureService } from '../services/capture/FrameCaptureService'
import { frameStorage } from '../services/storage/FrameStorageService'
import type { TimelapseSession } from '../types/session'
import type { TimerBurnInSnapshot, ClockBurnInSnapshot } from '../types/capture'
import { STORAGE_REFRESH_EVERY_N_FRAMES } from '../constants/intervals'

interface UseTimelapseSessionOptions {
  intervalMs: number
  deviceLabel: string
  getVideoDimensions: () => { width: number; height: number }
  videoRef: React.RefObject<HTMLVideoElement | null>
  onStorageRefresh: () => Promise<void>
}

export function useTimelapseSession({
  intervalMs,
  deviceLabel,
  getVideoDimensions,
  videoRef,
  onStorageRefresh,
}: UseTimelapseSessionOptions) {
  const [session, setSession] = useState<TimelapseSession | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const sessionRef = useRef<TimelapseSession | null>(null)
  const recordingStartedAtRef = useRef<number | null>(null)

  const syncSession = useCallback((next: TimelapseSession | null) => {
    sessionRef.current = next
    setSession(next)
  }, [])

  const getRecordingStartedAt = useCallback(() => recordingStartedAtRef.current, [])

  const startRecording = useCallback(async (
    focusDurationMs?: number,
    getTimerBurnIn?: () => TimerBurnInSnapshot | null,
    getClockBurnIn?: () => ClockBurnInSnapshot | null,
  ) => {
    const video = videoRef.current
    if (!video) return

    const { width, height } = getVideoDimensions()
    const sessionId = `session_${Date.now()}`

    const newSession: TimelapseSession = {
      id: sessionId,
      deviceLabel,
      intervalMs,
      frameCount: 0,
      status: 'recording',
      startedAt: Date.now(),
      width,
      height,
      ...(focusDurationMs ? { focusDurationMs } : {}),
    }

    await frameStorage.saveSession(newSession)
    recordingStartedAtRef.current = newSession.startedAt
    syncSession(newSession)
    setIsRecording(true)
    setElapsedMs(0)

    frameCaptureService.start(
      video,
      { intervalMs, width, height, getTimerBurnIn, getClockBurnIn },
      async (blob, frameIndex) => {
        const current = sessionRef.current
        if (!current) return

        await frameStorage.saveFrame(current.id, frameIndex, blob)

        const updated: TimelapseSession = {
          ...current,
          frameCount: frameIndex + 1,
        }

        await frameStorage.saveSession(updated)
        syncSession(updated)
        setElapsedMs((frameIndex + 1) * intervalMs)

        if ((frameIndex + 1) % STORAGE_REFRESH_EVERY_N_FRAMES === 0) {
          await onStorageRefresh()
        }
      },
    )
  }, [
    deviceLabel,
    getVideoDimensions,
    intervalMs,
    onStorageRefresh,
    syncSession,
    videoRef,
  ])

  const stopRecording = useCallback(async () => {
    frameCaptureService.stop()
    setIsRecording(false)
    recordingStartedAtRef.current = null

    const current = sessionRef.current
    if (!current) return

    const updated: TimelapseSession = {
      ...current,
      status: 'stopped',
      stoppedAt: Date.now(),
    }

    await frameStorage.saveSession(updated)
    syncSession(updated)
    await onStorageRefresh()
  }, [onStorageRefresh, syncSession])

  const clearSession = useCallback(() => {
    syncSession(null)
    setElapsedMs(0)
  }, [syncSession])

  const loadSession = useCallback(async (sessionId: string) => {
    const loaded = await frameStorage.getSession(sessionId)
    if (loaded) {
      syncSession(loaded)
      setElapsedMs(loaded.frameCount * loaded.intervalMs)
    }
  }, [syncSession])

  const loadLatestSession = useCallback(async () => {
    const latest = await frameStorage.getLatestStoppedSession()
    if (latest) {
      syncSession(latest)
      setElapsedMs(latest.frameCount * latest.intervalMs)
    }
  }, [syncSession])

  const markExported = useCallback(async (fps: number) => {
    const current = sessionRef.current
    if (!current) return

    const updated: TimelapseSession = {
      ...current,
      status: 'exported',
      exportFps: fps,
    }

    await frameStorage.saveSession(updated)
    syncSession(updated)
  }, [syncSession])

  const deleteSession = useCallback(async (sessionId?: string) => {
    if (isRecording) return

    const id = sessionId ?? sessionRef.current?.id
    if (!id) return

    await frameStorage.deleteSession(id)
    if (sessionRef.current?.id === id) {
      syncSession(null)
      setElapsedMs(0)
    }
    await onStorageRefresh()
  }, [isRecording, onStorageRefresh, syncSession])

  return {
    session,
    isRecording,
    elapsedMs,
    frameCount: session?.frameCount ?? 0,
    startRecording,
    stopRecording,
    clearSession,
    loadSession,
    loadLatestSession,
    markExported,
    deleteSession,
    getRecordingStartedAt,
  }
}
