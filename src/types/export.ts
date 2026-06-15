export type ExportStep =
  | 'idle'
  | 'loading-ffmpeg'
  | 'loading-encoder'
  | 'writing-frames'
  | 'encoding'
  | 'reading-output'
  | 'completed'
  | 'failed'

export type ExportBackend = 'gpu' | 'cpu' | 'ffmpeg'

export interface ExportProgress {
  step: ExportStep
  percent: number
  message: string
}

export interface ExportResult {
  url: string
  durationSec: number
  frameCount: number
  originalDurationMs: number
  backend?: ExportBackend
}

export interface ExportOptions {
  sessionId: string
  frameCount: number
  fps: number
  onProgress: (progress: ExportProgress) => void
}

/** Future: GIF, WebM, etc. */
export interface ExportFormat {
  extension: string
  encode(
    frames: AsyncIterable<Blob>,
    fps: number,
    onProgress: (percent: number) => void,
  ): Promise<Blob>
}
