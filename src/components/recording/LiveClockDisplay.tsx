import { useTimelapse } from '../../context/TimelapseProvider'

export function LiveClockDisplay() {
  const { clockVisible, liveTime, liveDate } = useTimelapse()

  if (!clockVisible) return null

  return (
    <div className="live-clock-display pointer-events-none" aria-live="off">
      <time className="live-clock-time timer-slashed-zero" dateTime={liveTime}>
        {liveTime}
      </time>
      <span className="live-clock-date">{liveDate}</span>
    </div>
  )
}
