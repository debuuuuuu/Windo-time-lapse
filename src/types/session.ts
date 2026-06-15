export type SessionStatus = 'idle' | 'recording' | 'stopped' | 'exported'

export interface TimelapseSession {
  id: string
  deviceLabel: string
  intervalMs: number
  frameCount: number
  status: SessionStatus
  startedAt: number
  stoppedAt?: number
  width: number
  height: number
  exportFps?: number
  /** Wall-clock focus timer duration when session was recorded with auto-stop. */
  focusDurationMs?: number
}

export function getOriginalDurationMs(session: TimelapseSession): number {
  return session.frameCount * session.intervalMs
}
