export interface FrameRecord {
  id: string
  sessionId: string
  frameIndex: number
  blob: Blob
  capturedAt: number
}

export interface StorageStats {
  usedBytes: number
  quotaBytes: number
  percentage: number
}
