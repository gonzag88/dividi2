import type { Expense, Group, Person } from './types'

/** Helpers para los tests: ids fijos y predecibles. */

export function people(...names: string[]): Person[] {
  return names.map((name, index) => ({ id: `p${index + 1}`, name }))
}

export function group(names: string[], expenses: Expense[] = []): Group {
  return { id: 'g1', name: 'Grupo', people: people(...names), expenses }
}

export function expense(
  id: string,
  amountCents: number,
  paidBy: string,
  participants: string[],
  createdAt = 1,
  description = `Gasto ${id}`,
): Expense {
  return { id, description, amountCents, paidBy, participants, createdAt }
}
