/**
 * Iconos como SVG y no como caracteres de texto: un "+" tipográfico se alinea
 * por la caja de línea de la fuente y queda visiblemente caído dentro de un
 * botón redondo. El trazo dibujado va siempre centrado.
 */
/** Ticket: el mismo icono para todos los gastos. */
export function ReceiptIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <path d="M6 3.5h12v17l-3-1.7-3 1.7-3-1.7-3 1.7z" />
      <path d="M9.2 8.6h5.6" />
      <path d="M9.2 12.2h5.6" />
    </svg>
  )
}

export function PlusIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <rect x="4" y="10.75" width="16" height="2.5" rx="1.25" />
      <rect x="10.75" y="4" width="2.5" height="16" rx="1.25" />
    </svg>
  )
}
