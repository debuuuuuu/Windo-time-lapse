import { useEffect, useState } from 'react'
import {
  describeExportFallback,
  evenDimension,
  resolveEncoderConfig,
  type ExportFallbackReason,
} from '../services/export/exportCapability'
import type { ExportBackend } from '../types/export'

interface PreferredExportBackend {
  backend: ExportBackend | null
  fallbackReason: ExportFallbackReason | null
}

export function usePreferredExportBackend(
  width: number,
  height: number,
  fps: number,
  enabled: boolean,
): PreferredExportBackend {
  const [state, setState] = useState<PreferredExportBackend>({
    backend: null,
    fallbackReason: null,
  })

  useEffect(() => {
    if (!enabled || width < 2 || height < 2) {
      setState({ backend: null, fallbackReason: null })
      return
    }

    let cancelled = false

    void resolveEncoderConfig(evenDimension(width), evenDimension(height), fps).then(
      ({ resolved, reason }) => {
        if (cancelled) return
        if (resolved?.backend === 'gpu') {
          setState({ backend: 'gpu', fallbackReason: null })
        } else if (resolved?.backend === 'cpu') {
          setState({ backend: 'cpu', fallbackReason: null })
        } else {
          setState({ backend: 'ffmpeg', fallbackReason: reason })
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [enabled, width, height, fps])

  return state
}

export { describeExportFallback }
