import { describe, expect, it } from 'vitest'
import { expense, group } from './fixtures'
import { buildReport } from './report'

describe('buildReport', () => {
  it('arma el texto para pegar en WhatsApp', () => {
    const g = {
      ...group(
        ['Gonzalo', 'Nico', 'Juan'],
        [
          expense('e1', 9_000_000, 'p1', ['p1', 'p2', 'p3'], 1, 'Cena'),
          expense('e2', 3_500_000, 'p2', ['p1', 'p2', 'p3'], 2, 'Supermercado'),
          expense('e3', 1_000_000, 'p3', ['p1', 'p2', 'p3'], 3, 'Taxi'),
        ],
      ),
      name: 'Viaje a Brasil',
    }

    // Los centavos sueltos salen del redondeo por gasto: $35.000 y $10.000 no
    // se dividen exacto entre 3, y cada gasto tiene que sumar su total exacto.
    expect(buildReport(g)).toBe(
      [
        '*VIAJE A BRASIL*',
        '',
        '*BALANCES*',
        'Gonzalo: +$44.999,99',
        'Nico: -$10.000',
        'Juan: -$34.999,99',
        '',
        '*DEUDAS*',
        'Juan → Gonzalo: $34.999,99',
        'Nico → Gonzalo: $10.000',
        '',
        '*GASTOS*',
        'Taxi: $10.000 · Juan',
        'Supermercado: $35.000 · Nico',
        'Cena: $90.000 · Gonzalo',
      ].join('\n'),
    )
  })

  it('muestra que está todo saldado cuando no hay deudas', () => {
    const g = group(['A', 'B'], [expense('e1', 1000, 'p1', ['p1', 'p2'])])
    const saldado = { ...g, expenses: [...g.expenses, expense('e2', 1000, 'p2', ['p1', 'p2'], 2)] }
    expect(buildReport(saldado)).toContain('*DEUDAS*\nEstá todo saldado.')
  })

  it('resuelve los estados vacíos', () => {
    const report = buildReport(group([]))
    expect(report).toContain('Sin integrantes.')
    expect(report).toContain('Está todo saldado.')
    expect(report).toContain('Sin gastos.')
  })
})
