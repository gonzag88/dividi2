export interface Person {
  id: string
  name: string
}

export interface Expense {
  id: string
  description: string
  /** Importe total en centavos enteros. Nunca floating point. */
  amountCents: number
  /** id de la persona que pagó. */
  paidBy: string
  /** ids de las personas entre las que se divide (mínimo 1). */
  participants: string[]
  /** Sólo se usa para ordenar de más reciente a más antiguo. */
  createdAt: number
}

export interface Group {
  id: string
  name: string
  people: Person[]
  expenses: Expense[]
}

/** Datos crudos de un gasto tal como salen del formulario. */
export interface ExpenseInput {
  description: string
  amountCents: number
  paidBy: string
  participants: string[]
}
