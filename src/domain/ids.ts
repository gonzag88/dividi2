let fallbackCounter = 0

/**
 * Ids únicos incluso para personas con el mismo nombre.
 * crypto.randomUUID existe en Safari 15.4+ y en Node 20; el fallback es sólo
 * una red de seguridad para contextos no seguros.
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  fallbackCounter += 1
  return `id-${Date.now().toString(36)}-${fallbackCounter}`
}
