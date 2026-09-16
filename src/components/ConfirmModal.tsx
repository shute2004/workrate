import { useState } from 'react'

type ConfirmModalProps = {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="confirm-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            キャンセル
          </button>
          <button
            className={danger ? 'danger-button' : 'primary-button compact'}
            type="button"
            disabled={busy}
            onClick={confirm}
          >
            {busy ? '処理中…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
