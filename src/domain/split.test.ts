import { describe, expect, it } from 'vitest'
import { expenseShares, splitEqually } from './split'
import { expense, people } from './fixtures'

describe('splitEqually', () => {
  it('divide exactamente cuando no hay resto', () => {
    expect(splitEqually(10000, 4)).toEqual([2500, 2500, 2500, 2500])
  })

  it('divide con decimales exactos', () => {
    expect(splitEqually(1050, 2)).toEqual([525, 525])
  })

  it('reparte el centavo sobrante entre los primeros participantes', () => {
    // $100 / 3 -> 33,34 / 33,33 / 33,33
    expect(splitEqually(10000, 3)).toEqual([3334, 3333, 3333])
  })

  it('reparte más de un centavo sobrante', () => {
    // $10,01 / 4 -> 2,51 / 2,50 / 2,50 / 2,50
    expect(splitEqually(1001, 4)).toEqual([251, 250, 250, 250])
  })

  it('las partes siempre suman exactamente el total', () => {
    for (let total = 1; total <= 400; total += 1) {
      for (let n = 1; n <= 9; n += 1) {
        const parts = splitEqually(total, n)
        expect(parts).toHaveLength(n)
        expect(parts.reduce((sum, part) => sum + part, 0)).toBe(total)
        // Ninguna parte difiere de otra en más de un centavo.
        expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(1)
      }
    }
  })

  it('un solo participante se lleva el total', () => {
    expect(splitEqually(9999, 1)).toEqual([9999])
  })
})

describe('expenseShares', () => {
  const group = people('Gonzalo', 'Nico', 'Juan')

  it('reparte sólo entre los participantes del gasto', () => {
    const shares = expenseShares(expense('e1', 9000, 'p1', ['p1', 'p2']), group)
    expect([...shares.entries()]).toEqual([
      ['p1', 4500],
      ['p2', 4500],
    ])
  })

  it('el sobrante sigue el orden de alta del grupo, no el del array de participantes', () => {
    const a = expenseShares(expense('e1', 10000, 'p1', ['p1', 'p2', 'p3']), group)
    const b = expenseShares(expense('e2', 10000, 'p1', ['p3', 'p2', 'p1']), group)
    expect([...a.entries()]).toEqual([...b.entries()])
    expect(a.get('p1')).toBe(3334)
    expect(a.get('p2')).toBe(3333)
    expect(a.get('p3')).toBe(3333)
  })

  it('ignora participantes que ya no están en el grupo', () => {
    const shares = expenseShares(expense('e1', 1000, 'p1', ['p1', 'p2', 'borrado']), group)
    expect(shares.size).toBe(2)
    expect([...shares.values()].reduce((sum, value) => sum + value, 0)).toBe(1000)
  })
})
