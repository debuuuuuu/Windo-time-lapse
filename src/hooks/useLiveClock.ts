import { useEffect, useState } from 'react'
import { formatLiveClock, type LiveClockLabels } from '../utils/formatLiveClock'

const EMPTY: LiveClockLabels = { time: '--:--:--', date: '—' }

export function useLiveClock(active = true): LiveClockLabels {
  const [labels, setLabels] = useState<LiveClockLabels>(() =>
    active ? formatLiveClock(new Date()) : EMPTY,
  )

  useEffect(() => {
    if (!active) {
      setLabels(EMPTY)
      return
    }

    const tick = () => setLabels(formatLiveClock(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [active])

  return labels
}
