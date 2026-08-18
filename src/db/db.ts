import { seedDirectory, type SavedPerson } from '../domain/directory'
import type { Group } from '../domain/types'

/**
 * IndexedDB es la única fuente de verdad. Cada grupo se guarda como un
 * documento completo (con sus personas y sus gastos adentro): así cada cambio
 * es una escritura atómica y borrar un grupo borra todo lo suyo de una.
 *
 * El store `people` es aparte y no se relaciona con nada: es sólo la agenda de
 * nombres para autocompletar. Ver `src/domain/directory.ts`.
 */

const DB_NAME = 'dividi2'
const DB_VERSION = 2
const GROUPS = 'groups'
const PEOPLE = 'people'

let dbPromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = request.result
      if (!db.objectStoreNames.contains(GROUPS)) {
        db.createObjectStore(GROUPS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(PEOPLE)) {
        const people = db.createObjectStore(PEOPLE, { keyPath: 'id' })
        // Al estrenar la agenda se la siembra con la gente que ya estaba
        // cargada en los grupos: si no, la primera vez no sugeriría nada.
        if (event.oldVersion > 0 && request.transaction) {
          const groups = request.transaction.objectStore(GROUPS).getAll()
          groups.onsuccess = () => {
            for (const person of seedDirectory(groups.result as Group[])) {
              people.put(person)
            }
          }
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

function run<T>(
  storeName: string,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode)
        const request = work(transaction.objectStore(storeName))
        transaction.oncomplete = () => resolve(request.result)
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
      }),
  )
}

/** Los grupos se ordenan alfabéticamente: el grupo no guarda fecha de creación. */
export async function getAllGroups(): Promise<Group[]> {
  const groups = await run<Group[]>(GROUPS, 'readonly', (store) => store.getAll())
  return groups.sort((a, b) => a.name.localeCompare(b.name, 'es-AR') || a.id.localeCompare(b.id))
}

export async function putGroup(group: Group): Promise<void> {
  await run(GROUPS, 'readwrite', (store) => store.put(group))
}

export async function deleteGroup(groupId: string): Promise<void> {
  await run(GROUPS, 'readwrite', (store) => store.delete(groupId))
}

/** La agenda se ordena en memoria al usarla; acá sale tal cual está guardada. */
export function getDirectory(): Promise<SavedPerson[]> {
  return run<SavedPerson[]>(PEOPLE, 'readonly', (store) => store.getAll())
}

export async function putSavedPerson(person: SavedPerson): Promise<void> {
  await run(PEOPLE, 'readwrite', (store) => store.put(person))
}

export async function deleteSavedPerson(personId: string): Promise<void> {
  await run(PEOPLE, 'readwrite', (store) => store.delete(personId))
}

/** Sólo para tests: cierra la conexión abierta para poder volver a abrirla de cero. */
export async function resetConnection(): Promise<void> {
  const pending = dbPromise
  dbPromise = null
  if (pending) (await pending).close()
}
