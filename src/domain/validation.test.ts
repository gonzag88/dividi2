import { describe, expect, it } from 'vitest'
import { createPerson } from './directory'
import { group } from './fixtures'
import {
  validateExpense,
  validateGroupName,
  validatePersonName,
  validateSavedPerson,
} from './validation'

const g = group(['Gonzalo', 'Nico', 'Juan'])

const valid = {
  description: 'Cena',
  amount: '10.500,50',
  paidBy: 'p1',
  participants: ['p1', 'p2'],
}

describe('validateGroupName', () => {
  it('rechaza el nombre vacío', () => {
    expect(validateGroupName('')).toBe('Ingresá un nombre para el grupo.')
    expect(validateGroupName('   ')).toBe('Ingresá un nombre para el grupo.')
  })

  it('acepta un nombre con contenido', () => {
    expect(validateGroupName('Viaje')).toBeNull()
  })
})

describe('validatePersonName', () => {
  it('rechaza el nombre vacío', () => {
    expect(validatePersonName('  ')).toBe('Ingresá un nombre.')
  })

  it('acepta nombres repetidos', () => {
    expect(validatePersonName('Gonzalo')).toBeNull()
  })
})

describe('validateExpense', () => {
  it('acepta un gasto válido y normaliza los datos', () => {
    const result = validateExpense({ ...valid, description: '  Cena  ' }, g)
    expect(result).toEqual({
      ok: true,
      input: {
        description: 'Cena',
        amountCents: 1_050_050,
        paidBy: 'p1',
        participants: ['p1', 'p2'],
      },
    })
  })

  it('ordena los participantes según el orden de alta del grupo', () => {
    const result = validateExpense({ ...valid, participants: ['p3', 'p1'] }, g)
    expect(result.ok && result.input.participants).toEqual(['p1', 'p3'])
  })

  it('rechaza la descripción vacía', () => {
    const result = validateExpense({ ...valid, description: '   ' }, g)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.description).toBe('Ingresá una descripción.')
  })

  it('rechaza el monto vacío', () => {
    const result = validateExpense({ ...valid, amount: '' }, g)
    expect(!result.ok && result.errors.amount).toBe('Ingresá un monto.')
  })

  it('rechaza el monto en cero o negativo', () => {
    expect(
      (() => {
        const result = validateExpense({ ...valid, amount: '0' }, g)
        return !result.ok && result.errors.amount
      })(),
    ).toBe('El monto debe ser mayor que $0.')
  })

  it('rechaza más de 2 decimales', () => {
    const result = validateExpense({ ...valid, amount: '10,555' }, g)
    expect(!result.ok && result.errors.amount).toBe('El monto puede tener como máximo 2 decimales.')
  })

  it('rechaza una persona pagadora inexistente', () => {
    const result = validateExpense({ ...valid, paidBy: 'fantasma' }, g)
    expect(!result.ok && result.errors.paidBy).toBe('La persona que pagó ya no existe en el grupo.')
  })

  it('rechaza que no se haya elegido quién pagó', () => {
    const result = validateExpense({ ...valid, paidBy: '' }, g)
    expect(!result.ok && result.errors.paidBy).toBe('Elegí quién pagó.')
  })

  it('acepta un gasto dividido entre una sola persona', () => {
    // Paga Juan (p3) y le corresponde entero a Nico (p2).
    const result = validateExpense({ ...valid, paidBy: 'p3', participants: ['p2'] }, g)
    expect(result.ok && result.input.participants).toEqual(['p2'])
  })

  it('acepta que quien pagó sea el único participante', () => {
    const result = validateExpense({ ...valid, paidBy: 'p1', participants: ['p1'] }, g)
    expect(result.ok).toBe(true)
  })

  it('rechaza que no haya ningún participante', () => {
    const result = validateExpense({ ...valid, participants: [] }, g)
    expect(!result.ok && result.errors.participants).toBe(
      'Elegí entre quiénes se divide el gasto.',
    )
  })

  it('rechaza participantes inexistentes', () => {
    const result = validateExpense({ ...valid, participants: ['p1', 'fantasma'] }, g)
    expect(!result.ok && result.errors.participants).toBe(
      'Hay participantes que ya no existen en el grupo.',
    )
  })

  it('junta todos los errores de una vez', () => {
    const result = validateExpense(
      { description: '', amount: '', paidBy: '', participants: [] },
      g,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        'amount',
        'description',
        'paidBy',
        'participants',
      ])
    }
  })
})

describe('validateSavedPerson', () => {
  const agenda = createPerson(createPerson([], 'Ana', 'ana.mp', 1).directory, 'Beto', '', 2)
  const ana = agenda.directory[0]

  it('acepta un nombre nuevo con alias y los normaliza', () => {
    const result = validateSavedPerson({ name: '  Caro ', alias: ' caro.cbu ' }, agenda.directory, null)
    expect(result).toEqual({ ok: true, name: 'Caro', alias: 'caro.cbu' })
  })

  it('el alias es opcional', () => {
    const result = validateSavedPerson({ name: 'Caro', alias: '' }, agenda.directory, null)
    expect(result).toEqual({ ok: true, name: 'Caro', alias: '' })
  })

  it('exige un nombre', () => {
    const result = validateSavedPerson({ name: '   ', alias: '' }, agenda.directory, null)
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.errors.name).toBe('Ingresá un nombre.')
  })

  it('rechaza un nombre que ya está en la agenda, sin importar cómo se escriba', () => {
    const result = validateSavedPerson({ name: '  ana ', alias: '' }, agenda.directory, null)
    expect(result.ok === false && result.errors.name).toBe('Ya hay alguien con ese nombre.')
  })

  it('editar a alguien sin cambiarle el nombre no choca consigo mismo', () => {
    const result = validateSavedPerson({ name: 'Ana', alias: 'otro.mp' }, agenda.directory, ana.id)
    expect(result).toEqual({ ok: true, name: 'Ana', alias: 'otro.mp' })
  })

  it('rechaza un alias largo', () => {
    const result = validateSavedPerson({ name: 'Caro', alias: 'x'.repeat(41) }, agenda.directory, null)
    expect(result.ok === false && result.errors.alias).toContain('40')
  })
})
