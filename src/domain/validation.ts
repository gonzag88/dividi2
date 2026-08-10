import { parseAmountToCents } from './money'
import type { ExpenseInput, Group } from './types'

export function validateGroupName(raw: string): string | null {
  return raw.trim() === '' ? 'Ingresá un nombre para el grupo.' : null
}

export function validatePersonName(raw: string): string | null {
  return raw.trim() === '' ? 'Ingresá un nombre.' : null
}

export interface RawExpense {
  description: string
  amount: string
  paidBy: string
  participants: string[]
}

export interface ExpenseErrors {
  description?: string
  amount?: string
  paidBy?: string
  participants?: string
}

export type ExpenseValidation =
  | { ok: true; input: ExpenseInput }
  | { ok: false; errors: ExpenseErrors }

/** Valida un gasto contra el grupo al que pertenece. Nunca deja guardar datos inválidos. */
export function validateExpense(raw: RawExpense, group: Group): ExpenseValidation {
  const errors: ExpenseErrors = {}

  const description = raw.description.trim()
  if (description === '') errors.description = 'Ingresá una descripción.'

  const amount = parseAmountToCents(raw.amount)
  let amountCents = 0
  if (amount.ok) {
    amountCents = amount.cents
  } else {
    errors.amount = amount.error
  }

  const ids = new Set(group.people.map((person) => person.id))

  if (raw.paidBy === '') {
    errors.paidBy = 'Elegí quién pagó.'
  } else if (!ids.has(raw.paidBy)) {
    errors.paidBy = 'La persona que pagó ya no existe en el grupo.'
  }

  const participants = raw.participants.filter((id, index) => raw.participants.indexOf(id) === index)
  if (participants.some((id) => !ids.has(id))) {
    errors.participants = 'Hay participantes que ya no existen en el grupo.'
  } else if (participants.length < 2) {
    errors.participants = 'El gasto tiene que dividirse entre al menos 2 personas.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    input: {
      description,
      amountCents,
      paidBy: raw.paidBy,
      // Se guardan en el orden de alta del grupo, para que el reparto del
      // redondeo no dependa del orden en que el usuario tocó los checkboxes.
      participants: group.people
        .filter((person) => participants.includes(person.id))
        .map((person) => person.id),
    },
  }
}
