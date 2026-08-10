import type { ReactNode } from 'react'

/**
 * Barra superior liviana: sólo botones redondos a los costados. El título de
 * cada pantalla es un encabezado grande dentro del contenido, no acá.
 */
export function Topbar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="topbar">
      <div className="topbar-slot">{left}</div>
      <div className="topbar-slot">{right}</div>
    </div>
  )
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="icon-round" aria-label={label} onClick={onClick}>
      ‹
    </button>
  )
}
