import type { FrameCaptureCallback, FrameCaptureOptions } from '../../types/capture'
import { JPEG_QUALITY } from '../../constants/intervals'
import { drawTimerBurnIn } from './drawTimerBurnIn'
import { drawClockBurnIn } from './drawClockBurnIn'

export const FRAME_CAPTURED_EVENT = 'timelapse-frame-captured'

export class FrameCaptureService {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private timerId: ReturnType<typeof setTimeout> | null = null
  private isRunning = false
  private isProcessing = false
  private frameIndex = 0
  private lastCaptureTime = 0
  private onFrame: FrameCaptureCallback | null = null
  private intervalMs = 1000
  private jpegQuality = JPEG_QUALITY
  private getTimerBurnIn: FrameCaptureOptions['getTimerBurnIn']
  private getClockBurnIn: FrameCaptureOptions['getClockBurnIn']

  start(
    video: HTMLVideoElement,
    options: FrameCaptureOptions,
    onFrame: FrameCaptureCallback,
  ): void {
    this.stop()

    const width = options.width || video.videoWidth || 1280
    const height = options.height || video.videoHeight || 720

    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')

    if (!this.ctx) {
      throw new Error('Could not create canvas 2D context for frame capture')
    }

    this.onFrame = onFrame
    this.intervalMs = options.intervalMs
    this.jpegQuality = options.jpegQuality ?? JPEG_QUALITY
    this.getTimerBurnIn = options.getTimerBurnIn
    this.getClockBurnIn = options.getClockBurnIn
    this.frameIndex = 0
    this.isRunning = true
    this.lastCaptureTime = Date.now()
    this.videoElement = video

    this.scheduleNextCapture()
  }

  private videoElement: HTMLVideoElement | null = null

  stop(): void {
    this.isRunning = false
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    this.onFrame = null
    this.videoElement = null
    this.getTimerBurnIn = undefined
    this.getClockBurnIn = undefined
    this.canvas = null
    this.ctx = null
    this.isProcessing = false
  }

  private scheduleNextCapture(): void {
    if (!this.isRunning) return

    const now = Date.now()
    const elapsed = now - this.lastCaptureTime
    const delay = Math.max(0, this.intervalMs - elapsed)

    this.timerId = setTimeout(() => {
      void this.runCaptureTick()
    }, delay)
  }

  private async runCaptureTick(): Promise<void> {
    if (!this.isRunning || !this.videoElement || !this.onFrame) return

    if (this.isProcessing) {
      this.scheduleNextCapture()
      return
    }

    this.isProcessing = true

    try {
      const blob = await this.grabFrame(this.videoElement)
      if (blob && this.isRunning && this.onFrame) {
        const index = this.frameIndex
        await this.onFrame(blob, index)
        this.frameIndex = index + 1
        this.lastCaptureTime = Date.now()
        window.dispatchEvent(new CustomEvent(FRAME_CAPTURED_EVENT))
      }
    } catch (error) {
      console.error('Frame capture failed:', error)
    } finally {
      this.isProcessing = false
      if (this.isRunning) {
        this.scheduleNextCapture()
      }
    }
  }

  private grabFrame(video: HTMLVideoElement): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.canvas || !this.ctx || video.readyState < 2) {
        resolve(null)
        return
      }

      this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height)

      const timerOverlay = this.getTimerBurnIn?.()
      if (timerOverlay?.enabled) {
        drawTimerBurnIn(
          this.ctx,
          this.canvas.width,
          this.canvas.height,
          timerOverlay.displayMs,
          timerOverlay.mode,
        )
      }

      const clockOverlay = this.getClockBurnIn?.()
      if (clockOverlay?.enabled) {
        drawClockBurnIn(this.ctx, this.canvas.width, this.canvas.height, {
          time: clockOverlay.time,
          date: clockOverlay.date,
        })
      }

      this.canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        this.jpegQuality,
      )
    })
  }
}

export const frameCaptureService = new FrameCaptureService()
