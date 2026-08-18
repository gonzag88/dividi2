import { describe, expect, it } from 'vitest'
import {
  createPerson,
  editPerson,
  findByName,
  forgetPerson,
  isAlreadyInGroup,
  isNameTaken,
  personKey,
  rememberPerson,
  seedDirectory,
  sortedDirectory,
  suggestPeople,
  type SavedPerson,
} from './directory'
import { addPerson, createGroup } from './mutations'

function agenda(entries: Array<[string, number]>): SavedPerson[] {
  return entries.map(([name, lastUsedAt], index) => ({ id: `p${index}`, name, lastUsedAt }))
}

describe('clave de comparación', () => {
  it('ignora mayúsculas, acentos y espacios de más', () => {
    expect(personKey('  JOSÉ   Luis ')).toBe('jose luis')
    expect(personKey('josé luis')).toBe(personKey('Jose  Luis'))
  })
})

describe('recordar personas', () => {
  it('agrega el nombre normalizado', () => {
    const { directory, person } = rememberPerson([], '  Ana  ', 100)
    expect(directory).toHaveLength(1)
    expect(person.name).toBe('Ana')
    expect(person.lastUsedAt).toBe(100)
  })

  it('no duplica: refresca la entrada existente y se queda con la última grafía', () => {
    const first = rememberPerson([], 'jose', 100).directory
    const { directory } = rememberPerson(first, 'José', 200)

    expect(directory).toHaveLength(1)
    expect(directory[0].name).toBe('José')
    expect(directory[0].lastUsedAt).toBe(200)
    // Mismo id: es la misma entrada, no una nueva.
    expect(directory[0].id).toBe(first[0].id)
  })

  it('olvidar saca sólo esa entrada', () => {
    const directory = agenda([['Ana', 1], ['Beto', 2]])
    expect(forgetPerson(directory, 'p0').map((p) => p.name)).toEqual(['Beto'])
  })
})

describe('sugerencias', () => {
  const directory = agenda([
    ['Ana', 10],
    ['Mariana', 30],
    ['Martín', 20],
    ['Nico', 40],
  ])

  it('con el campo vacío muestra lo más usado primero', () => {
    expect(suggestPeople(directory, '', [], 3).map((p) => p.name)).toEqual([
      'Nico',
      'Mariana',
      'Martín',
    ])
  })

  it('prioriza los que empiezan con lo tipeado sobre los que lo contienen', () => {
    // "Mariana" es más reciente, pero "ari" está en el medio; "Ana" arranca con "an".
    expect(suggestPeople(directory, 'an', []).map((p) => p.name)).toEqual(['Ana', 'Mariana'])
  })

  it('ignora acentos y mayúsculas al buscar', () => {
    expect(suggestPeople(directory, 'MARTI', []).map((p) => p.name)).toEqual(['Martín'])
  })

  it('deja afuera a quienes ya son integrantes del grupo', () => {
    expect(suggestPeople(directory, 'mar', ['martin']).map((p) => p.name)).toEqual(['Mariana'])
  })

  it('respeta el límite', () => {
    expect(suggestPeople(directory, '', [], 2)).toHaveLength(2)
  })
})

describe('nombres repetidos en el grupo', () => {
  it('detecta al integrante que ya está, sin importar cómo se escriba', () => {
    expect(isAlreadyInGroup(['José'], 'jose')).toBe(true)
    expect(isAlreadyInGroup(['José'], 'Josefina')).toBe(false)
  })

  it('un nombre vacío no cuenta como repetido', () => {
    expect(isAlreadyInGroup(['Ana'], '   ')).toBe(false)
  })
})

describe('siembra inicial', () => {
  it('junta los nombres de todos los grupos sin repetir', () => {
    const uno = addPerson(addPerson(createGroup('Uno'), 'Ana'), 'Beto')
    const dos = addPerson(addPerson(createGroup('Dos'), 'ana'), 'Caro')

    expect(seedDirectory([uno, dos], 5).map((p) => p.name)).toEqual(['ana', 'Beto', 'Caro'])
  })
})

describe('gestión de la agenda', () => {
  it('crea con alias y lo deja disponible por nombre', () => {
    const { directory, person } = createPerson([], '  Ana  ', ' ana.mp ', 7)

    expect(person).toEqual({ id: person.id, name: 'Ana', lastUsedAt: 7, alias: 'ana.mp' })
    expect(findByName(directory, 'ANA')?.alias).toBe('ana.mp')
  })

  it('sin alias no guarda la clave, para no dejar undefined en la base', () => {
    const { person } = createPerson([], 'Ana', '   ', 7)

    expect('alias' in person).toBe(false)
  })

  it('editar cambia nombre y alias sin tocar el id ni el orden de uso', () => {
    const base = createPerson([], 'Martn', '', 7).directory
    const { directory, person } = editPerson(base, base[0].id, 'Martín', 'martin.cbu')

    expect(person).toEqual({ id: base[0].id, name: 'Martín', lastUsedAt: 7, alias: 'martin.cbu' })
    expect(directory).toHaveLength(1)
  })

  it('editar con el alias vacío lo borra', () => {
    const base = createPerson([], 'Ana', 'ana.mp', 7).directory
    const { person } = editPerson(base, base[0].id, 'Ana', '')

    expect(person && 'alias' in person).toBe(false)
  })

  it('editar a alguien que ya no está no inventa una entrada nueva', () => {
    const { directory, person } = editPerson([], 'fantasma', 'Ana', '')

    expect(directory).toEqual([])
    expect(person).toBeUndefined()
  })

  it('recordar a alguien al sumarlo a un grupo no le pisa el alias', () => {
    const base = createPerson([], 'Ana', 'ana.mp', 7).directory
    const { person } = rememberPerson(base, 'ana', 99)

    expect(person.alias).toBe('ana.mp')
    expect(person.lastUsedAt).toBe(99)
  })

  it('detecta el nombre ocupado por otra entrada, no por uno mismo', () => {
    const directory = agenda([['Ana', 1], ['Beto', 2]])

    expect(isNameTaken(directory, 'ana', null)).toBe(true)
    // Guardar a Ana sin cambiarle el nombre no choca consigo misma.
    expect(isNameTaken(directory, 'Ana', 'p0')).toBe(false)
    expect(isNameTaken(directory, 'Ana', 'p1')).toBe(true)
    expect(isNameTaken(directory, 'Caro', null)).toBe(false)
  })

  it('la lista de gestión va alfabética, no por uso', () => {
    const directory = agenda([['Zoe', 100], ['ana', 1], ['Ñoño', 50]])

    expect(sortedDirectory(directory).map((person) => person.name)).toEqual(['ana', 'Ñoño', 'Zoe'])
  })
})
