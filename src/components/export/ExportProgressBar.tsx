import type { ExportProgress } from '../../types/export'

interface ExportProgressBarProps {
  progress: ExportProgress
}

export function ExportProgressBar({ progress }: ExportProgressBarProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-blue-500 motion-safe:transition-all motion-safe:duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <span className="text-[10px] text-white/50 tabular-nums shrink-0 w-8 text-right">
        {progress.percent}%
      </span>
    </div>
  )
}
