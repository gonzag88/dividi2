import type { Balance } from './balances'

export interface Transfer {
  fromId: string
  fromName: string
  toId: string
  toName: string
  cents: number
}

interface Pending {
  id: string
  name: string
  amount: number
  order: number
}

/**
 * Traduce los balances a las transferencias necesarias para saldar el grupo.
 *
 * Usa una estrategia greedy: el que más debe le paga al que más tiene a favor.
 * No busca el óptimo teórico (es un problema NP-hard), pero produce como mucho
 * n-1 transferencias, que en la práctica es la solución simple que uno haría a
 * mano. El resultado es determinístico: ante empates, gana el orden de alta.
 */
export function simplifyDebts(balances: Balance[]): Transfer[] {
  const byMagnitude = (a: Pending, b: Pending) => b.amount - a.amount || a.order - b.order

  const debtors: Pending[] = balances
    .map((balance, order) => ({ id: balance.personId, name: balance.name, amount: -balance.cents, order }))
    .filter((pending) => pending.amount > 0)
    .sort(byMagnitude)

  const creditors: Pending[] = balances
    .map((balance, order) => ({ id: balance.personId, name: balance.name, amount: balance.cents, order }))
    .filter((pending) => pending.amount > 0)
    .sort(byMagnitude)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)

    if (amount > 0) {
      transfers.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        cents: amount,
      })
    }

    debtor.amount -= amount
    creditor.amount -= amount
    if (debtor.amount === 0) i += 1
    if (creditor.amount === 0) j += 1
  }

  return transfers
}
