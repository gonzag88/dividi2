import { computeBalances, isSettled } from './balances'
import { simplifyDebts } from './debts'
import { formatCents, formatSignedCents } from './money'
import { findPerson, personName, sortedExpenses } from './mutations'
import { describeParticipants } from './participants'
import type { Group } from './types'

/**
 * Texto plano para copiar y pegar en WhatsApp o Telegram.
 * Usa *negrita* al estilo WhatsApp. No es un export de datos ni un backup.
 */
export function buildReport(group: Group): string {
  const balances = computeBalances(group)
  const debts = simplifyDebts(balances)
  const expenses = sortedExpenses(group)

  const lines: string[] = [`*${group.name.toUpperCase()}*`, '']

  lines.push('*BALANCES*')
  if (balances.length === 0) {
    lines.push('Sin integrantes.')
  } else {
    for (const balance of balances) {
      lines.push(`${balance.name}: ${formatSignedCents(balance.cents)}`)
    }
  }
  lines.push('')

  lines.push('*DEUDAS*')
  if (isSettled(balances) || debts.length === 0) {
    lines.push('Está todo saldado.')
  } else {
    for (const debt of debts) {
      // El alias va junto al que cobra: es la única línea donde hace falta
      // saber a dónde transferir. Si no lo tiene cargado, no se nota.
      const alias = findPerson(group, debt.toId)?.alias
      lines.push(
        `${debt.fromName} → ${debt.toName}: ${formatCents(debt.cents)}${alias ? ` (${alias})` : ''}`,
      )
    }
  }
  lines.push('')

  lines.push('*GASTOS*')
  if (expenses.length === 0) {
    lines.push('Sin gastos.')
  } else {
    for (const expense of expenses) {
      lines.push(
        `${expense.description}: ${formatCents(expense.amountCents)} · ${personName(
          group,
          expense.paidBy,
        )} (${describeParticipants(expense, group.people)})`,
      )
    }
  }

  return lines.join('\n')
}
