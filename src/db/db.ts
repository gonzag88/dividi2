import type { Group } from '../domain/types'

/**
 * IndexedDB es la única fuente de verdad. Cada grupo se guarda como un
 * documento completo (con sus personas y sus gastos adentro): así cada cambio
 * es una escritura atómica y borrar un grupo borra todo lo suyo de una.
 */

const DB_NAME = 'dividi2'
const DB_VERSION = 1
const STORE = 'groups'

let dbPromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const request = work(transaction.objectStore(STORE))
        transaction.oncomplete = () => resolve(request.result)
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
      }),
  )
}

/** Los grupos se ordenan alfabéticamente: el grupo no guarda fecha de creación. */
export async function getAllGroups(): Promise<Group[]> {
  const groups = await run<Group[]>('readonly', (store) => store.getAll())
  return groups.sort((a, b) => a.name.localeCompare(b.name, 'es-AR') || a.id.localeCompare(b.id))
}

export async function putGroup(group: Group): Promise<void> {
  await run('readwrite', (store) => store.put(group))
}

export async function deleteGroup(groupId: string): Promise<void> {
  await run('readwrite', (store) => store.delete(groupId))
}

/** Sólo para tests. */
export function resetConnection(): void {
  dbPromise = null
}
