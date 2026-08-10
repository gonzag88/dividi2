import { describe, expect, it } from 'vitest'
import { expense, people } from './fixtures'
import { describeParticipants, joinNames } from './participants'

describe('joinNames', () => {
  it('encadena con comas y una y final', () => {
    expect(joinNames(['Ana'])).toBe('Ana')
    expect(joinNames(['Ana', 'Beto'])).toBe('Ana y Beto')
    expect(joinNames(['Ana', 'Beto', 'Caro'])).toBe('Ana, Beto y Caro')
  })

  it('usa "e" antes de un sonido i', () => {
    expect(joinNames(['Ana', 'Inés'])).toBe('Ana e Inés')
    expect(joinNames(['Ana', 'Ignacio'])).toBe('Ana e Ignacio')
    expect(joinNames(['Ana', 'Hilda'])).toBe('Ana e Hilda')
    // "hie" suena "ye", así que sigue siendo "y".
    expect(joinNames(['Ana', 'Hierro'])).toBe('Ana y Hierro')
    expect(joinNames(['Ana', 'Iván'])).toBe('Ana e Iván')
  })
})

describe('describeParticipants', () => {
  const group = people('Gonzalo', 'Nico', 'Juan', 'Ana')

  it('dice "todos" cuando participan todos', () => {
    expect(describeParticipants(expense('e', 100, 'p1', ['p1', 'p2', 'p3', 'p4']), group)).toBe(
      'todos',
    )
  })

  it('nombra a los participantes cuando son pocos', () => {
    expect(describeParticipants(expense('e', 100, 'p1', ['p2']), group)).toBe('solo Nico')
    expect(describeParticipants(expense('e', 100, 'p1', ['p1', 'p2']), group)).toBe(
      'solo Gonzalo y Nico',
    )
  })

  it('nombra a los excluidos cuando son menos', () => {
    expect(describeParticipants(expense('e', 100, 'p1', ['p1', 'p2', 'p3']), group)).toBe(
      'todos menos Ana',
    )
  })

  it('empatados, prefiere listar a los que participan', () => {
    const trio = people('Gonzalo', 'Nico', 'Juan', 'Ana', 'Inés', 'Beto')
    expect(
      describeParticipants(expense('e', 100, 'p1', ['p1', 'p2', 'p3']), trio),
    ).toBe('solo Gonzalo, Nico y Juan')
  })

  it('sigue el orden de alta del grupo, no el del gasto', () => {
    expect(describeParticipants(expense('e', 100, 'p1', ['p3', 'p1']), group)).toBe(
      'solo Gonzalo y Juan',
    )
  })

  it('ignora participantes que ya no están en el grupo', () => {
    expect(describeParticipants(expense('e', 100, 'p1', ['p1', 'fantasma']), group)).toBe(
      'solo Gonzalo',
    )
  })
})
