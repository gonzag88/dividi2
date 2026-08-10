import { useState } from 'react'
import { validateGroupName } from '../domain/validation'
import type { Group } from '../domain/types'
import { Header } from './Header'
import type { ConfirmRequest } from './ConfirmDialog'
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
      <Header
        title="Grupos"
        right={
          !creating && (
            <button type="button" className="btn-link" onClick={() => setCreating(true)}>
              Nuevo
            </button>
          )
        }
      />

      <main className="content">
        {creating && (
          <form
            className="card"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <div style={{ padding: 14 }}>
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="field-label">Nombre del grupo</span>
                <input
                  className="input"
                  autoFocus
                  value={name}
                  placeholder="Viaje a Brasil"
                  onChange={(event) => {
                    setName(event.target.value)
                    setError(null)
                  }}
                />
              </label>
              {error && <p className="error">{error}</p>}
              <div className="form-actions">
                <button type="submit" className="btn block">
                  Crear grupo
                </button>
                <button type="button" className="btn secondary block" onClick={cancel}>
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}

        {groups.length === 0 && !creating ? (
          <div className="card empty">
            <p>Todavía no hay grupos.</p>
            <button type="button" className="btn" onClick={() => setCreating(true)}>
              Crear el primer grupo
            </button>
          </div>
        ) : (
          groups.length > 0 && (
            <div className="card">
              {groups.map((group) => (
                <div key={group.id} className="row">
                  <button
                    type="button"
                    className="row-button tappable"
                    onClick={() => navigate(paths.group(group.id))}
                  >
                    <span className="row-main">
                      <span className="row-title">{group.name}</span>
                      <span className="row-sub" style={{ display: 'block' }}>
                        {describeGroup(group)}
                      </span>
                    </span>
                    <span className="chevron">›</span>
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Eliminar ${group.name}`}
                    onClick={() => confirmDelete(group)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </>
  )
}

function describeGroup(group: Group): string {
  const people = group.people.length === 1 ? '1 integrante' : `${group.people.length} integrantes`
  const expenses = group.expenses.length === 1 ? '1 gasto' : `${group.expenses.length} gastos`
  return `${people} · ${expenses}`
}
