import { useLayoutEffect, useRef, useState } from 'react'
import { computeBalances, isSettled } from '../domain/balances'
import {
  findByName,
  isAlreadyInGroup,
  normalizeName,
  personKey,
  suggestPeople,
  type SavedPerson,
} from '../domain/directory'
import { simplifyDebts } from '../domain/debts'
import { formatCents, formatSignedCents } from '../domain/money'
import {
  addPerson,
  canAddExpenses,
  expensesTouchingPerson,
  groupTotalCents,
  personName,
  removeExpense,
  removePerson,
  sortedExpenses,
} from '../domain/mutations'
import { describeParticipants } from '../domain/participants'
import type { Expense, Group, Person } from '../domain/types'
import { validatePersonName } from '../domain/validation'
import type { ConfirmRequest } from './ConfirmDialog'
import { SwipeToDelete } from './SwipeToDelete'
import { initial, tileClass } from './tiles'
import { BackButton, Topbar } from './Topbar'
import { PlusIcon, ReceiptIcon } from './icons'
import { goBack, navigate, paths } from './useRoute'

interface Props {
  group: Group
  onSave: (group: Group) => void
  onConfirm: (request: ConfirmRequest) => void
}

interface PeopleProps extends Props {
  /** Agenda de nombres para sugerir. Ver `src/domain/directory.ts`. */
  directory: SavedPerson[]
  /** El grupo se acaba de crear: el alta de integrantes arranca abierta. */
  autoAddPeople: boolean
  onRemember: (name: string) => void
  onForget: (personId: string) => void
}

export function GroupScreen({
  group,
  directory,
  autoAddPeople,
  onSave,
  onConfirm,
  onRemember,
  onForget,
}: PeopleProps) {
  const hasPeople = group.people.length > 0

  return (
    <>
      <Topbar
        left={<BackButton label="Volver a grupos" onClick={() => goBack(paths.groups)} />}
        right={
          <button
            type="button"
            className="btn-link"
            onClick={() => navigate(paths.report(group.id))}
          >
            Compartir
          </button>
        }
      />

      <main className={`content${canAddExpenses(group) ? ' has-fab' : ''}`}>
        <h1 className="screen-title">{group.name}</h1>

        {/* En un grupo recién creado lo único accionable es sumar gente. */}
        {hasPeople && (
          <>
            <section className="hero">
              <div className="hero-label">Total gastado</div>
              <div className="hero-amount">{formatCents(groupTotalCents(group))}</div>
              <div className="hero-meta">
                <span>
                  {group.people.length}{' '}
                  {group.people.length === 1 ? 'integrante' : 'integrantes'}
                </span>
                <span>
                  {group.expenses.length} {group.expenses.length === 1 ? 'gasto' : 'gastos'}
                </span>
              </div>
            </section>

            <BalancesSection group={group} />
            <DebtsSection group={group} />
            <ExpensesSection
              group={group}
              expenses={sortedExpenses(group)}
              onSave={onSave}
              onConfirm={onConfirm}
            />
          </>
        )}

        {/* Los integrantes van al final: se tocan mucho menos que los saldos. */}
        <PeopleSection
          group={group}
          directory={directory}
          autoAddPeople={autoAddPeople}
          onSave={onSave}
          onConfirm={onConfirm}
          onRemember={onRemember}
          onForget={onForget}
        />
      </main>

      {canAddExpenses(group) && (
        <button
          type="button"
          className="fab"
          aria-label="Agregar gasto"
          onClick={() => navigate(paths.newExpense(group.id))}
        >
          <PlusIcon size={26} />
        </button>
      )}
    </>
  )
}

