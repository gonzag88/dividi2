import type { Expense, Person } from './types'

/**
 * Divide un importe en partes iguales entre `n` participantes.
 *
 * El diferencial de redondeo se reparte de a un centavo entre los primeros
 * participantes, de modo que la suma de las partes sea SIEMPRE exactamente
 * igual al total. Ej: 10000 / 3 -> [3334, 3333, 3333].
 */
export function splitEqually(totalCents: number, n: number): number[] {
  if (n <= 0) return []
  const base = Math.floor(totalCents / n)
  const remainder = totalCents - base * n
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0))
}

/**
 * Cuánto le corresponde pagar a cada participante de un gasto.
 *
 * El orden de reparto del centavo sobrante sigue el orden de alta de las
 * personas en el grupo, así el resultado es determinístico y estable.
 */
export function expenseShares(expense: Expense, people: Person[]): Map<string, number> {
  const participants = people
    .filter((person) => expense.participants.includes(person.id))
    .map((person) => person.id)

  const parts = splitEqually(expense.amountCents, participants.length)
  const shares = new Map<string, number>()
  participants.forEach((id, index) => {
    shares.set(id, parts[index])
  })
  return shares
}
