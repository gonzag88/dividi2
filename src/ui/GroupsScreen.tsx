import { useLayoutEffect, useRef, useState } from 'react'
import { formatCents } from '../domain/money'
import { groupTotalCents } from '../domain/mutations'
import type { Group } from '../domain/types'
import { validateGroupName } from '../domain/validation'
import type { ConfirmRequest } from './ConfirmDialog'
import { SwipeToDelete } from './SwipeToDelete'
import { initial, tileClass } from './tiles'
import { Topbar } from './Topbar'
import { PlusIcon } from './icons'
import { navigate, paths } from './useRoute'

interface Props {
  groups: Group[]
  onCreate: (name: string) => void
  onDelete: (groupId: string) => void
  onConfirm: (request: ConfirmRequest) => void
}

export function GroupsScreen({ groups, onCreate, onDelete, onConfirm }: Props) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  const submit = () => {
    const problem = validateGroupName(name)
    if (problem) {
      setError(problem)
      return
    }
    onCreate(name)
    setName('')
    setError(null)
    setCreating(false)
  }

  const cancel = () => {
    setCreating(false)
    setName('')
    setError(null)
  }

  const confirmDelete = (group: Group) => {
    onConfirm({
      title: `Eliminar "${group.name}"`,
      message:
        'Se va a eliminar toda la información del grupo: integrantes, gastos y balances. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar grupo',
      onConfirm: () => onDelete(group.id),
    })
  }

  return (
    <>
      <Topbar
        right={
          !creating && (
            <button
              type="button"
              className="icon-round solid"
              aria-label="Crear grupo"
              onClick={() => setCreating(true)}
            >
              <PlusIcon />
            </button>
          )
        }
      />

      <main className="content">
        <h1 className="screen-title">
          Grupos
          {groups.length > 0 && (
            <span className="sub">
              {groups.length === 1 ? '1 grupo' : `${groups.length} grupos`}
            </span>
          )}
        </h1>

        {creating && (
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <div className="field">
              <span className="field-label">Nombre del grupo</span>
              <input
                ref={inputRef}
                className="input"
                value={name}
                placeholder="Viaje a Brasil"
                enterKeyHint="done"
                onChange={(event) => {
                  setName(event.target.value)
                  setError(null)
                }}
              />
              {error && <p className="error">{error}</p>}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn block">
                Crear grupo
              </button>
              <button type="button" className="btn secondary block" onClick={cancel}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {groups.length === 0 && !creating && (
          <div className="card empty">
            <p>Todavía no hay grupos.</p>
            <button type="button" className="btn" onClick={() => setCreating(true)}>
              Crear el primer grupo
            </button>
          </div>
        )}

        {groups.length > 0 && (
          <div className="cards">
            {groups.map((group) => (
              <SwipeToDelete key={group.id} onDelete={() => confirmDelete(group)}>
                <button
                  type="button"
                  className="row tappable"
                  onClick={() => navigate(paths.group(group.id))}
                >
                  <span className={`tile ${tileClass(group.id)}`}>{initial(group.name)}</span>
                  <span className="row-main">
                    <span className="row-title">{group.name}</span>
                    <span className="row-sub">{describeGroup(group)}</span>
                  </span>
                  {group.expenses.length > 0 && (
                    <span className="row-amount">{formatCents(groupTotalCents(group))}</span>
                  )}
                  <span className="chevron">›</span>
                </button>
              </SwipeToDelete>
            ))}
          </div>
        )}

        {/* Sello del build: sirve para saber si el dispositivo ya tomó la última versión. */}
        <p className="build-version">v{__BUILD_VERSION__}</p>
      </main>
    </>
  )
}

function describeGroup(group: Group): string {
  const people = group.people.length === 1 ? '1 integrante' : `${group.people.length} integrantes`
  const expenses = group.expenses.length === 1 ? '1 gasto' : `${group.expenses.length} gastos`
  return `${people} · ${expenses}`
}
