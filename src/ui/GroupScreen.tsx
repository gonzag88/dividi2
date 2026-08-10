import { useState } from 'react'
import { computeBalances, isSettled } from '../domain/balances'
import { simplifyDebts } from '../domain/debts'
import { formatCents, formatSignedCents } from '../domain/money'
import {
  addPerson,
  canAddExpenses,
  expensesTouchingPerson,
  personName,
  removeExpense,
  removePerson,
  sortedExpenses,
} from '../domain/mutations'
import type { Expense, Group, Person } from '../domain/types'
import { validatePersonName } from '../domain/validation'
import type { ConfirmRequest } from './ConfirmDialog'
import { BackButton, Header } from './Header'
import { goBack, navigate, paths } from './useRoute'

interface Props {
  group: Group
  onSave: (group: Group) => void
  onConfirm: (request: ConfirmRequest) => void
}

export function GroupScreen({ group, onSave, onConfirm }: Props) {
  const balances = computeBalances(group)
  const debts = simplifyDebts(balances)
  const expenses = sortedExpenses(group)
  const settled = isSettled(balances)

  return (
    <>
      <Header
        title={group.name}
        left={<BackButton label="Grupos" onClick={() => goBack(paths.groups)} />}
        right={
          <button type="button" className="btn-link" onClick={() => navigate(paths.report(group.id))}>
            Reporte
          </button>
        }
      />

      <main className="content">
        <PeopleSection group={group} onSave={onSave} onConfirm={onConfirm} />

        <section>
          <h2 className="section-title">Balances</h2>
          <div className="card">
            {balances.length === 0 ? (
              <div className="empty">
                <p>Agregá integrantes para ver los balances.</p>
              </div>
            ) : (
              balances.map((balance) => (
                <div key={balance.personId} className="row">
                  <div className="row-main">
                    <div className="row-title">{balance.name}</div>
                    <div className="row-sub">{describeBalance(balance.cents)}</div>
                  </div>
                  <span className={`row-amount ${balanceClass(balance.cents)}`}>
                    {formatSignedCents(balance.cents)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="section-title">Deudas</h2>
          <div className="card">
            {settled || debts.length === 0 ? (
              <div className="empty">
                <p>Está todo saldado.</p>
              </div>
            ) : (
              debts.map((debt, index) => (
                <div key={`${debt.fromId}-${debt.toId}-${index}`} className="row">
                  <div className="row-main">
                    <div className="row-title">
                      {debt.fromName} → {debt.toName}
                    </div>
                  </div>
                  <span className="row-amount">{formatCents(debt.cents)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <ExpensesSection group={group} expenses={expenses} onSave={onSave} onConfirm={onConfirm} />
      </main>
    </>
  )
}

function PeopleSection({ group, onSave, onConfirm }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const problem = validatePersonName(name)
    if (problem) {
      setError(problem)
      return
    }
    onSave(addPerson(group, name))
    setName('')
    setError(null)
  }

  const confirmRemove = (person: Person) => {
    const affected = expensesTouchingPerson(group, person.id).length
    onConfirm({
      title: `Eliminar a ${person.name}`,
      message:
        affected === 0
          ? 'No tiene gastos asociados. Esta acción no se puede deshacer.'
          : `También se eliminarán todos los gastos asociados a esta persona: ${affected} ${
              affected === 1 ? 'gasto' : 'gastos'
            }. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar persona',
      onConfirm: () => onSave(removePerson(group, person.id)),
    })
  }

  return (
    <section>
      <h2 className="section-title">Integrantes</h2>
      <div className="card">
        {group.people.length === 0 ? (
          <div className="empty">
            <p>Todavía no hay integrantes en este grupo.</p>
          </div>
        ) : (
          group.people.map((person) => (
            <div key={person.id} className="row">
              <div className="row-main">
                <div className="row-title">{person.name}</div>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Eliminar a ${person.name}`}
                onClick={() => confirmRemove(person)}
              >
                ×
              </button>
            </div>
          ))
        )}

        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <input
            className="input"
            value={name}
            placeholder="Agregar persona"
            aria-label="Nombre de la persona"
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
          />
          <button type="submit" className="btn">
            Agregar
          </button>
        </form>
        {error && (
          <p className="error" style={{ padding: '0 14px 12px' }}>
            {error}
          </p>
        )}
      </div>
    </section>
  )
}

function ExpensesSection({
  group,
  expenses,
  onSave,
  onConfirm,
}: Props & { expenses: Expense[] }) {
  const enabled = canAddExpenses(group)

  const confirmRemove = (expense: Expense) => {
    onConfirm({
      title: `Eliminar "${expense.description}"`,
      message: 'Se va a eliminar el gasto y se van a recalcular los balances. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar gasto',
      onConfirm: () => onSave(removeExpense(group, expense.id)),
    })
  }

  return (
    <section>
      <div className="section-head">
        <h2 className="section-title">Gastos</h2>
        {enabled && expenses.length > 0 && (
          <button
            type="button"
            className="btn-link small"
            onClick={() => navigate(paths.newExpense(group.id))}
          >
            Agregar gasto
          </button>
        )}
      </div>

      <div className="card">
        {!enabled ? (
          <div className="empty">
            <p>Para cargar un gasto hacen falta al menos 2 integrantes.</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty">
            <p>Todavía no hay gastos.</p>
            <button
              type="button"
              className="btn"
              onClick={() => navigate(paths.newExpense(group.id))}
            >
              Agregar gasto
            </button>
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="row">
              <button
                type="button"
                className="row-button tappable"
                onClick={() => navigate(paths.expense(group.id, expense.id))}
              >
                <span className="row-main">
                  <span className="row-title">{expense.description}</span>
                  <span className="row-sub" style={{ display: 'block' }}>
                    Pagó {personName(group, expense.paidBy)} · entre{' '}
                    {expense.participants
                      .map((id) => personName(group, id))
                      .join(', ')}
                  </span>
                </span>
                <span className="row-amount">{formatCents(expense.amountCents)}</span>
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Eliminar ${expense.description}`}
                onClick={() => confirmRemove(expense)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function describeBalance(cents: number): string {
  if (cents > 0) return 'Le tienen que devolver'
  if (cents < 0) return 'Tiene que pagar'
  return 'Está saldada'
}

function balanceClass(cents: number): string {
  if (cents > 0) return 'positive'
  if (cents < 0) return 'negative'
  return 'muted'
}
