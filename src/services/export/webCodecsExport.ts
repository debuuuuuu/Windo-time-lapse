import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import type { ExportOptions, ExportResult } from '../../types/export'
import { frameStorage } from '../storage/FrameStorageService'
import { buildEncoderConfig, evenDimension, resolveEncoderConfig } from './exportCapability'

async function blobToVideoFrame(
  blob: Blob,
  targetWidth: number,
  targetHeight: number,
  timestamp: number,
  duration: number,
  resizeCanvas: OffscreenCanvas | null,
): Promise<{ frame: VideoFrame; canvas: OffscreenCanvas | null }> {
  const bitmap = await createImageBitmap(blob)

  if (bitmap.width === targetWidth && bitmap.height === targetHeight) {
    const frame = new VideoFrame(bitmap, { timestamp, duration })
    bitmap.close()
    return { frame, canvas: resizeCanvas }
  }

  const canvas = resizeCanvas ?? new OffscreenCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not create resize canvas for export')
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close()

  const frame = new VideoFrame(canvas, { timestamp, duration })
  return { frame, canvas }
}

export async function exportTimelapseWithWebCodecs(
  options: ExportOptions,
): Promise<ExportResult> {
  const { sessionId, frameCount, fps, onProgress } = options

  const session = await frameStorage.getSession(sessionId)
  if (!session) {
    throw new Error('Session not found')
  }

  const width = evenDimension(session.width)
  const height = evenDimension(session.height)
  const { resolved } = await resolveEncoderConfig(width, height, fps)
  const preferGpu = resolved?.backend === 'gpu'

  onProgress({
    step: 'loading-encoder',
    percent: 5,
    message: preferGpu
      ? 'Initializing GPU video encoder…'
      : 'Initializing video encoder…',
  })

  const encoderConfig = resolved?.config ?? (await buildEncoderConfig(width, height, fps, preferGpu))
  if (!encoderConfig) {
    throw new Error('WebCodecs H.264 encoder is not supported in this browser')
  }

  const encWidth = encoderConfig.width!
  const encHeight = encoderConfig.height!

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: encWidth,
      height: encHeight,
      frameRate: fps,
    },
    fastStart: 'in-memory',
  })

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => {
      throw error
    },
  })

  encoder.configure(encoderConfig)

  const frameDurationUs = Math.round(1_000_000 / fps)
  const keyFrameInterval = Math.max(1, fps * 2)
  let resizeCanvas: OffscreenCanvas | null = null
  let framesEncoded = 0

  onProgress({
    step: 'encoding',
    percent: 10,
    message: preferGpu ? 'GPU encoding frames…' : 'Encoding frames…',
  })

  await frameStorage.iterateFrames(sessionId, 25, async (batch) => {
    for (const { frameIndex, blob } of batch) {
      const timestamp = frameIndex * frameDurationUs
      const { frame, canvas } = await blobToVideoFrame(
        blob,
        encWidth,
        encHeight,
        timestamp,
        frameDurationUs,
        resizeCanvas,
      )
      resizeCanvas = canvas

      encoder.encode(frame, { keyFrame: frameIndex % keyFrameInterval === 0 })
      frame.close()

      framesEncoded++
      if (framesEncoded % 10 === 0 || framesEncoded === frameCount) {
        const percent = 10 + Math.round((framesEncoded / frameCount) * 75)
        onProgress({
          step: 'encoding',
          percent,
          message: `${preferGpu ? 'GPU' : 'WebCodecs'} encoding: ${framesEncoded}/${frameCount}…`,
        })
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  if (framesEncoded !== frameCount) {
    encoder.close()
    throw new Error(`Expected ${frameCount} frames but found ${framesEncoded}`)
  }

  onProgress({
    step: 'reading-output',
    percent: 88,
    message: 'Finalizing video…',
  })

  await encoder.flush()
  encoder.close()
  muxer.finalize()

  const buffer = muxer.target.buffer
  const videoBlob = new Blob([buffer], { type: 'video/mp4' })
  const url = URL.createObjectURL(videoBlob)

  const originalDurationMs = session.frameCount * session.intervalMs

  onProgress({
    step: 'completed',
    percent: 100,
    message: preferGpu
      ? 'GPU export completed successfully!'
      : 'Export completed successfully!',
  })

  return {
    url,
    durationSec: frameCount / fps,
    frameCount,
    originalDurationMs,
    backend: preferGpu ? 'gpu' : 'cpu',
  }
}
