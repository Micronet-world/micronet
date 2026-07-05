/**
 * Async key-value storage with automatic backend detection.
 *
 * Tiers (in order of preference):
 *   1. OPFS (Origin Private File System) — fast, large capacity, no origin quota
 *   2. IndexedDB — widely supported, large capacity, structured storage
 *   3. localStorage — synchronous fallback, ~5 MB limit
 */

interface StorageProvider {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  del(key: string): Promise<void>
}

// ─── OPFS ──────────────────────────────────────────────────────────────

function createOPFSProvider(): StorageProvider | null {
  const fs = navigator.storage
  if (!fs?.getDirectory) return null

  const rootPromise: Promise<FileSystemDirectoryHandle | null> =
    fs.getDirectory().catch(() => null)

  async function fileHandle(
    key: string,
    opts?: FileSystemGetFileOptions,
  ): Promise<FileSystemFileHandle | null> {
    const root = await rootPromise
    if (!root) return null
    try {
      return await root.getFileHandle(key, opts)
    } catch {
      return null
    }
  }

  return {
    async get(key) {
      const fh = await fileHandle(key)
      if (!fh) return null
      try {
        const file = await fh.getFile()
        return await file.text()
      } catch {
        return null
      }
    },

    async set(key, value) {
      const root = await rootPromise
      if (!root) throw new Error('OPFS unavailable')
      const fh = await root.getFileHandle(key, { create: true })
      const writable = await fh.createWritable()
      await writable.write(value)
      await writable.close()
    },

    async del(key) {
      const root = await rootPromise
      if (!root) return
      try {
        await root.removeEntry(key)
      } catch {
        // file doesn't exist — ignore
      }
    },
  }
}

// ─── IndexedDB ─────────────────────────────────────────────────────────

const IDB_DB = 'micronet-storage'
const IDB_STORE = 'kv'
const IDB_VERSION = 1

function openIDB(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    const req = indexedDB.open(IDB_DB, IDB_VERSION)

    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE)
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
}

function createIDBProvider(db: IDBDatabase): StorageProvider {
  function tx(mode: IDBTransactionMode) {
    return db.transaction(IDB_STORE, mode).objectStore(IDB_STORE)
  }

  return {
    async get(key) {
      return new Promise(resolve => {
        const req = tx('readonly').get(key)
        req.onsuccess = () => resolve(req.result ?? null)
        req.onerror = () => resolve(null)
      })
    },

    async set(key, value) {
      return new Promise((resolve, reject) => {
        const req = tx('readwrite').put(value, key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    },

    async del(key) {
      return new Promise((resolve, reject) => {
        const req = tx('readwrite').delete(key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    },
  }
}

// ─── localStorage ──────────────────────────────────────────────────────

function createLocalStorageProvider(): StorageProvider {
  return {
    async get(key) {
      return localStorage.getItem(key)
    },
    async set(key, value) {
      localStorage.setItem(key, value)
    },
    async del(key) {
      localStorage.removeItem(key)
    },
  }
}

// ─── Auto-detect ───────────────────────────────────────────────────────

let detectPromise: Promise<StorageProvider> | null = null

async function detect(): Promise<StorageProvider> {
  // Tier 1: OPFS
  try {
    const opfs = createOPFSProvider()
    if (opfs) {
      // Verify write access works
      await opfs.set('__opfs_test__', '1')
      await opfs.del('__opfs_test__')
      return opfs
    }
  } catch {
    // OPFS unavailable — fall through
  }

  // Tier 2: IndexedDB
  try {
    const db = await openIDB()
    if (db) return createIDBProvider(db)
  } catch {
    // IDB unavailable — fall through
  }

  // Tier 3: localStorage (always available)
  return createLocalStorageProvider()
}

function getProvider(): Promise<StorageProvider> {
  if (!detectPromise) detectPromise = detect()
  return detectPromise
}

export const storage = {
  async get(key: string): Promise<string | null> {
    const provider = await getProvider()
    return provider.get(key)
  },

  async set(key: string, value: string): Promise<void> {
    const provider = await getProvider()
    return provider.set(key, value)
  },

  async del(key: string): Promise<void> {
    const provider = await getProvider()
    return provider.del(key)
  },
}
