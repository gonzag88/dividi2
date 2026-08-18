import { useCallback, useEffect, useState } from 'react'
import {
  deleteGroup as deleteGroupFromDb,
  deleteSavedPerson,
  getAllGroups,
  getDirectory,
  putGroup,
  putSavedPerson,
} from './db/db'
import { forgetPerson, rememberPerson, type SavedPerson } from './domain/directory'
import { createGroup } from './domain/mutations'
import type { Group } from './domain/types'
import { ConfirmDialog, type ConfirmRequest } from './ui/ConfirmDialog'
import { ExpenseScreen } from './ui/ExpenseScreen'
import { GroupScreen } from './ui/GroupScreen'
import { GroupsScreen } from './ui/GroupsScreen'
import { Topbar } from './ui/Topbar'
import { ReportScreen } from './ui/ReportScreen'
import { navigate, paths, useRoute } from './ui/useRoute'

function sortGroups(groups: Group[]): Group[] {
  return [...groups].sort((a, b) => a.name.localeCompare(b.name, 'es-AR') || a.id.localeCompare(b.id))
}

export default function App() {
  const route = useRoute()
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [directory, setDirectory] = useState<SavedPerson[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)

  useEffect(() => {
    getAllGroups()
      .then(setGroups)
      .catch(() => setError('No se pudieron leer los datos guardados en este dispositivo.'))
    // La agenda es una comodidad, no un dato del que dependa nada: si no se
    // puede leer, la app funciona igual y sólo deja de sugerir nombres.
    getDirectory().then(setDirectory).catch(() => undefined)
  }, [])

  // Todas las escrituras guardan el grupo completo: una sola transacción por cambio.
  const saveGroup = useCallback(async (next: Group) => {
    setGroups((current) => sortGroups((current ?? []).map((group) => (group.id === next.id ? next : group))))
    try {
      await putGroup(next)
    } catch {
      setError('No se pudieron guardar los cambios en este dispositivo.')
    }
  }, [])

  const handleCreate = useCallback(async (name: string) => {
    const group = createGroup(name)
    setGroups((current) => sortGroups([...(current ?? []), group]))
    // Un grupo vacío no sirve para nada: lo único que se puede hacer con él es
    // sumarle gente, así que la app va sola hasta ahí.
    navigate(paths.groupPeople(group.id))
    try {
      await putGroup(group)
    } catch {
      setError('No se pudo crear el grupo en este dispositivo.')
    }
  }, [])

  // Agregar a alguien a un grupo lo deja anotado en la agenda para la próxima.
  // Guarda sólo el nombre: no queda ningún vínculo con el grupo ni con la persona.
  const handleRemember = useCallback(
    async (name: string) => {
      const { directory: next, person } = rememberPerson(directory, name)
      setDirectory(next)
      try {
        await putSavedPerson(person)
      } catch {
        // Que no se guarde la sugerencia no invalida al integrante ya agregado.
      }
    },
    [directory],
  )

  /** Olvidar un nombre de la agenda. No toca a ningún grupo. */
  const handleForget = useCallback(async (personId: string) => {
    setDirectory((current) => forgetPerson(current, personId))
    try {
      await deleteSavedPerson(personId)
    } catch {
      // Idem: la agenda es un extra, no vale romper la pantalla por esto.
    }
  }, [])

  const handleDelete = useCallback(async (groupId: string) => {
    setGroups((current) => (current ?? []).filter((group) => group.id !== groupId))
    try {
      await deleteGroupFromDb(groupId)
    } catch {
      setError('No se pudo eliminar el grupo en este dispositivo.')
    }
  }, [])

  const group = route.name === 'groups' ? undefined : (groups ?? []).find((item) => item.id === route.groupId)

  // El grupo puede haberse eliminado, o el hash puede haber quedado viejo.
  const missingGroup = groups !== null && route.name !== 'groups' && !group
  // Sin 2 integrantes no se puede cargar un gasto.
  const cannotLoadExpense = route.name === 'expense' && !!group && group.people.length < 2

  useEffect(() => {
    if (missingGroup) navigate(paths.groups)
  }, [missingGroup])

  useEffect(() => {
    if (cannotLoadExpense && group) navigate(paths.group(group.id))
  }, [cannotLoadExpense, group])

  if (error) {
    return (
      <div className="app">
        <Topbar />
        <main className="content">
          <h1 className="screen-title">dividi2</h1>
          <div className="card empty">
            <p>{error}</p>
            <p>Revisá que el navegador tenga habilitado el almacenamiento local.</p>
          </div>
        </main>
      </div>
    )
  }

  if (groups === null) {
    return (
      <div className="app">
        <Topbar />
      </div>
    )
  }

  return (
    <div className="app">
      {route.name === 'groups' || !group ? (
        <GroupsScreen
          groups={groups}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onConfirm={setConfirm}
        />
      ) : route.name === 'report' ? (
        <ReportScreen group={group} />
      ) : route.name === 'expense' && !cannotLoadExpense ? (
        <ExpenseScreen
          group={group}
          expenseId={route.expenseId}
          onSave={saveGroup}
          onConfirm={setConfirm}
        />
      ) : (
        <GroupScreen
          group={group}
          directory={directory}
          autoAddPeople={route.name === 'group' && route.addPeople === true}
          onSave={saveGroup}
          onConfirm={setConfirm}
          onRemember={handleRemember}
          onForget={handleForget}
        />
      )}

      <ConfirmDialog request={confirm} onCancel={() => setConfirm(null)} />
    </div>
  )
}
