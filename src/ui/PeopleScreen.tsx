import { sortedDirectory, type SavedPerson } from '../domain/directory'
import { initial, tileClass } from './tiles'
import { BackButton, Topbar } from './Topbar'
import { PlusIcon } from './icons'
import { goBack, navigate, paths } from './useRoute'

/**
 * Gestión de la agenda de integrantes: la lista de nombres que se sugieren al
 * armar un grupo. No es la lista de nadie en particular y no pertenece a
 * ningún grupo — tocar algo acá nunca cambia un grupo que ya existe.
 */
export function PeopleScreen({ directory }: { directory: SavedPerson[] }) {
  const people = sortedDirectory(directory)

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
          <div className="card">
            {people.map((person) => (
              <button
                key={person.id}
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
