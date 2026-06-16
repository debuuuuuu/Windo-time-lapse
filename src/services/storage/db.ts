const DB_NAME = 'TimelapseRecorderDB'
// Version 2: adds 'sessionFrame' composite index that was missing from v1 databases.
// This upgrades existing v1 DBs that only had the 'sessionId' index on the frames store.
const DB_VERSION = 2
export const SESSION_STORE = 'sessions'
export const FRAME_STORE = 'frames'

let dbPromise: Promise<IDBDatabase> | null = null

export function openDatabase(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = request.result
        const oldVersion = event.oldVersion

        // ── Fresh install (v0 → v2) ──────────────────────────────────────────
        if (!db.objectStoreNames.contains(SESSION_STORE)) {
          db.createObjectStore(SESSION_STORE, { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains(FRAME_STORE)) {
          const frameStore = db.createObjectStore(FRAME_STORE, { keyPath: 'id' })
          frameStore.createIndex('sessionId', 'sessionId', { unique: false })
          frameStore.createIndex('sessionFrame', ['sessionId', 'frameIndex'], { unique: true })
          return
        }

        // ── Migration: v1 → v2 ───────────────────────────────────────────────
        // v1 created the FRAME_STORE without the 'sessionFrame' composite index.
        // We add it here so existing databases can export sessions.
        if (oldVersion < 2) {
          const transaction = event.target
            ? (event.target as IDBOpenDBRequest).transaction
            : null

          if (transaction) {
            const frameStore = transaction.objectStore(FRAME_STORE)

            // Only create the index if it's truly missing (guards against future re-runs)
            if (!frameStore.indexNames.contains('sessionFrame')) {
              frameStore.createIndex('sessionFrame', ['sessionId', 'frameIndex'], {
                unique: true,
              })
            }

            // Ensure the sessionId index also exists (defensive)
            if (!frameStore.indexNames.contains('sessionId')) {
              frameStore.createIndex('sessionId', 'sessionId', { unique: false })
            }
          }
        }
      }
    })
  }

  return dbPromise
}

export function runTransaction<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  fn: (stores: Record<string, IDBObjectStore>) => Promise<T> | T,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const names = Array.isArray(storeNames) ? storeNames : [storeNames]
        const transaction = db.transaction(names, mode)
        const stores: Record<string, IDBObjectStore> = {}
        for (const name of names) {
          stores[name] = transaction.objectStore(name)
        }

        Promise.resolve(fn(stores))
          .then(resolve)
          .catch(reject)

        transaction.onerror = () => reject(transaction.error)
      }),
  )
}

export function frameKey(sessionId: string, frameIndex: number): string {
  return `${sessionId}:${frameIndex}`
}
