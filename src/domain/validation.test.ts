import { describe, expect, it } from 'vitest'
import { group } from './fixtures'
import { validateExpense, validateGroupName, validatePersonName } from './validation'

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

  it('rechaza menos de 2 participantes', () => {
    const result = validateExpense({ ...valid, participants: ['p1'] }, g)
    expect(!result.ok && result.errors.participants).toBe(
      'El gasto tiene que dividirse entre al menos 2 personas.',
    )
    const empty = validateExpense({ ...valid, participants: [] }, g)
    expect(empty.ok).toBe(false)
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
