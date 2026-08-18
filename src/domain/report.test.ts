import { describe, expect, it } from 'vitest'
import { expense, group } from './fixtures'
import { buildReport } from './report'
import type { Group } from './types'

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
        'Taxi: $10.000 · Juan (todos)',
        'Supermercado: $35.000 · Nico (todos)',
        'Cena: $90.000 · Gonzalo (todos)',
      ].join('\n'),
    )
  })

  it('muestra que está todo saldado cuando no hay deudas', () => {
    const g = group(['A', 'B'], [expense('e1', 1000, 'p1', ['p1', 'p2'])])
    const saldado = { ...g, expenses: [...g.expenses, expense('e2', 1000, 'p2', ['p1', 'p2'], 2)] }
    expect(buildReport(saldado)).toContain('*DEUDAS*\nEstá todo saldado.')
  })

  it('aclara entre quiénes se divide cada gasto', () => {
    const g = group(
      ['Gonzalo', 'Nico', 'Juan'],
      [
        expense('e1', 9000, 'p1', ['p1', 'p2', 'p3'], 3, 'Cena'),
        expense('e2', 6000, 'p1', ['p1', 'p2'], 2, 'Taxi'),
        expense('e3', 3000, 'p2', ['p3'], 1, 'Café'),
      ],
    )
    const lines = buildReport(g).split('\n')
    expect(lines).toContain('Cena: $90 · Gonzalo (todos)')
    expect(lines).toContain('Taxi: $60 · Gonzalo (todos menos Juan)')
    expect(lines).toContain('Café: $30 · Nico (solo Juan)')
  })

  it('pone el alias del que cobra, sólo en la línea de la deuda', () => {
    const base = group(['Gonzalo', 'Nico'], [expense('e1', 10000, 'p1', ['p1', 'p2'])])
    const g: Group = {
      ...base,
      people: base.people.map((person) =>
        person.id === 'p1' ? { ...person, alias: 'gonza.mp' } : person,
      ),
    }
    const lines = buildReport(g).split('\n')

    expect(lines).toContain('Nico → Gonzalo: $50 (gonza.mp)')
    // El alias no ensucia el resto del reporte: sólo sirve para transferir.
    expect(lines).toContain('Gonzalo: +$50')
    expect(buildReport(g)).not.toContain('Gonzalo: +$50 (gonza.mp)')
  })

  it('sin alias la línea de la deuda queda igual que siempre', () => {
    const g = group(['Gonzalo', 'Nico'], [expense('e1', 10000, 'p1', ['p1', 'p2'])])
    expect(buildReport(g).split('\n')).toContain('Nico → Gonzalo: $50')
  })

  it('resuelve los estados vacíos', () => {
    const report = buildReport(group([]))
    expect(report).toContain('Sin integrantes.')
    expect(report).toContain('Está todo saldado.')
    expect(report).toContain('Sin gastos.')
  })
})
