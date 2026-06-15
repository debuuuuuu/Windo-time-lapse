import type { TimelapseSession } from '../../types/session'
import type { FrameRecord, StorageStats } from '../../types/storage'
import {
  FRAME_STORE,
  SESSION_STORE,
  frameKey,
  openDatabase,
  runTransaction,
} from './db'

export class FrameStorageService {
  async saveSession(session: TimelapseSession): Promise<void> {
    await runTransaction(SESSION_STORE, 'readwrite', async (stores) => {
      await promisifyRequest(stores[SESSION_STORE].put(session))
    })
  }

  async getSession(id: string): Promise<TimelapseSession | null> {
    return runTransaction(SESSION_STORE, 'readonly', async (stores) => {
      const result = await promisifyRequest<TimelapseSession | undefined>(
        stores[SESSION_STORE].get(id),
      )
      return result ?? null
    })
  }

  async saveFrame(sessionId: string, frameIndex: number, blob: Blob): Promise<void> {
    const record: FrameRecord = {
      id: frameKey(sessionId, frameIndex),
      sessionId,
      frameIndex,
      blob,
      capturedAt: Date.now(),
    }

    await runTransaction(FRAME_STORE, 'readwrite', async (stores) => {
      await promisifyRequest(stores[FRAME_STORE].put(record))
    })
  }

  async getFrame(sessionId: string, frameIndex: number): Promise<Blob | null> {
    return runTransaction(FRAME_STORE, 'readonly', async (stores) => {
      const result = await promisifyRequest<FrameRecord | undefined>(
        stores[FRAME_STORE].get(frameKey(sessionId, frameIndex)),
      )
      return result?.blob ?? null
    })
  }

  /**
   * Iterate frames in order using an IDB cursor — avoids loading all blobs into RAM.
   */
  async getLatestStoppedSession(): Promise<TimelapseSession | null> {
    return runTransaction(SESSION_STORE, 'readonly', async (stores) => {
      const sessions = await promisifyRequest<TimelapseSession[]>(
        stores[SESSION_STORE].getAll(),
      )
      const stopped = sessions
        .filter((s) => s.status === 'stopped' || s.status === 'exported')
        .sort((a, b) => (b.stoppedAt ?? b.startedAt) - (a.stoppedAt ?? a.startedAt))
      return stopped[0] ?? null
    })
  }

  async listSessions(): Promise<TimelapseSession[]> {
    return runTransaction(SESSION_STORE, 'readonly', async (stores) => {
      const sessions = await promisifyRequest<TimelapseSession[]>(
        stores[SESSION_STORE].getAll(),
      )
      return sessions.sort(
        (a, b) => (b.stoppedAt ?? b.startedAt) - (a.stoppedAt ?? a.startedAt),
      )
    })
  }

  async iterateFrames(
    sessionId: string,
    batchSize: number,
    onBatch: (entries: { frameIndex: number; blob: Blob }[]) => Promise<void>,
  ): Promise<void> {
    const db = await openDatabase()
    const pendingBatches: { frameIndex: number; blob: Blob }[][] = []

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(FRAME_STORE, 'readonly')
      const store = transaction.objectStore(FRAME_STORE)
      const index = store.index('sessionFrame')
      const request = index.openCursor(
        IDBKeyRange.bound([sessionId, 0], [sessionId, Number.MAX_SAFE_INTEGER]),
      )

      let batch: { frameIndex: number; blob: Blob }[] = []

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result

        if (cursor) {
          const record = cursor.value as FrameRecord
          batch.push({ frameIndex: record.frameIndex, blob: record.blob })

          if (batch.length >= batchSize) {
            pendingBatches.push(batch)
            batch = []
          }

          cursor.continue()
        } else {
          if (batch.length > 0) {
            pendingBatches.push(batch)
          }
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
      transaction.onerror = () => reject(transaction.error)
    })

    for (const currentBatch of pendingBatches) {
      await onBatch(currentBatch)
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const db = await openDatabase()

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([SESSION_STORE, FRAME_STORE], 'readwrite')
      transaction.objectStore(SESSION_STORE).delete(sessionId)

      const frameStore = transaction.objectStore(FRAME_STORE)
      const index = frameStore.index('sessionId')
      const request = index.openCursor(IDBKeyRange.only(sessionId))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      request.onerror = () => reject(request.error)
    })
  }

  async getStorageEstimate(): Promise<StorageStats> {
    if (navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate()
        const usedBytes = estimate.usage ?? 0
        const quotaBytes = estimate.quota ?? 0
        const percentage = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0
        return { usedBytes, quotaBytes, percentage }
      } catch (error) {
        console.error('Storage estimate failed:', error)
      }
    }
    return { usedBytes: 0, quotaBytes: 0, percentage: 0 }
  }
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const frameStorage = new FrameStorageService()
