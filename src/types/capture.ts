import type { TimerOverlayMode } from '../constants/timerOverlay'

export interface CaptureSettings {
  deviceId: string
  intervalMs: number
}

export interface CaptureSource {
  readonly type: 'camera' | 'screen'
  enumerate(): Promise<MediaDeviceInfo[]>
  start(deviceId: string): Promise<MediaStream>
  stop(): void
}

export interface FrameCaptureOptions {
  intervalMs: number
  width: number
  height: number
  jpegQuality?: number
  getTimerBurnIn?: () => TimerBurnInSnapshot | null
  getClockBurnIn?: () => ClockBurnInSnapshot | null
}

export interface ClockBurnInSnapshot {
  enabled: boolean
  time: string
  date: string
}

export interface TimerBurnInSnapshot {
  enabled: boolean
  mode: TimerOverlayMode
  displayMs: number
}

export type FrameCaptureCallback = (blob: Blob, frameIndex: number) => Promise<void>
