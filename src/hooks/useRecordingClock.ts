import { useEffect, useState } from 'react'

export function useRecordingClock(
  isRecording: boolean,
  getStartedAt: () => number | null,
) {
  const [wallElapsedMs, setWallElapsedMs] = useState(0)

  useEffect(() => {
    if (!isRecording) {
      setWallElapsedMs(0)
      return
    }

    const tick = () => {
      const startedAt = getStartedAt()
      if (!startedAt) return
      setWallElapsedMs(Date.now() - startedAt)
    }

    tick()
    const id = window.setInterval(tick, 100)
    return () => clearInterval(id)
  }, [isRecording, getStartedAt])

  return wallElapsedMs
}
