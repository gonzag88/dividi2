import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  deleteGroup,
  deleteSavedPerson,
  getAllGroups,
  getDirectory,
  putGroup,
  putSavedPerson,
  resetConnection,
} from './db'
import { addExpense, addPerson, createGroup } from '../domain/mutations'
import type { Group } from '../domain/types'

async function clear() {
  for (const group of await getAllGroups()) {
    await deleteGroup(group.id)
  }
  for (const person of await getDirectory()) {
    await deleteSavedPerson(person.id)
  }
}

function withTwoPeople(name: string): Group {
  return addPerson(addPerson(createGroup(name), 'Gonzalo'), 'Nico')
}

describe('persistencia en IndexedDB', () => {
  beforeEach(async () => {
    await resetConnection()
    await clear()
  })

  it('guarda y recupera un grupo con sus personas y gastos', async () => {
    let group = withTwoPeople('Viaje')
    const [gonzalo, nico] = group.people
    group = addExpense(group, {
      description: 'Cena',
      amountCents: 10000,
      paidBy: gonzalo.id,
      participants: [gonzalo.id, nico.id],
    })
    await putGroup(group)

    // Una conexión nueva: simula volver a abrir la app.
    await resetConnection()
    const [stored] = await getAllGroups()
    expect(stored).toEqual(group)
    expect(stored.expenses).toHaveLength(1)
    expect(stored.people).toHaveLength(2)
  })

  it('sobrescribe el grupo al guardarlo de nuevo', async () => {
    const group = withTwoPeople('Viaje')
    await putGroup(group)
    await putGroup({ ...group, name: 'Viaje a Brasil' })

    const groups = await getAllGroups()
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('Viaje a Brasil')
  })

  it('al eliminar un grupo se borran también sus integrantes y gastos', async () => {
    const uno = withTwoPeople('Uno')
    const dos = withTwoPeople('Dos')
    await putGroup(uno)
    await putGroup(dos)

    await deleteGroup(uno.id)

    const groups = await getAllGroups()
    expect(groups.map((group) => group.name)).toEqual(['Dos'])
    // El grupo eliminado no dejó nada atrás: el documento entero se fue.
    expect(groups.some((group) => group.id === uno.id)).toBe(false)
  })

  it('devuelve los grupos ordenados alfabéticamente', async () => {
    await putGroup(createGroup('Zapatos'))
    await putGroup(createGroup('asado'))
    await putGroup(createGroup('Ñoquis'))

    expect((await getAllGroups()).map((group) => group.name)).toEqual(['asado', 'Ñoquis', 'Zapatos'])
  })
})

describe('agenda de nombres', () => {
  beforeEach(async () => {
    await resetConnection()
    await clear()
  })

  it('guarda, recupera y olvida nombres, sin tocar los grupos', async () => {
    await putGroup(withTwoPeople('Viaje'))
    await putSavedPerson({ id: 'a', name: 'Ana', lastUsedAt: 10 })
    await putSavedPerson({ id: 'b', name: 'Beto', lastUsedAt: 20 })

    await resetConnection()
    expect((await getDirectory()).map((person) => person.name).sort()).toEqual(['Ana', 'Beto'])

    await deleteSavedPerson('a')
    expect((await getDirectory()).map((person) => person.name)).toEqual(['Beto'])
    // Borrar de la agenda no le hace nada al grupo.
    expect((await getAllGroups())[0].people).toHaveLength(2)
  })
})

describe('migración desde la versión 1', () => {
  it('siembra la agenda con la gente que ya estaba en los grupos', async () => {
    const group = withTwoPeople('Viaje')

    // Base vieja: sólo el store de grupos, como en la v1 instalada en el teléfono.
    await resetConnection()
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('dividi2')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('dividi2', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('groups', { keyPath: 'id' })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const transaction = legacy.transaction('groups', 'readwrite')
      transaction.objectStore('groups').put(group)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
    legacy.close()

    // Abrir la app actualizada dispara el upgrade a la v2.
    await resetConnection()

    expect((await getDirectory()).map((person) => person.name).sort()).toEqual(['Gonzalo', 'Nico'])
    // Los grupos siguen intactos.
    expect((await getAllGroups())[0]).toEqual(group)
  })
})
