import { describe, expect, it } from 'vitest'
import { computeBalances } from './balances'
import { simplifyDebts } from './debts'
import { expense, group } from './fixtures'
import type { Balance } from './balances'

const balances = (entries: Array<[string, number]>): Balance[] =>
  entries.map(([name, cents], index) => ({ personId: `p${index + 1}`, name, cents }))

const asText = (transfers: ReturnType<typeof simplifyDebts>) =>
  transfers.map((transfer) => `${transfer.fromName}→${transfer.toName}:${transfer.cents}`)

describe('simplifyDebts', () => {
  it('una sola persona recibe', () => {
    const result = simplifyDebts(
      balances([
        ['Gonzalo', 4_500_000],
        ['Nico', -2_500_000],
        ['Juan', -2_000_000],
      ]),
    )
    expect(asText(result)).toEqual(['Nico→Gonzalo:2500000', 'Juan→Gonzalo:2000000'])
  })

  it('varias personas reciben', () => {
    const result = simplifyDebts(
      balances([
        ['A', 3000],
        ['B', 2000],
        ['C', -5000],
      ]),
    )
    expect(asText(result)).toEqual(['C→A:3000', 'C→B:2000'])
  })

  it('varias personas deben y varias reciben', () => {
    const result = simplifyDebts(
      balances([
        ['A', 5000],
        ['B', 3000],
        ['C', -6000],
        ['D', -2000],
      ]),
    )
    expect(asText(result)).toEqual(['C→A:5000', 'C→B:1000', 'D→B:2000'])
  })

  it('evita transferencias intermedias innecesarias', () => {
    // A le debe a B y B le debe a C exactamente lo mismo: alcanza con A → C.
    const g = group(
      ['A', 'B', 'C'],
      [
        expense('e1', 3000, 'p2', ['p1', 'p2'], 1),
        expense('e2', 3000, 'p3', ['p2', 'p3'], 2),
      ],
    )
    const result = simplifyDebts(computeBalances(g))
    expect(asText(result)).toEqual(['A→C:1500'])
  })

  it('produce como mucho n-1 transferencias', () => {
    const result = simplifyDebts(
      balances([
        ['A', 1000],
        ['B', 1000],
        ['C', 1000],
        ['D', -1500],
        ['E', -1500],
      ]),
    )
    expect(result.length).toBeLessThanOrEqual(4)
  })

  it('un gasto cargado a una sola persona genera una sola transferencia', () => {
    const g = group(['Juan', 'María'], [expense('e1', 10000, 'p1', ['p2'])])
    expect(asText(simplifyDebts(computeBalances(g)))).toEqual(['María→Juan:10000'])
  })

  it('grupo completamente saldado', () => {
    expect(
      simplifyDebts(
        balances([
          ['A', 0],
          ['B', 0],
        ]),
      ),
    ).toEqual([])
  })

  it('las transferencias son consistentes con los balances', () => {
    const source = balances([
      ['A', 3334],
      ['B', -1111],
      ['C', -1111],
      ['D', -1112],
    ])
    const net = new Map(source.map((balance) => [balance.personId, 0]))
    for (const transfer of simplifyDebts(source)) {
      net.set(transfer.fromId, (net.get(transfer.fromId) ?? 0) + transfer.cents)
      net.set(transfer.toId, (net.get(transfer.toId) ?? 0) - transfer.cents)
    }
    // Después de pagar, todos quedan en cero.
    for (const balance of source) {
      expect(balance.cents + (net.get(balance.personId) ?? 0)).toBe(0)
    }
  })

  it('nunca genera transferencias de importe cero', () => {
    const result = simplifyDebts(
      balances([
        ['A', 1000],
        ['B', 0],
        ['C', -1000],
      ]),
    )
    expect(result.every((transfer) => transfer.cents > 0)).toBe(true)
    expect(result).toHaveLength(1)
  })
})
