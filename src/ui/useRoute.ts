import { useEffect, useState } from 'react'

/**
 * Ruteo por hash. No depende de configuración del servidor, así que funciona
 * igual bajo cualquier subpath de GitHub Pages, y cada pantalla queda como una
 * entrada del historial: el gesto de "volver" de iOS funciona en standalone.
 */
export type Route =
  | { name: 'groups' }
  /** `addPeople` abre el alta de integrantes: es el empujón del grupo recién creado. */
  | { name: 'group'; groupId: string; addPeople?: boolean }
  | { name: 'expense'; groupId: string; expenseId: string | null }
  | { name: 'report'; groupId: string }

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)

  if (parts[0] === 'g' && parts[1]) {
    const groupId = decodeURIComponent(parts[1])
    if (parts[2] === 'report') return { name: 'report', groupId }
    if (parts[2] === 'integrantes') return { name: 'group', groupId, addPeople: true }
    if (parts[2] === 'gasto') {
      const expenseId = parts[3] === 'nuevo' || !parts[3] ? null : decodeURIComponent(parts[3])
      return { name: 'expense', groupId, expenseId }
    }
    return { name: 'group', groupId }
  }

  return { name: 'groups' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export const paths = {
  groups: '#/',
  group: (groupId: string) => `#/g/${encodeURIComponent(groupId)}`,
  groupPeople: (groupId: string) => `#/g/${encodeURIComponent(groupId)}/integrantes`,
  newExpense: (groupId: string) => `#/g/${encodeURIComponent(groupId)}/gasto/nuevo`,
  expense: (groupId: string, expenseId: string) =>
    `#/g/${encodeURIComponent(groupId)}/gasto/${encodeURIComponent(expenseId)}`,
  report: (groupId: string) => `#/g/${encodeURIComponent(groupId)}/report`,
}

export function navigate(path: string): void {
  window.location.hash = path
}

/** Vuelve a la pantalla anterior sin acumular entradas en el historial. */
export function goBack(fallback: string): void {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigate(fallback)
  }
}
