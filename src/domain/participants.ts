import type { Expense, Person } from './types'

/** "y" pasa a "e" antes de un sonido i: "Ana e Inés", pero "Ana y Hierro". */
function conjunctionFor(name: string): string {
  const plain = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  if (plain.startsWith('hie')) return 'y'
  return /^h?i/.test(plain) ? 'e' : 'y'
}

/** ["Ana"] -> "Ana" · ["Ana", "Beto"] -> "Ana y Beto" · 3+ -> "Ana, Beto y Caro". */
export function joinNames(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  const last = names[names.length - 1]
  const rest = names.slice(0, -1)
  return `${rest.join(', ')} ${conjunctionFor(last)} ${last}`
}

/**
 * Cómo se reparte un gasto, en la forma más corta que sea clara:
 * "todos", "solo Ana", "solo Ana y Beto", "todos menos Caro".
 *
 * Se elige nombrar al grupo más chico: si participan 2 de 5, es más corto
 * listarlos; si participan 4 de 5, conviene decir a quién se dejó afuera.
 */
export function describeParticipants(expense: Expense, people: Person[]): string {
  const inside = people.filter((person) => expense.participants.includes(person.id))
  const outside = people.filter((person) => !expense.participants.includes(person.id))

  if (inside.length === 0) return '—'
  if (outside.length === 0) return 'todos'
  if (inside.length <= outside.length) return `solo ${joinNames(inside.map((p) => p.name))}`
  return `todos menos ${joinNames(outside.map((p) => p.name))}`
}
