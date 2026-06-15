export function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  const hrs = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`
}

export function formatDurationSeconds(seconds: number): string {
  return `${seconds.toFixed(1)}s`
}