function BalancesSection({ group }: { group: Group }) {
  const balances = computeBalances(group)

  return (
    <section className="section">
      <h2 className="section-title">Balances</h2>
      <div className="card">
        {balances.map((balance) => (
          <div key={balance.personId} className="row">
            <span className={`tile ${tileClass(balance.personId)}`}>{initial(balance.name)}</span>
            <div className="row-main">
              <span className="row-title">{balance.name}</span>
              <span className="row-sub">{describeBalance(balance.cents)}</span>
            </div>
            <span className={`row-amount ${balanceClass(balance.cents)}`}>
              {formatSignedCents(balance.cents)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function DebtsSection({ group }: { group: Group }) {
  const balances = computeBalances(group)
  const debts = simplifyDebts(balances)

  return (
    <section className="section">
      <h2 className="section-title">Deudas</h2>
      <div className="card">
        {isSettled(balances) || debts.length === 0 ? (
          <div className="empty">
            <span className="pill">Está todo saldado</span>
          </div>
        ) : (
          debts.map((debt, index) => (
            <div key={`${debt.fromId}-${debt.toId}-${index}`} className="row">
              <span className={`tile ${tileClass(debt.fromId)}`}>{initial(debt.fromName)}</span>
              <div className="row-main">
                <span className="row-title">{debt.fromName}</span>
                <span className="row-sub">le paga a {debt.toName}</span>
              </div>
              <span className="row-amount">{formatCents(debt.cents)}</span>
            </div>
          ))
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
      message:
        'Se va a eliminar el gasto y se van a recalcular los balances. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar gasto',
      onConfirm: () => onSave(removeExpense(group, expense.id)),
    })
  }

  return (
    <section className="section">
      {/* No hay acción acá: el botón flotante está siempre a mano. */}
      <h2 className="section-title">Gastos</h2>

      {!enabled ? (
        <div className="card empty">
          <p>Para cargar un gasto hacen falta al menos 2 integrantes.</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="card empty">
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
        <div className="cards">
          {expenses.map((expense) => (
            <SwipeToDelete key={expense.id} onDelete={() => confirmRemove(expense)}>
              <button
                type="button"
                className="row tappable"
                onClick={() => navigate(paths.expense(group.id, expense.id))}
              >
                {/* Todos los gastos comparten el mismo icono y el mismo color:
                    la inicial de la descripción no aportaba información. */}
                <span className="tile tile-expense">
                  <ReceiptIcon />
                </span>
                <span className="row-main">
                  <span className="row-title">{expense.description}</span>
                  <span className="row-sub">
                    Pagó {personName(group, expense.paidBy)} ·{' '}
                    {describeParticipants(expense, group.people)}
                  </span>
                </span>
                <span className="row-amount">{formatCents(expense.amountCents)}</span>
              </button>
            </SwipeToDelete>
          ))}
        </div>
      )}
    </section>
  )
}

function PeopleSection({
  group,
  directory,
  autoAddPeople,
  onSave,
  onConfirm,
  onRemember,
  onForget,
}: PeopleProps) {
  const [adding, setAdding] = useState(autoAddPeople)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const rowRef = useRef<HTMLFormElement>(null)
  const anchorTop = useRef<number | null>(null)

  // useLayoutEffect y no useEffect: iOS sólo abre el teclado si el foco ocurre
  // dentro del gesto que lo disparó, y los efectos de layout corren antes de
  // que termine el click.
  useLayoutEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  useLayoutEffect(() => {
    // La URL con /integrantes es sólo el empujón del grupo recién creado: se
    // limpia enseguida para que volver a esta pantalla no reabra el campo.
    // replaceState no dispara hashchange, así que no re-renderiza nada.
    if (autoAddPeople) window.history.replaceState(null, '', paths.group(group.id))
  }, [autoAddPeople, group.id])

  /**
   * Sumar gente hace crecer todo lo que está arriba (aparecen los balances, la
   * lista de integrantes suma una fila), así que la fila de alta se escaparía
   * hacia abajo de la pantalla y habría que scrollear después de cada persona.
   * Se guarda dónde estaba antes del cambio y se compensa el scroll para que
   * quede quieta. Safari no soporta `overflow-anchor`, así que va a mano.
   */
  useLayoutEffect(() => {
    const before = anchorTop.current
    anchorTop.current = null
    if (before === null || !rowRef.current) return
    window.scrollBy(0, rowRef.current.getBoundingClientRect().top - before)
  }, [group.people.length])

  const taken = group.people.map((person) => person.name)
  // Con el campo vacío las sugerencias son un atajo a los últimos usados.
  const suggestions = adding ? suggestPeople(directory, name, taken) : []
  const typed = normalizeName(name)
  const duplicate = typed !== '' && isAlreadyInGroup(taken, typed)
  // Si lo tipeado ya está en las sugerencias, la fila de crear sobra.
  const canCreate =
    typed !== '' &&
    !duplicate &&
    !suggestions.some((person) => personKey(person.name) === personKey(typed))

  const open = () => {
    setName('')
    setError(null)
    setAdding(true)
  }

  /** Al salir del campo se descarta lo que haya escrito sin confirmar. */
  const close = () => {
    setAdding(false)
    setName('')
    setError(null)
  }

  /**
   * Elegir de la agenda y escribir un nombre nuevo terminan acá: en los dos
   * casos el grupo crea su propia persona con el nombre copiado, y la agenda
   * se queda con el nombre para la próxima vez.
   *
   * El alias también se copia acá, si la agenda tiene uno para ese nombre. Se
   * busca por nombre y no por la sugerencia tocada, así escribirlo a mano
   * completo da el mismo resultado que elegirlo de la lista.
   */
  const add = (rawName: string) => {
    const problem = validatePersonName(rawName)
    if (problem) {
      setError(problem)
      return
    }
    if (isAlreadyInGroup(taken, rawName)) {
      setError(`${normalizeName(rawName)} ya está en el grupo.`)
      return
    }
    anchorTop.current = rowRef.current?.getBoundingClientRect().top ?? null
    onSave(addPerson(group, normalizeName(rawName), findByName(directory, rawName)?.alias))
    onRemember(rawName)
    // La fila queda abierta para seguir cargando gente de corrido.
    setName('')
    setError(null)
    inputRef.current?.focus()
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
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">Integrantes</h2>
        <button type="button" className="btn-link" onClick={open}>
          + Agregar
        </button>
      </div>

      <div className="card">
        {group.people.length === 0 && !adding && (
          <div className="empty">
            <p>Todavía no hay integrantes en este grupo.</p>
          </div>
        )}

        {group.people.map((person) => (
          <div key={person.id} className="row">
            <span className={`tile ${tileClass(person.id)}`}>{initial(person.name)}</span>
            <div className="row-main">
              <span className="row-title">{person.name}</span>
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
        ))}

        {adding && (
          <form
            ref={rowRef}
            className="row"
            onSubmit={(event) => {
              event.preventDefault()
              add(name)
            }}
          >
            <span className="tile tile-mint">
              <PlusIcon size={18} />
            </span>
            <input
              ref={inputRef}
              className="row-input"
              value={name}
              placeholder="Buscar o escribir un nombre"
              aria-label="Nombre de la persona"
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="done"
              onBlur={close}
              onChange={(event) => {
                setName(event.target.value)
                setError(null)
              }}
            />
          </form>
        )}
      </div>

      {/* Las sugerencias van en su propia tarjeta, debajo del campo, como un
          desplegable. El preventDefault del mousedown evita que tocarlas le
          saque el foco al input: si no, el onBlur cerraría la fila antes de que
          llegara el click, y en iOS se cerraría el teclado en cada alta. */}
      {adding && (suggestions.length > 0 || canCreate || duplicate) && (
        <div className="card suggestions" onMouseDown={(event) => event.preventDefault()}>
          {suggestions.map((person) => (
            <div key={person.id} className="row">
              <button
                type="button"
                className="row-button"
                onClick={() => add(person.name)}
              >
                <span className={`tile ${tileClass(person.id)}`}>{initial(person.name)}</span>
                <span className="row-main">
                  <span className="row-title">{person.name}</span>
                </span>
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Olvidar a ${person.name}`}
                onClick={() => onForget(person.id)}
              >
                ×
              </button>
            </div>
          ))}

          {/* Avisa antes de tocar nada: escribir a alguien que ya está no hace
              nada, y sin esto la lista se vaciaría sin explicar por qué. */}
          {duplicate && (
            <div className="row">
              <span className="row-main">
                <span className="row-sub">{typed} ya está en el grupo.</span>
              </span>
            </div>
          )}

          {canCreate && (
            <button type="button" className="row tappable" onClick={() => add(typed)}>
              <span className="tile tile-mint">
                <PlusIcon size={18} />
              </span>
              <span className="row-main">
                <span className="row-title">Crear “{typed}”</span>
                <span className="row-sub">Persona nueva</span>
              </span>
            </button>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  )
}

function describeBalance(cents: number): string {
  if (cents > 0) return 'A favor'
  if (cents < 0) return 'Debe'
  return 'Saldada'
}

function balanceClass(cents: number): string {
  if (cents > 0) return 'positive'
  if (cents < 0) return 'negative'
  return 'muted'
}
