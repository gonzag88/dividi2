import { newId } from './ids'
import type { Expense, ExpenseInput, Group, Person } from './types'

/**
 * Funciones puras sobre un grupo. Devuelven siempre un grupo nuevo; la capa de
 * persistencia sólo se encarga de guardarlo. Toda la lógica que hay que testear
 * vive acá, sin depender de IndexedDB.
 */

export function createGroup(name: string): Group {
  return { id: newId(), name: name.trim(), people: [], expenses: [] }
}

/**
 * El alias llega copiado de la agenda, si la persona tenía uno cargado en ese
 * momento. Queda congelado dentro del grupo: es un dato del grupo, no un
 * puntero a la agenda.
 */
export function addPerson(group: Group, name: string, alias?: string): Group {
  const person: Person = { id: newId(), name: name.trim() }
  if (alias) person.alias = alias
  return { ...group, people: [...group.people, person] }
}

/** Gastos que se van a borrar si se elimina esta persona (pagados por ella o con ella como participante). */
export function expensesTouchingPerson(group: Group, personId: string): Expense[] {
  return group.expenses.filter(
    (expense) => expense.paidBy === personId || expense.participants.includes(personId),
  )
}

/**
 * Elimina una persona y, en cascada, todos los gastos en los que aparece.
 * Los gastos no se modifican para intentar conservarlos: se borran.
 */
export function removePerson(group: Group, personId: string): Group {
  return {
    ...group,
    people: group.people.filter((person) => person.id !== personId),
    expenses: group.expenses.filter(
      (expense) => expense.paidBy !== personId && !expense.participants.includes(personId),
    ),
  }
}

/** createdAt estrictamente creciente, para que el orden no dependa de la resolución del reloj. */
function nextCreatedAt(group: Group, now: number): number {
  const last = group.expenses.reduce((max, expense) => Math.max(max, expense.createdAt), 0)
  return Math.max(now, last + 1)
}

export function addExpense(group: Group, input: ExpenseInput, now: number = Date.now()): Group {
  const expense: Expense = { id: newId(), ...input, createdAt: nextCreatedAt(group, now) }
  return { ...group, expenses: [...group.expenses, expense] }
}

/** Edita un gasto conservando su id y su createdAt (no cambia de lugar en la lista). */
export function updateExpense(group: Group, expenseId: string, input: ExpenseInput): Group {
  return {
    ...group,
    expenses: group.expenses.map((expense) =>
      expense.id === expenseId ? { ...expense, ...input } : expense,
    ),
  }
}

export function removeExpense(group: Group, expenseId: string): Group {
  return { ...group, expenses: group.expenses.filter((expense) => expense.id !== expenseId) }
}

/** Gastos ordenados de más reciente a más antiguo. */
export function sortedExpenses(group: Group): Expense[] {
  return [...group.expenses].sort((a, b) => b.createdAt - a.createdAt)
}

export function findPerson(group: Group, personId: string): Person | undefined {
  return group.people.find((person) => person.id === personId)
}

export function personName(group: Group, personId: string): string {
  return findPerson(group, personId)?.name ?? '—'
}

/** Suma de todos los gastos del grupo, en centavos. */
export function groupTotalCents(group: Group): number {
  return group.expenses.reduce((total, expense) => total + expense.amountCents, 0)
}

/** Hacen falta al menos 2 integrantes para poder cargar un gasto. */
export function canAddExpenses(group: Group): boolean {
  return group.people.length >= 2
}
