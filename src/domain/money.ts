/**
 * Todos los importes se manejan internamente como centavos enteros.
 * Nunca se hacen operaciones aritméticas sobre floating point.
 */

const integerFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  useGrouping: true,
})

/**
 * Formatea centavos con formato argentino: $10.000 / $10.500,50 / -$25.000.
 * Los centavos en cero no se muestran.
 */
export function formatCents(cents: number): string {
  const negative = cents < 0
  const abs = Math.abs(cents)
  const units = Math.trunc(abs / 100)
  const rest = abs % 100
  // Se arma a mano para no pasar nunca por floating point.
  const body =
    rest === 0
      ? integerFormatter.format(units)
      : `${integerFormatter.format(units)},${String(rest).padStart(2, '0')}`
  return `${negative ? '-' : ''}$${body}`
}

/** Igual que formatCents pero con signo explícito para balances: +$45.000 / -$25.000 / $0. */
export function formatSignedCents(cents: number): string {
  if (cents === 0) return '$0'
  return cents > 0 ? `+${formatCents(cents)}` : formatCents(cents)
}

export type ParseResult =
  | { ok: true; cents: number }
  | { ok: false; error: string }

const THOUSANDS_GROUPED = /^\d{1,3}(\.\d{3})+$/
const CANONICAL = /^(\d+)(?:\.(\d{1,2}))?$/

/**
 * Interpreta lo que el usuario escribe en el campo de monto.
 *
 * Reglas (formato argentino, tolerante con el teclado numérico de iOS):
 * - "10.500,50" -> el punto es separador de miles y la coma decimal.
 * - "10500,5"   -> la coma es separador decimal.
 * - "10.500"    -> agrupación de miles, o sea 10500.
 * - "10.5"      -> el punto es separador decimal (no es agrupación válida).
 */
export function parseAmountToCents(raw: string): ParseResult {
  const input = raw.trim().replace(/\s/g, '')
  if (input === '') return { ok: false, error: 'Ingresá un monto.' }
  if (input.startsWith('-')) return { ok: false, error: 'El monto debe ser mayor que $0.' }

  let normalized: string
  if (input.includes(',')) {
    normalized = input.replace(/\./g, '').replace(',', '.')
  } else if (THOUSANDS_GROUPED.test(input)) {
    normalized = input.replace(/\./g, '')
  } else {
    normalized = input
  }

  const decimals = normalized.split('.')[1]
  if (decimals !== undefined && decimals.length > 2 && /^\d+$/.test(decimals)) {
    return { ok: false, error: 'El monto puede tener como máximo 2 decimales.' }
  }

  const match = CANONICAL.exec(normalized)
  if (!match) return { ok: false, error: 'El monto no es válido.' }

  const units = Number(match[1])
  const centsPart = (match[2] ?? '').padEnd(2, '0')
  const cents = units * 100 + Number(centsPart)

  if (!Number.isSafeInteger(cents)) return { ok: false, error: 'El monto es demasiado grande.' }
  if (cents <= 0) return { ok: false, error: 'El monto debe ser mayor que $0.' }

  return { ok: true, cents }
}

/** Convierte centavos al texto editable del formulario: 1050050 -> "10500,50". */
export function centsToInput(cents: number): string {
  const abs = Math.abs(cents)
  const units = Math.trunc(abs / 100)
  const rest = abs % 100
  return rest === 0 ? String(units) : `${units},${String(rest).padStart(2, '0')}`
}
