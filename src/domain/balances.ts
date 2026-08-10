import { expenseShares } from './split'
import type { Group } from './types'

export interface Balance {
  personId: string
  name: string
  /** Positivo: le deben plata. Negativo: debe plata. Cero: está saldada. */
  cents: number
}

/**
 * Balance neto de cada persona: total pagado - total que le corresponde pagar.
 *
 * La suma de todos los balances es siempre exactamente cero, porque las partes
 * de cada gasto suman exactamente el total del gasto.
 */
export function computeBalances(group: Group): Balance[] {
  const paid = new Map<string, number>()
  const owed = new Map<string, number>()

  for (const expense of group.expenses) {
    paid.set(expense.paidBy, (paid.get(expense.paidBy) ?? 0) + expense.amountCents)
    for (const [personId, share] of expenseShares(expense, group.people)) {
      owed.set(personId, (owed.get(personId) ?? 0) + share)
    }
  }

  return group.people.map((person) => ({
    personId: person.id,
    name: person.name,
    cents: (paid.get(person.id) ?? 0) - (owed.get(person.id) ?? 0),
  }))
}

export function isSettled(balances: Balance[]): boolean {
  return balances.every((balance) => balance.cents === 0)
}
