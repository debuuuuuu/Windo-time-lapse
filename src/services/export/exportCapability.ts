export type WebCodecsBackend = 'gpu' | 'cpu'

export type ExportFallbackReason =
  | 'webcodecs-unavailable'
  | 'invalid-dimensions'
  | 'no-h264-encoder'

const H264_CODECS = [
  'avc1.42001f',
  'avc1.42E01E',
  'avc1.4D401E',
  'avc1.640028',
  'avc1.420034',
] as const

const GPU_MODES: HardwareAcceleration[] = ['prefer-hardware', 'no-preference']
const SOFTWARE_MODES: HardwareAcceleration[] = ['prefer-software', 'no-preference']

export interface ResolvedEncoderConfig {
  config: VideoEncoderConfig
  backend: WebCodecsBackend
  codec: string
}

export function evenDimension(value: number): number {
  return value % 2 === 0 ? value : value - 1
}

export function estimateVideoBitrate(width: number, height: number, fps: number): number {
  const pixels = evenDimension(width) * evenDimension(height)
  return Math.min(20_000_000, Math.max(1_000_000, Math.round(pixels * fps * 0.08)))
}

export function isWebCodecsAvailable(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'
}

function baseConfig(
  codec: string,
  width: number,
  height: number,
  fps: number,
  hardwareAcceleration: HardwareAcceleration,
): VideoEncoderConfig {
  return {
    codec,
    width,
    height,
    bitrate: estimateVideoBitrate(width, height, fps),
    framerate: fps,
    hardwareAcceleration,
  }
}

async function isSupported(config: VideoEncoderConfig): Promise<boolean> {
  try {
    const result = await VideoEncoder.isConfigSupported(config)
    return Boolean(result.supported)
  } catch {
    return false
  }
}

async function findEncoderConfig(
  width: number,
  height: number,
  fps: number,
  modes: HardwareAcceleration[],
  backend: WebCodecsBackend,
): Promise<ResolvedEncoderConfig | null> {
  for (const codec of H264_CODECS) {
    for (const mode of modes) {
      const config = baseConfig(codec, width, height, fps, mode)
      if (await isSupported(config)) {
        return { config, backend, codec }
      }
    }
  }
  return null
}

export async function resolveEncoderConfig(
  width: number,
  height: number,
  fps: number,
): Promise<{ resolved: ResolvedEncoderConfig | null; reason: ExportFallbackReason | null }> {
  if (!isWebCodecsAvailable()) {
    return { resolved: null, reason: 'webcodecs-unavailable' }
  }

  const encWidth = evenDimension(width)
  const encHeight = evenDimension(height)
  if (encWidth < 2 || encHeight < 2) {
    return { resolved: null, reason: 'invalid-dimensions' }
  }

  const hardware = await findEncoderConfig(encWidth, encHeight, fps, GPU_MODES, 'gpu')
  if (hardware) return { resolved: hardware, reason: null }

  const software = await findEncoderConfig(encWidth, encHeight, fps, SOFTWARE_MODES, 'cpu')
  if (software) return { resolved: software, reason: null }

  return { resolved: null, reason: 'no-h264-encoder' }
}

export async function resolveExportBackend(
  width: number,
  height: number,
  fps: number,
): Promise<WebCodecsBackend | null> {
  const { resolved } = await resolveEncoderConfig(width, height, fps)
  return resolved?.backend ?? null
}

export async function buildEncoderConfig(
  width: number,
  height: number,
  fps: number,
  preferGpu: boolean,
): Promise<VideoEncoderConfig | null> {
  const { resolved } = await resolveEncoderConfig(width, height, fps)
  if (!resolved) return null
  if (preferGpu && resolved.backend !== 'gpu') {
    // Still return software config when GPU was requested but unavailable
    return resolved.config
  }
  return resolved.config
}

export function describeExportFallback(reason: ExportFallbackReason | null): string {
  switch (reason) {
    case 'webcodecs-unavailable':
      return 'This browser does not expose WebCodecs. Use Chrome or Edge on localhost for GPU export.'
    case 'invalid-dimensions':
      return 'Session video size is invalid for encoding.'
    case 'no-h264-encoder':
      return 'No H.264 encoder found. Enable hardware acceleration in your browser settings, or use Chrome/Edge.'
    default:
      return 'Using FFmpeg in the browser (CPU-only, slower than WebCodecs).'
  }
}
