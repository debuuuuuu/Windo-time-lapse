import { useCallback, useEffect, useRef, useState } from 'react'
import { exportService } from '../services/export/ExportService'
import type { ExportProgress, ExportResult } from '../types/export'

const IDLE_PROGRESS: ExportProgress = {
  step: 'idle',
  percent: 0,
  message: '',
}

export function useExport() {
  const [progress, setProgress] = useState<ExportProgress>(IDLE_PROGRESS)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const exportUrlRef = useRef<string | null>(null)

  const isExporting =
    progress.step !== 'idle' &&
    progress.step !== 'completed' &&
    progress.step !== 'failed'

  const revokeExportUrl = useCallback(() => {
    if (exportUrlRef.current) {
      URL.revokeObjectURL(exportUrlRef.current)
      exportUrlRef.current = null
    }
  }, [])

  const resetExport = useCallback(() => {
    revokeExportUrl()
    setExportResult(null)
    setProgress(IDLE_PROGRESS)
  }, [revokeExportUrl])

  const triggerExport = useCallback(
    async (sessionId: string, frameCount: number, fps: number) => {
      resetExport()

      const result = await exportService.exportTimelapse({
        sessionId,
        frameCount,
        fps,
        onProgress: setProgress,
      })

      exportUrlRef.current = result.url
      setExportResult(result)
      return result
    },
    [resetExport],
  )

  useEffect(() => {
    return () => revokeExportUrl()
  }, [revokeExportUrl])

  return {
    progress,
    exportResult,
    exportUrl: exportResult?.url ?? null,
    isExporting,
    triggerExport,
    resetExport,
  }
}
