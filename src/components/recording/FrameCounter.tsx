import { useTimelapse } from '../../context/TimelapseProvider'
import { formatDuration } from '../../utils/formatDuration'

export function FrameCounter() {
  const { frameCount, isRecording, elapsedMs } = useTimelapse()

  return (
    <div className="grid grid-cols-2 gap-2" role="status" aria-live="polite" aria-atomic="true">
      <div className="rounded-xl bg-white/10 border border-white/20 px-2.5 py-2 text-center backdrop-blur-sm">
        <p className="text-[10px] font-medium text-white/60 uppercase tracking-wide">Frames</p>
        <p className="text-xl font-bold text-white tabular-nums leading-tight drop-shadow-md">
          {frameCount.toLocaleString()}
        </p>
      </div>
      <div className="rounded-xl bg-white/10 border border-white/20 px-2.5 py-2 text-center backdrop-blur-sm">
        <p className="text-[10px] font-medium text-white/60 uppercase tracking-wide">Time</p>
        <p className="text-xl font-bold text-white tabular-nums leading-tight drop-shadow-md">
          {isRecording ? formatDuration(elapsedMs) : '—'}
        </p>
      </div>
    </div>
  )
}
