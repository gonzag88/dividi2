/**
 * Genera los íconos de la PWA sin depender de librerías de imágenes.
 * Dibuja el signo ÷ en blanco sobre fondo verde pino y escribe PNGs a mano.
 *
 *   npm run icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BG = [0x14, 0x45, 0x3b]
const FG = [0xff, 0xff, 0xff]

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')

// ---------- PNG mínimo (color type 2: RGB, 8 bits, sin alfa) ----------

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 2 // color type RGB
  header[10] = 0 // deflate
  header[11] = 0 // filtro adaptativo
  header[12] = 0 // sin entrelazado

  // Cada scanline lleva adelante su byte de filtro (0 = ninguno).
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 3 + 1)
    raw[rowStart] = 0
    pixels.copy(raw, rowStart + 1, y * size * 3, (y + 1) * size * 3)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- dibujo del signo ÷ ----------

function makeIcon(size, glyphRatio) {
  const pixels = Buffer.alloc(size * size * 3)
  const center = size / 2
  const glyph = size * glyphRatio

  const halfBar = glyph / 2
  const barThickness = glyph * 0.075
  const dotRadius = glyph * 0.115
  const dotOffset = glyph * 0.3

  const inside = (x, y) => {
    const dx = x - center
    const dy = y - center
    if (Math.abs(dx) <= halfBar && Math.abs(dy) <= barThickness) return true
    for (const offset of [-dotOffset, dotOffset]) {
      const ddy = dy - offset
      if (dx * dx + ddy * ddy <= dotRadius * dotRadius) return true
    }
    return false
  }

  const SAMPLES = 4
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let hits = 0
      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          if (inside(x + (sx + 0.5) / SAMPLES, y + (sy + 0.5) / SAMPLES)) hits += 1
        }
      }
      const coverage = hits / (SAMPLES * SAMPLES)
      const offset = (y * size + x) * 3
      for (let channel = 0; channel < 3; channel += 1) {
        pixels[offset + channel] = Math.round(BG[channel] + (FG[channel] - BG[channel]) * coverage)
      }
    }
  }

  return encodePng(size, pixels)
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#14453b"/>
  <rect x="14" y="30" width="36" height="4.5" rx="2.25" fill="#fff"/>
  <circle cx="32" cy="21.5" r="4.2" fill="#fff"/>
  <circle cx="32" cy="42.5" r="4.2" fill="#fff"/>
</svg>
`

mkdirSync(publicDir, { recursive: true })

const files = [
  // Los íconos "any" usan casi todo el cuadro.
  ['icon-192.png', makeIcon(192, 0.62)],
  ['icon-512.png', makeIcon(512, 0.62)],
  // El maskable deja margen: Android recorta hasta el 20% de cada lado.
  ['icon-maskable-512.png', makeIcon(512, 0.44)],
  // iOS usa este y le aplica su propia máscara redondeada.
  ['apple-touch-icon.png', makeIcon(180, 0.62)],
]

for (const [name, data] of files) {
  writeFileSync(resolve(publicDir, name), data)
  console.log(`${name}: ${(data.length / 1024).toFixed(1)} KB`)
}

writeFileSync(resolve(publicDir, 'favicon.svg'), svg)
console.log('favicon.svg')
