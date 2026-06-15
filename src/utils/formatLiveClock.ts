export interface LiveClockLabels {
  time: string
  date: string
}

export function formatLiveClock(now: Date): LiveClockLabels {
  const time = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const date = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return { time, date }
}
