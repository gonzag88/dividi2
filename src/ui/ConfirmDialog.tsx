export interface ConfirmRequest {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}

interface Props {
  request: ConfirmRequest | null
  onCancel: () => void
}

export function ConfirmDialog({ request, onCancel }: Props) {
  if (!request) return null

  return (
    <div className="backdrop" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={request.title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{request.title}</h2>
        <p>{request.message}</p>
        <div className="dialog-actions">
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              request.onConfirm()
              onCancel()
            }}
          >
            {request.confirmLabel}
          </button>
          <button type="button" className="btn secondary" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
