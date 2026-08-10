import { useRef, useState, type PointerEvent, type ReactNode } from 'react'

const ACTION_WIDTH = 104
/** Antes de este umbral se considera scroll vertical, no swipe. */
const DRAG_THRESHOLD = 8

interface Props {
  children: ReactNode
  onDelete: () => void
  deleteLabel?: string
}

/**
 * Deslizar hacia la izquierda para descubrir el botón de eliminar, como en Mail
 * o Mensajes. Sin librerías: pointer events, que en iOS cubren el táctil y en
 * escritorio el mouse.
 */
export function SwipeToDelete({ children, onDelete, deleteLabel = 'Eliminar' }: Props) {
  const [offset, setOffset] = useState(0)
  const [settling, setSettling] = useState(false)
  const start = useRef<{ x: number; y: number; base: number } | null>(null)
  const dragging = useRef(false)
  const justDragged = useRef(false)

  const close = () => {
    setSettling(true)
    setOffset(0)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    start.current = { x: event.clientX, y: event.clientY, base: offset }
    dragging.current = false
    setSettling(false)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    const dx = event.clientX - start.current.x
    const dy = event.clientY - start.current.y

    // Mientras el gesto sea más vertical que horizontal, es scroll: no tocar.
    if (!dragging.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return
      dragging.current = true
    }

    setOffset(Math.min(0, Math.max(-ACTION_WIDTH, start.current.base + dx)))
  }

  const onPointerUp = () => {
    if (!start.current) return
    start.current = null
    setSettling(true)
    setOffset((current) => (current < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0))

    if (dragging.current) {
      // Evita que el gesto termine disparando el click de la tarjeta.
      justDragged.current = true
      window.setTimeout(() => {
        justDragged.current = false
      }, 0)
    }
    dragging.current = false
  }

  return (
    <div className="swipe">
      <button
        type="button"
        className="swipe-action"
        tabIndex={offset === 0 ? -1 : 0}
        aria-hidden={offset === 0}
        onClick={() => {
          close()
          onDelete()
        }}
      >
        {deleteLabel}
      </button>

      <div
        className={`swipe-track${settling ? ' settling' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(event) => {
          // Con la fila abierta, el primer toque la cierra en vez de navegar.
          if (justDragged.current || offset !== 0) {
            event.stopPropagation()
            event.preventDefault()
            close()
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
