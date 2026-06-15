import type { TimerOverlayMode } from '../../constants/timerOverlay'
import { formatTimerDisplay } from '../../utils/timerDisplay'

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius)
  } else {
    ctx.rect(x, y, w, h)
  }
  ctx.fill()
}

export function drawTimerBurnIn(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  displayMs: number,
  mode: TimerOverlayMode,
): void {
  const text = formatTimerDisplay(displayMs)
  const scale = Math.max(1, Math.min(width, height) / 720)
  const fontSize = Math.round(56 * scale)
  const pillFontSize = Math.round(11 * scale)
  const paddingX = Math.round(20 * scale)
  const paddingY = Math.round(14 * scale)
  const margin = Math.round(24 * scale)

  ctx.save()

  ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  const textMetrics = ctx.measureText(text)
  const textWidth = textMetrics.width
  const textHeight = fontSize * 1.1

  ctx.font = `600 ${pillFontSize}px ui-sans-serif, system-ui, sans-serif`
  const pillWidth = Math.round(220 * scale)
  const pillHeight = pillFontSize + paddingY * 2

  const blockWidth = Math.max(textWidth, pillWidth) + paddingX * 2
  const blockHeight = textHeight + pillHeight + paddingY * 2 + Math.round(8 * scale)
  const x = margin
  const y = margin

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  fillRoundedRect(ctx, x, y, blockWidth, blockHeight, Math.round(12 * scale))

  ctx.fillStyle = '#ffffff'
  ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`
  ctx.fillText(text, x + paddingX, y + paddingY)

  const pillY = y + paddingY + textHeight + Math.round(8 * scale)
  const pillX = x + paddingX
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  fillRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, pillHeight / 2)

  ctx.font = `600 ${pillFontSize}px ui-sans-serif, system-ui, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.fillText('MODE:', pillX + Math.round(10 * scale), pillY + paddingY * 0.85)

  const stopwatchX = pillX + Math.round(52 * scale)
  ctx.fillStyle = mode === 'stopwatch' ? '#7ec8ff' : 'rgba(255, 255, 255, 0.75)'
  ctx.fillText('Stopwatch', stopwatchX, pillY + paddingY * 0.85)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
  const sepX = stopwatchX + Math.round(72 * scale)
  ctx.fillText('|', sepX, pillY + paddingY * 0.85)

  ctx.fillStyle = mode === 'focus' ? '#7ec8ff' : 'rgba(255, 255, 255, 0.75)'
  ctx.fillText('Focus Timer', sepX + Math.round(10 * scale), pillY + paddingY * 0.85)

  ctx.restore()
}
