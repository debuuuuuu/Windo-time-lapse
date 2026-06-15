import { AlertTriangle, ArrowDownToLine, Film, RotateCcw, Trash2 } from 'lucide-react'
import { useTimelapse } from '../../context/TimelapseProvider'
import { FpsSelector } from './FpsSelector'
import { ExportProgressBar } from './ExportProgressBar'
import { formatDurationSeconds } from '../../utils/formatDuration'
import { isCrossOriginIsolated } from '../../services/export/ffmpegLoader'
import {
  buttonGlassDeleteClassName,
  buttonGlassPrimaryClassName,
  buttonGlassSecondaryClassName,
} from '../ui/FormField'

export function ExportPanel() {
  const {
    session,
    isRecording,
    fps,
    setFps,
    exportProgress,
    exportUrl,
    exportResult,
    isExporting,
    triggerExport,
    resetExport,
    deleteSession,
  } = useTimelapse()

  const hasFrames = session && session.frameCount > 0
  const canExport = hasFrames && !isRecording && exportProgress.step === 'idle' && !exportUrl
  const canDelete = hasFrames && !isRecording && !isExporting
  const isIsolated = isCrossOriginIsolated()

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete ${session?.frameCount ?? 0} captured frames? This frees storage and cannot be undone.`,
      )
    ) {
      void deleteSession()
    }
  }

  return (
    <div id="export" className="flex flex-col gap-2 min-h-0">
      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Export</p>

      {isRecording && (
        <p className="text-[11px] text-white/70 leading-snug drop-shadow-sm" role="status">
          Stop recording to export.
        </p>
      )}

      {!isRecording && !hasFrames && !exportUrl && exportProgress.step !== 'failed' && (
        <p className="text-[11px] text-white/70 leading-snug drop-shadow-sm" role="status">
          Record frames first.
        </p>
      )}

      {canExport && (
        <>
          <FpsSelector value={fps} onChange={setFps} disabled={isExporting} />
          {!isIsolated && (
            <p className="text-[10px] text-[#FFD60A] flex items-center gap-1 drop-shadow-sm">
              <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
              Export may be slow
            </p>
          )}
          <button
            type="button"
            onClick={() => void triggerExport()}
            disabled={isExporting}
            className={buttonGlassPrimaryClassName}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Film className="w-4 h-4" aria-hidden="true" />
              Create MP4
            </span>
          </button>
        </>
      )}

      {isExporting && (
        <div role="status" aria-live="polite" aria-busy="true">
          <ExportProgressBar progress={exportProgress} />
        </div>
      )}

      {exportUrl && exportResult && session && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-[#34C759] font-semibold drop-shadow-sm">
            Ready · {formatDurationSeconds(exportResult.durationSec)} video
          </p>
          <a
            href={exportUrl}
            download={`timelapse_${session.id}.mp4`}
            className={`${buttonGlassPrimaryClassName} bg-[#34C759]/90 hover:bg-[#34C759] text-center`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
              Download MP4
            </span>
          </a>
          <button type="button" onClick={resetExport} className={buttonGlassSecondaryClassName}>
            <span className="flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Export again
            </span>
          </button>
        </div>
      )}

      {exportProgress.step === 'failed' && (
        <div className="flex flex-col gap-2" role="alert">
          <p className="text-[11px] text-[#FF6B6B] drop-shadow-sm">{exportProgress.message}</p>
          <button type="button" onClick={resetExport} className={buttonGlassPrimaryClassName}>
            Try again
          </button>
        </div>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={handleDelete}
          className={buttonGlassDeleteClassName}
          aria-label="Delete captured frames"
        >
          <span className="flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Delete frames
          </span>
        </button>
      )}
    </div>
  )
}
