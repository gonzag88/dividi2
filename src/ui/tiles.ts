const TILES = ['tile-mint', 'tile-peach', 'tile-lavender', 'tile-butter', 'tile-rose', 'tile-sky']

/**
 * Color del tile a partir del id: siempre el mismo para la misma entidad, y
 * repartido parejo entre la paleta.
 */
export function tileClass(seed: string): string {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return TILES[hash % TILES.length]
}

export function initial(text: string): string {
  return text.trim().charAt(0) || '·'
}
