/**
 * Iconos como SVG y no como caracteres de texto: un "+" tipográfico se alinea
 * por la caja de línea de la fuente y queda visiblemente caído dentro de un
 * botón redondo. El trazo dibujado va siempre centrado.
 */
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
