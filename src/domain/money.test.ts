import { describe, expect, it } from 'vitest'
import { centsToInput, formatCents, formatSignedCents, parseAmountToCents } from './money'

describe('formatCents', () => {
  it('usa formato argentino y oculta los centavos en cero', () => {
    expect(formatCents(1_000_000)).toBe('$10.000')
    expect(formatCents(1_050_050)).toBe('$10.500,50')
    expect(formatCents(50)).toBe('$0,50')
    expect(formatCents(5)).toBe('$0,05')
    expect(formatCents(0)).toBe('$0')
  })

  it('pone el signo antes del símbolo', () => {
    expect(formatCents(-2_500_000)).toBe('-$25.000')
    expect(formatCents(-1)).toBe('-$0,01')
  })

  it('no pierde precisión con importes grandes', () => {
    expect(formatCents(123_456_789_01)).toBe('$123.456.789,01')
  })
})

describe('formatSignedCents', () => {
  it('marca explícitamente los balances a favor', () => {
    expect(formatSignedCents(4_500_000)).toBe('+$45.000')
    expect(formatSignedCents(-2_500_000)).toBe('-$25.000')
    expect(formatSignedCents(0)).toBe('$0')
  })
})

describe('parseAmountToCents', () => {
  const cents = (input: string) => {
    const result = parseAmountToCents(input)
    return result.ok ? result.cents : result.error
  }

  it('acepta enteros', () => {
    expect(cents('100')).toBe(10000)
  })

  it('acepta coma como separador decimal', () => {
    expect(cents('10500,50')).toBe(1_050_050)
    expect(cents('10,5')).toBe(1050)
  })

  it('acepta punto como separador decimal', () => {
    expect(cents('10.5')).toBe(1050)
    expect(cents('10.50')).toBe(1050)
  })

  it('interpreta el punto como separador de miles cuando agrupa de a tres', () => {
    expect(cents('10.500')).toBe(1_050_000)
    expect(cents('1.234.567')).toBe(123_456_700)
  })

  it('acepta el formato argentino completo', () => {
    expect(cents('10.500,50')).toBe(1_050_050)
  })

  it('ignora espacios', () => {
    expect(cents(' 100 ')).toBe(10000)
  })

  it('rechaza el vacío', () => {
    expect(cents('')).toBe('Ingresá un monto.')
    expect(cents('   ')).toBe('Ingresá un monto.')
  })

  it('rechaza cero y negativos', () => {
    expect(cents('0')).toBe('El monto debe ser mayor que $0.')
    expect(cents('0,00')).toBe('El monto debe ser mayor que $0.')
    expect(cents('-5')).toBe('El monto debe ser mayor que $0.')
  })

  it('rechaza más de 2 decimales', () => {
    expect(cents('10,999')).toBe('El monto puede tener como máximo 2 decimales.')
    expect(cents('10.999')).toBe(1_099_900) // agrupación de miles, no decimales
    expect(cents('1,2345')).toBe('El monto puede tener como máximo 2 decimales.')
  })

  it('rechaza texto', () => {
    expect(cents('abc')).toBe('El monto no es válido.')
    expect(cents('10$')).toBe('El monto no es válido.')
    expect(cents('1,,2')).toBe('El monto no es válido.')
  })
})

describe('centsToInput', () => {
  it('vuelve al texto editable', () => {
    expect(centsToInput(1_050_050)).toBe('10500,50')
    expect(centsToInput(1_000_000)).toBe('10000')
    expect(centsToInput(5)).toBe('0,05')
  })
})
