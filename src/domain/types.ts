export interface Person {
  id: string
  name: string
  /**
   * Alias bancario, copiado de la agenda en el momento de sumar a la persona
   * al grupo. Sólo se usa para mostrarlo en el reporte: no interviene en
   * ningún cálculo. Como es una copia, editarlo en la agenda no cambia los
   * grupos que ya existen.
   */
  alias?: string
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
