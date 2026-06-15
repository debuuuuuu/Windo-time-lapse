import type { LiveClockLabels } from '../../utils/formatLiveClock'

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

export function drawClockBurnIn(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  labels: LiveClockLabels,
): void {
  const scale = Math.max(1, Math.min(width, height) / 720)
  const timeSize = Math.round(28 * scale)
  const dateSize = Math.round(13 * scale)
  const paddingX = Math.round(16 * scale)
  const paddingY = Math.round(12 * scale)
  const margin = Math.round(24 * scale)

  ctx.save()
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'

  ctx.font = `600 ${timeSize}px ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`
  const timeWidth = ctx.measureText(labels.time).width

  ctx.font = `500 ${dateSize}px ui-sans-serif, system-ui, sans-serif`
  const dateWidth = ctx.measureText(labels.date).width

  const blockWidth = Math.max(timeWidth, dateWidth) + paddingX * 2
  const blockHeight = timeSize + dateSize + paddingY * 2 + Math.round(4 * scale)
  const x = width - margin - blockWidth
  const y = margin

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  fillRoundedRect(ctx, x, y, blockWidth, blockHeight, Math.round(12 * scale))

  ctx.fillStyle = '#ffffff'
  ctx.font = `600 ${timeSize}px ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`
  ctx.fillText(labels.time, x + blockWidth - paddingX, y + paddingY)

  ctx.font = `500 ${dateSize}px ui-sans-serif, system-ui, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
  ctx.fillText(
    labels.date,
    x + blockWidth - paddingX,
    y + paddingY + timeSize + Math.round(4 * scale),
  )

  ctx.restore()
}
