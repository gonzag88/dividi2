import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { deleteGroup, getAllGroups, putGroup, resetConnection } from './db'
import { addExpense, addPerson, createGroup } from '../domain/mutations'
import type { Group } from '../domain/types'

async function clear() {
  for (const group of await getAllGroups()) {
    await deleteGroup(group.id)
  }
}

function withTwoPeople(name: string): Group {
  return addPerson(addPerson(createGroup(name), 'Gonzalo'), 'Nico')
}

describe('persistencia en IndexedDB', () => {
  beforeEach(async () => {
    resetConnection()
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
    resetConnection()
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
