import { newId } from './ids'
import type { Group } from './types'

/**
 * Agenda de nombres: la memoria de con quién solés dividir gastos.
 *
 * Es sólo un autocompletado. Elegir a alguien de la agenda copia su nombre y el
 * grupo crea su propia Person con id nuevo: no queda ningún vínculo entre las
 * dos cosas. La agenda no sabe en qué grupos estuvo cada nombre, y los grupos
 * no saben que el nombre salió de acá. Borrar una entrada de la agenda no toca
 * ningún grupo, y sacar a alguien de un grupo no lo borra de la agenda.
 */
export interface SavedPerson {
  id: string
  name: string
  /** Sólo para ordenar las sugerencias: lo más usado, primero. */
  lastUsedAt: number
}

/** Cuántas sugerencias se muestran con el campo todavía vacío. */
export const SUGGESTION_LIMIT = 5

/** "  josé   luis " -> "José   luis" pierde los espacios de más, no el acento. */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

/** Clave de comparación: "José" y "jose" son la misma persona en la agenda. */
export function personKey(raw: string): string {
  return normalizeName(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Guarda el nombre en la agenda, o refresca el que ya estaba. La grafía más
 * reciente gana: si escribiste "jose" y después "José", queda "José".
 */
export function rememberPerson(
  directory: SavedPerson[],
  rawName: string,
  now: number = Date.now(),
): { directory: SavedPerson[]; person: SavedPerson } {
  const name = normalizeName(rawName)
  const key = personKey(name)
  const existing = directory.find((person) => personKey(person.name) === key)

  const person: SavedPerson = existing
    ? { ...existing, name, lastUsedAt: now }
    : { id: newId(), name, lastUsedAt: now }

  return {
    directory: existing
      ? directory.map((item) => (item.id === person.id ? person : item))
      : [...directory, person],
    person,
  }
}

export function forgetPerson(directory: SavedPerson[], personId: string): SavedPerson[] {
  return directory.filter((person) => person.id !== personId)
}

/**
 * Sugerencias para lo que se está escribiendo. Deja afuera a quienes ya son
 * integrantes del grupo: agregarlos de nuevo no haría nada.
 *
 * Primero los que empiezan con lo tipeado, después los que lo contienen en el
 * medio; dentro de cada tanda, lo usado más recientemente arriba.
 */
export function suggestPeople(
  directory: SavedPerson[],
  query: string,
  takenNames: string[],
  limit: number = SUGGESTION_LIMIT,
): SavedPerson[] {
  const taken = new Set(takenNames.map(personKey))
  const search = personKey(query)

  return directory
    .filter((person) => !taken.has(personKey(person.name)))
    .map((person) => ({ person, at: personKey(person.name).indexOf(search) }))
    .filter((match) => match.at >= 0)
    .sort(
      (a, b) =>
        Number(a.at > 0) - Number(b.at > 0) ||
        b.person.lastUsedAt - a.person.lastUsedAt ||
        a.person.name.localeCompare(b.person.name, 'es-AR'),
    )
    .slice(0, limit)
    .map((match) => match.person)
}

/** true si ese nombre ya es integrante del grupo: no se puede agregar dos veces. */
export function isAlreadyInGroup(takenNames: string[], rawName: string): boolean {
  const key = personKey(rawName)
  return key !== '' && takenNames.some((name) => personKey(name) === key)
}

/**
 * Siembra inicial de la agenda con la gente que ya está cargada en los grupos,
 * para que la primera vez que se abre la app ya haya algo que sugerir.
 */
export function seedDirectory(groups: Group[], now: number = Date.now()): SavedPerson[] {
  let directory: SavedPerson[] = []
  for (const group of groups) {
    for (const person of group.people) {
      if (normalizeName(person.name) === '') continue
      directory = rememberPerson(directory, person.name, now).directory
    }
  }
  return directory
}
