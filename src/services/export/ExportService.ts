import type { ExportOptions, ExportResult } from '../../types/export'
import { frameStorage } from '../storage/FrameStorageService'
import { evenDimension, isWebCodecsAvailable, resolveExportBackend } from './exportCapability'
import { getFFmpeg } from './ffmpegLoader'
import { exportTimelapseWithWebCodecs } from './webCodecsExport'

const EXPORT_BATCH_SIZE = 50

export class ExportService {
  async exportTimelapse(options: ExportOptions): Promise<ExportResult> {
    const { sessionId, fps, onProgress } = options

    const session = await frameStorage.getSession(sessionId)
    if (session && isWebCodecsAvailable()) {
      const width = evenDimension(session.width)
      const height = evenDimension(session.height)
      const backend = await resolveExportBackend(width, height, fps)

      if (backend !== null) {
        try {
          return await exportTimelapseWithWebCodecs(options)
        } catch (error) {
          console.warn('WebCodecs export failed, falling back to FFmpeg:', error)
          onProgress({
            step: 'loading-ffmpeg',
            percent: 5,
            message: 'GPU export unavailable, using FFmpeg fallback…',
          })
        }
      }
    }

    return this.exportWithFFmpeg(options)
  }

  private async exportWithFFmpeg(options: ExportOptions): Promise<ExportResult> {
    const { sessionId, frameCount, fps, onProgress } = options

    try {
      onProgress({
        step: 'loading-ffmpeg',
        percent: 5,
        message: 'Loading video transcoder (FFmpeg WASM)…',
      })

      const ffmpeg = await getFFmpeg()

      ffmpeg.on('progress', ({ progress }) => {
        const percent = 40 + Math.round(progress * 50)
        onProgress({
          step: 'encoding',
          percent,
          message: `CPU encoding… ${Math.round(progress * 100)}%`,
        })
      })

      onProgress({
        step: 'writing-frames',
        percent: 10,
        message: 'Reading frames from database…',
      })

      const writtenFiles: string[] = []
      let framesWritten = 0

      await frameStorage.iterateFrames(sessionId, EXPORT_BATCH_SIZE, async (batch) => {
        for (const { frameIndex, blob } of batch) {
          const arrayBuffer = await blob.arrayBuffer()
          const filename = `frame_${frameIndex.toString().padStart(5, '0')}.jpg`
          await ffmpeg.writeFile(filename, new Uint8Array(arrayBuffer))
          writtenFiles.push(filename)
          framesWritten++

          if (framesWritten % 20 === 0 || framesWritten === frameCount) {
            const writePercent = 10 + Math.round((framesWritten / frameCount) * 30)
            onProgress({
              step: 'writing-frames',
              percent: writePercent,
              message: `Preparing frames: ${framesWritten}/${frameCount}…`,
            })
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      if (framesWritten !== frameCount) {
        throw new Error(`Expected ${frameCount} frames but found ${framesWritten}`)
      }

      onProgress({
        step: 'encoding',
        percent: 40,
        message: 'Starting FFmpeg encoding…',
      })

      await ffmpeg.exec([
        '-framerate', fps.toString(),
        '-i', 'frame_%05d.jpg',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        'output.mp4',
      ])

      onProgress({
        step: 'reading-output',
        percent: 90,
        message: 'Generating download link…',
      })

      const fileData = await ffmpeg.readFile('output.mp4')
      const videoBlob = new Blob([fileData as BlobPart], { type: 'video/mp4' })
      const url = URL.createObjectURL(videoBlob)

      onProgress({
        step: 'reading-output',
        percent: 95,
        message: 'Cleaning up temporary files…',
      })

      for (const file of [...writtenFiles, 'output.mp4']) {
        try {
          await ffmpeg.deleteFile(file)
        } catch {
          // Non-fatal cleanup failure
        }
      }

      const session = await frameStorage.getSession(sessionId)
      const originalDurationMs = session
        ? session.frameCount * session.intervalMs
        : frameCount * 1000

      onProgress({
        step: 'completed',
        percent: 100,
        message: 'Export completed successfully!',
      })

      return {
        url,
        durationSec: frameCount / fps,
        frameCount,
        originalDurationMs,
        backend: 'ffmpeg',
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      onProgress({
        step: 'failed',
        percent: 0,
        message: `Export failed: ${message}`,
      })
      throw error
    }
  }
}

export const exportService = new ExportService()
