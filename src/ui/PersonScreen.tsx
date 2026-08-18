import { useState } from 'react'
import { ALIAS_MAX_LENGTH, type SavedPerson } from '../domain/directory'
import { validateSavedPerson, type SavedPersonErrors } from '../domain/validation'
import type { ConfirmRequest } from './ConfirmDialog'
import { BackButton, Topbar } from './Topbar'
import { goBack, paths } from './useRoute'

interface Props {
  directory: SavedPerson[]
  person: SavedPerson | null
  onSave: (personId: string | null, name: string, alias: string) => void
  onDelete: (personId: string) => void
  onConfirm: (request: ConfirmRequest) => void
}

/**
 * Alta y edición de una entrada de la agenda. El alias es lo único que esta
 * pantalla agrega respecto de crear gente desde un grupo, y sólo se usa para
 * mostrarlo en el reporte.
 */
export function PersonScreen({ directory, person, onSave, onDelete, onConfirm }: Props) {
  const [name, setName] = useState(person?.name ?? '')
  const [alias, setAlias] = useState(person?.alias ?? '')
  const [errors, setErrors] = useState<SavedPersonErrors>({})

  const back = () => goBack(paths.people)

  const submit = () => {
    const result = validateSavedPerson({ name, alias }, directory, person?.id ?? null)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    onSave(person?.id ?? null, result.name, result.alias)
    back()
  }

  const confirmDelete = () => {
    if (!person) return
    onConfirm({
      title: `Eliminar a ${person.name}`,
      message:
        'Deja de aparecer como sugerencia al sumar gente a un grupo. Los grupos donde ya está no se tocan.',
      confirmLabel: 'Eliminar integrante',
      onConfirm: () => {
        onDelete(person.id)
        back()
      },
    })
  }

  return (
    <>
      <Topbar left={<BackButton label="Cancelar" onClick={back} />} />

      <main className="content">
        <h1 className="screen-title">{person ? 'Editar integrante' : 'Nuevo integrante'}</h1>

        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="field">
            <label className="field-label" htmlFor="person-name">
              Nombre
            </label>
            <input
              id="person-name"
              className="input"
              value={name}
              placeholder="Ana"
              autoComplete="off"
              autoCorrect="off"
              autoFocus={!person}
              enterKeyHint="next"
              onChange={(event) => {
                setName(event.target.value)
                setErrors((current) => ({ ...current, name: undefined }))
              }}
            />
            {errors.name && <p className="error">{errors.name}</p>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="person-alias">
              Alias bancario
            </label>
            <input
              id="person-alias"
              className="input"
              value={alias}
              placeholder="ana.mp"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={ALIAS_MAX_LENGTH}
              enterKeyHint="done"
              onChange={(event) => {
                setAlias(event.target.value)
                setErrors((current) => ({ ...current, alias: undefined }))
              }}
            />
            {errors.alias && <p className="error">{errors.alias}</p>}
            <p className="hint">
              Opcional. Se muestra en el reporte, al lado de quien tiene que cobrar, para saber a
              dónde transferirle.
            </p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn block">
              Guardar
            </button>
            {person && (
              <button type="button" className="btn danger-text block" onClick={confirmDelete}>
                Eliminar integrante
              </button>
            )}
          </div>
        </form>
      </main>
    </>
  )
}
