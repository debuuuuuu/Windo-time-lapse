const DB_NAME = 'TimelapseRecorderDB'
const DB_VERSION = 1
export const SESSION_STORE = 'sessions'
export const FRAME_STORE = 'frames'

let dbPromise: Promise<IDBDatabase> | null = null

export function openDatabase(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = () => {
        const db = request.result

        if (!db.objectStoreNames.contains(SESSION_STORE)) {
          db.createObjectStore(SESSION_STORE, { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains(FRAME_STORE)) {
          const frameStore = db.createObjectStore(FRAME_STORE, { keyPath: 'id' })
          frameStore.createIndex('sessionId', 'sessionId', { unique: false })
          frameStore.createIndex('sessionFrame', ['sessionId', 'frameIndex'], { unique: true })
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
