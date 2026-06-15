import { useTimelapse } from '../../context/TimelapseProvider'
import { formatBytes } from '../../utils/formatBytes'

export function StorageIndicator() {
  const { storageStats } = useTimelapse()
  const { usedBytes, quotaBytes, percentage } = storageStats
  const isWarning = percentage > 80

  return (
    <div className="mt-auto pt-2 border-t border-white/15">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-medium text-white/50 uppercase tracking-wide">Storage</span>
        <span className="text-[10px] text-white/70 tabular-nums drop-shadow-sm">
          {formatBytes(usedBytes)}
          {quotaBytes > 0 && ` / ${formatBytes(quotaBytes)}`}
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden backdrop-blur-sm"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Storage used"
      >
        <div
          className={`h-full rounded-full ${isWarning ? 'bg-[#FF3B30]' : 'bg-[#007AFF]'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
