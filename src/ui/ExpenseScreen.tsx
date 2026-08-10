import { useState } from 'react'
import { centsToInput } from '../domain/money'
import { addExpense, removeExpense, updateExpense } from '../domain/mutations'
import type { Group } from '../domain/types'
import { validateExpense, type ExpenseErrors } from '../domain/validation'
import type { ConfirmRequest } from './ConfirmDialog'
import { BackButton, Header } from './Header'
import { goBack, paths } from './useRoute'

interface Props {
  group: Group
  expenseId: string | null
  onSave: (group: Group) => void
  onConfirm: (request: ConfirmRequest) => void
}

/**
 * Alta y edición de gastos. Si el usuario sale sin guardar, los cambios se
 * descartan sin preguntar nada.
 */
export function ExpenseScreen({ group, expenseId, onSave, onConfirm }: Props) {
  const existing = expenseId ? group.expenses.find((expense) => expense.id === expenseId) : undefined

  const [description, setDescription] = useState(existing?.description ?? '')
  const [amount, setAmount] = useState(existing ? centsToInput(existing.amountCents) : '')
  const [paidBy, setPaidBy] = useState(existing?.paidBy ?? group.people[0]?.id ?? '')
  // Por defecto participan todos los integrantes.
  const [participants, setParticipants] = useState<string[]>(
    existing ? existing.participants : group.people.map((person) => person.id),
  )
  const [errors, setErrors] = useState<ExpenseErrors>({})

  const back = () => goBack(paths.group(group.id))

  const toggle = (personId: string) => {
    setParticipants((current) =>
      current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId],
    )
    setErrors((current) => ({ ...current, participants: undefined }))
  }

  const allSelected = participants.length === group.people.length
  const toggleAll = () => {
    setParticipants(allSelected ? [] : group.people.map((person) => person.id))
    setErrors((current) => ({ ...current, participants: undefined }))
  }

  const submit = () => {
    const result = validateExpense({ description, amount, paidBy, participants }, group)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    onSave(
      existing
        ? updateExpense(group, existing.id, result.input)
        : addExpense(group, result.input),
    )
    back()
  }

  const confirmDelete = () => {
    if (!existing) return
    onConfirm({
      title: `Eliminar "${existing.description}"`,
      message: 'Se va a eliminar el gasto y se van a recalcular los balances. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar gasto',
      onConfirm: () => {
        onSave(removeExpense(group, existing.id))
        back()
      },
    })
  }

  return (
    <>
      <Header
        title={existing ? 'Editar gasto' : 'Nuevo gasto'}
        left={<BackButton label="Cancelar" onClick={back} />}
      />

      <main className="content">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="field">
            <label>
              <span className="field-label">Descripción</span>
              <input
                className="input"
                value={description}
                placeholder="Cena"
                autoFocus={!existing}
                onChange={(event) => {
                  setDescription(event.target.value)
                  setErrors((current) => ({ ...current, description: undefined }))
                }}
              />
            </label>
            {errors.description && <p className="error">{errors.description}</p>}
          </div>

          <div className="field">
            <label>
              <span className="field-label">Monto</span>
              <input
                className="input"
                value={amount}
                placeholder="0"
                inputMode="decimal"
                autoComplete="off"
                onChange={(event) => {
                  setAmount(event.target.value)
                  setErrors((current) => ({ ...current, amount: undefined }))
                }}
              />
            </label>
            {errors.amount && <p className="error">{errors.amount}</p>}
          </div>

          <div className="field">
            <span className="field-label">Quién pagó</span>
            <div className="card" role="radiogroup" aria-label="Quién pagó">
              {group.people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="check-row"
                  role="radio"
                  aria-checked={paidBy === person.id}
                  onClick={() => {
                    setPaidBy(person.id)
                    setErrors((current) => ({ ...current, paidBy: undefined }))
                  }}
                >
                  <span className="check-box">✓</span>
                  <span className="row-main">
                    <span className="row-title">{person.name}</span>
                  </span>
                </button>
              ))}
            </div>
            {errors.paidBy && <p className="error">{errors.paidBy}</p>}
          </div>

          <div className="field">
            <div className="section-head">
              <span className="field-label">Dividido entre</span>
              <button type="button" className="btn-link small" onClick={toggleAll}>
                {allSelected ? 'Destildar todos' : 'Tildar todos'}
              </button>
            </div>
            <div className="card" role="group" aria-label="Dividido entre">
              {group.people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="check-row"
                  role="checkbox"
                  aria-checked={participants.includes(person.id)}
                  onClick={() => toggle(person.id)}
                >
                  <span className="check-box square">✓</span>
                  <span className="row-main">
                    <span className="row-title">{person.name}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="row-sub" style={{ marginTop: 6 }}>
              {participants.length === 1
                ? `Le corresponde entero a ${
                    group.people.find((person) => person.id === participants[0])?.name ?? '—'
                  }.`
                : `Se divide en partes iguales entre ${participants.length} personas.`}
            </p>
            {errors.participants && <p className="error">{errors.participants}</p>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn block">
              Guardar
            </button>
            {existing && (
              <button
                type="button"
                className="btn secondary block"
                style={{ color: 'var(--danger)' }}
                onClick={confirmDelete}
              >
                Eliminar gasto
              </button>
            )}
          </div>
        </form>
      </main>
    </>
  )
}
