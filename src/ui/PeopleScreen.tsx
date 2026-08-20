import { sortedDirectory, type SavedPerson } from '../domain/directory'
import type { ConfirmRequest } from './ConfirmDialog'
import { SwipeToDelete } from './SwipeToDelete'
import { initial, tileClass } from './tiles'
import { BackButton, Topbar } from './Topbar'
import { PlusIcon } from './icons'
import { goBack, navigate, paths } from './useRoute'

interface Props {
  directory: SavedPerson[]
  onDelete: (personId: string) => void
  onConfirm: (request: ConfirmRequest) => void
}

/**
 * Gestión de la agenda de integrantes: la lista de nombres que se sugieren al
 * armar un grupo. No es la lista de nadie en particular y no pertenece a
 * ningún grupo — tocar algo acá nunca cambia un grupo que ya existe.
 */
export function PeopleScreen({ directory, onDelete, onConfirm }: Props) {
  const people = sortedDirectory(directory)

  const confirmDelete = (person: SavedPerson) => {
    onConfirm({
      title: `Eliminar a ${person.name}`,
      message:
        'Deja de aparecer como sugerencia al sumar gente a un grupo. Los grupos donde ya está no se tocan.',
      confirmLabel: 'Eliminar integrante',
      onConfirm: () => onDelete(person.id),
    })
  }

  return (
    <>
      <Topbar
        left={<BackButton label="Volver a grupos" onClick={() => goBack(paths.groups)} />}
        right={
          <button
            type="button"
            className="icon-round solid"
            aria-label="Agregar integrante"
            onClick={() => navigate(paths.newPerson)}
          >
            <PlusIcon />
          </button>
        }
      />

      <main className="content">
        <h1 className="screen-title">
          Integrantes
          <span className="sub">Se sugieren al sumar gente a un grupo</span>
        </h1>

        {people.length === 0 ? (
          <div className="card empty">
            <p>Todavía no hay nadie guardado.</p>
            <p>
              Se van guardando solos a medida que sumás gente a tus grupos, o los podés cargar
              acá.
            </p>
            <button type="button" className="btn" onClick={() => navigate(paths.newPerson)}>
              Agregar integrante
            </button>
          </div>
        ) : (
          <div className="cards">
            {people.map((person) => (
              <SwipeToDelete key={person.id} onDelete={() => confirmDelete(person)}>
                <button
                  type="button"
                  className="row tappable"
                  onClick={() => navigate(paths.person(person.id))}
                >
                  <span className={`tile ${tileClass(person.id)}`}>{initial(person.name)}</span>
                  <span className="row-main">
                    <span className="row-title">{person.name}</span>
                    <span className="row-sub">{person.alias ?? 'Sin alias'}</span>
                  </span>
                  <span className="chevron">›</span>
                </button>
              </SwipeToDelete>
            ))}
          </div>
        )}

        <p className="hint">
          Los cambios que hagas acá valen para los grupos que armes de ahora en adelante: los que
          ya existen quedan como están.
        </p>
      </main>
    </>
  )
}
