import { describe, expect, it } from 'vitest'
import { computeBalances, isSettled } from './balances'
import { expense, group } from './fixtures'
import { addExpense, removeExpense, removePerson, updateExpense } from './mutations'

const cents = (balances: ReturnType<typeof computeBalances>) =>
  Object.fromEntries(balances.map((balance) => [balance.name, balance.cents]))

describe('computeBalances', () => {
  it('una persona paga por todos', () => {
    const g = group(
      ['Gonzalo', 'Nico', 'Juan', 'Ana'],
      [expense('e1', 10_000_000, 'p1', ['p1', 'p2', 'p3', 'p4'])],
    )
    expect(cents(computeBalances(g))).toEqual({
      Gonzalo: 7_500_000,
      Nico: -2_500_000,
      Juan: -2_500_000,
      Ana: -2_500_000,
    })
  })

  it('varias personas pagan y hay varios gastos', () => {
    const g = group(
      ['Gonzalo', 'Nico', 'Juan'],
      [
        expense('e1', 9_000_000, 'p1', ['p1', 'p2', 'p3'], 1),
        expense('e2', 3_500_000, 'p2', ['p1', 'p2', 'p3'], 2),
        expense('e3', 1_000_000, 'p3', ['p1', 'p2', 'p3'], 3),
      ],
    )
    // Total $135.000, o sea $45.000 por cabeza.
    // El redondeo se resuelve gasto por gasto (es la única forma de que cada
    // gasto sume exacto), así que aparece un centavo de diferencia contra la
    // cuenta hecha sobre el total: $35.000/3 y $10.000/3 no son exactos.
    expect(cents(computeBalances(g))).toEqual({
      Gonzalo: 4_499_999,
      Nico: -1_000_000,
      Juan: -3_499_999,
    })
  })

  it('el centavo de redondeo siempre lo absorbe alguien, pero el total cierra', () => {
    const g = group(
      ['Gonzalo', 'Nico', 'Juan'],
      [expense('e1', 1_000_000, 'p1', ['p1', 'p2', 'p3'])],
    )
    const result = computeBalances(g)
    // $10.000/3 = 3333,33 y sobra un centavo, que carga el primer participante.
    expect(cents(result)).toEqual({ Gonzalo: 666_666, Nico: -333_333, Juan: -333_333 })
    expect(result.reduce((sum, balance) => sum + balance.cents, 0)).toBe(0)
  })

  it('gastos con distintos participantes', () => {
    const g = group(
      ['Gonzalo', 'Nico', 'Juan'],
      [
        expense('e1', 10000, 'p1', ['p1', 'p2'], 1),
        expense('e2', 6000, 'p3', ['p2', 'p3'], 2),
      ],
    )
    expect(cents(computeBalances(g))).toEqual({
      Gonzalo: 5000,
      Nico: -8000,
      Juan: 3000,
    })
  })

  it('un gasto dividido entre una sola persona se le carga entero', () => {
    // Paga Juan y le corresponde entero a María.
    const g = group(['Juan', 'María'], [expense('e1', 10000, 'p1', ['p2'])])
    expect(cents(computeBalances(g))).toEqual({ Juan: 10000, María: -10000 })
  })

  it('un gasto donde quien paga es el único participante no mueve ningún balance', () => {
    const g = group(['Juan', 'María'], [expense('e1', 10000, 'p1', ['p1'])])
    expect(cents(computeBalances(g))).toEqual({ Juan: 0, María: 0 })
  })

  it('una persona que no participa de ningún gasto queda saldada', () => {
    const g = group(['Gonzalo', 'Nico', 'Juan'], [expense('e1', 10000, 'p1', ['p1', 'p2'])])
    expect(cents(computeBalances(g)).Juan).toBe(0)
  })

  it('la suma de los balances es siempre exactamente cero, incluso con redondeo', () => {
    const g = group(
      ['A', 'B', 'C'],
      [
        expense('e1', 10000, 'p1', ['p1', 'p2', 'p3'], 1),
        expense('e2', 1, 'p2', ['p1', 'p2', 'p3'], 2),
        expense('e3', 3337, 'p3', ['p2', 'p3'], 3),
      ],
    )
    const total = computeBalances(g).reduce((sum, balance) => sum + balance.cents, 0)
    expect(total).toBe(0)
  })

  it('un grupo sin gastos está saldado', () => {
    expect(isSettled(computeBalances(group(['A', 'B'])))).toBe(true)
  })

  it('se recalcula al editar un gasto', () => {
    let g = group(['Gonzalo', 'Nico'], [expense('e1', 10000, 'p1', ['p1', 'p2'])])
    expect(cents(computeBalances(g))).toEqual({ Gonzalo: 5000, Nico: -5000 })

    g = updateExpense(g, 'e1', {
      description: 'Cena',
      amountCents: 20000,
      paidBy: 'p2',
      participants: ['p1', 'p2'],
    })
    expect(cents(computeBalances(g))).toEqual({ Gonzalo: -10000, Nico: 10000 })
  })

  it('se recalcula al eliminar un gasto', () => {
    let g = group(
      ['Gonzalo', 'Nico'],
      [expense('e1', 10000, 'p1', ['p1', 'p2'], 1), expense('e2', 4000, 'p2', ['p1', 'p2'], 2)],
    )
    g = removeExpense(g, 'e1')
    expect(cents(computeBalances(g))).toEqual({ Gonzalo: -2000, Nico: 2000 })
  })

  it('al eliminar una persona se borran sus gastos y el resto queda consistente', () => {
    let g = group(
      ['Gonzalo', 'Nico', 'Juan'],
      [
        // Pagado por Nico: se borra.
        expense('e1', 9000, 'p2', ['p1', 'p2', 'p3'], 1),
        // Nico participa: se borra.
        expense('e2', 6000, 'p1', ['p1', 'p2'], 2),
        // Nico no aparece: sobrevive.
        expense('e3', 4000, 'p1', ['p1', 'p3'], 3),
      ],
    )
    g = removePerson(g, 'p2')

    expect(g.people.map((person) => person.name)).toEqual(['Gonzalo', 'Juan'])
    expect(g.expenses.map((item) => item.id)).toEqual(['e3'])
    expect(cents(computeBalances(g))).toEqual({ Gonzalo: 2000, Juan: -2000 })
  })

  it('agregar una persona nueva no cambia los gastos ya cargados', () => {
    let g = group(['Gonzalo', 'Nico'], [expense('e1', 10000, 'p1', ['p1', 'p2'])])
    g = { ...g, people: [...g.people, { id: 'p3', name: 'Juan' }] }
    expect(cents(computeBalances(g))).toEqual({ Gonzalo: 5000, Nico: -5000, Juan: 0 })
  })

  it('los gastos nuevos quedan ordenados de más reciente a más antiguo', () => {
    let g = group(['A', 'B'])
    const input = { description: 'x', amountCents: 100, paidBy: 'p1', participants: ['p1', 'p2'] }
    g = addExpense(g, { ...input, description: 'primero' }, 1000)
    // Mismo timestamp: el createdAt igual tiene que ser estrictamente creciente.
    g = addExpense(g, { ...input, description: 'segundo' }, 1000)
    const [a, b] = g.expenses
    expect(b.createdAt).toBeGreaterThan(a.createdAt)
  })
})
