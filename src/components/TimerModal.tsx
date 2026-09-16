import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { TimerDraft, TimerRecord } from '../types'

type TimerModalProps = {
  timer: TimerRecord | null
  onClose: () => void
  onSubmit: (draft: TimerDraft) => Promise<void>
}

export function TimerModal({ timer, onClose, onSubmit }: TimerModalProps) {
  const [name, setName] = useState(timer?.name ?? '')
  const [rate, setRate] = useState(timer ? String(timer.hourlyRateUsd) : '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const nameInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameInput.current?.focus()
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const hourlyRateUsd = Number(rate)

    if (!name.trim()) {
      setError('名前を入力してください')
      return
    }
    if (!Number.isFinite(hourlyRateUsd) || hourlyRateUsd < 0) {
      setError('時給は0以上の数値を入力してください')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onSubmit({ name: name.trim(), hourlyRateUsd })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="timer-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="modal-eyebrow">{timer ? 'タイマーを編集' : '新しいタイマー'}</p>
            <h2>{timer ? timer.name : 'タイマーを追加'}</h2>
          </div>
          <button className="icon-button ghost" type="button" onClick={onClose} aria-label="閉じる">
            <X size={18} />
          </button>
        </div>

        <label className="field">
          <span>名前</span>
          <input
            ref={nameInput}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="作業名"
            maxLength={100}
          />
        </label>

        <label className="field">
          <span>時給</span>
          <div className="rate-input-wrap">
            <span>$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="15.00"
            />
            <span>USD / 時</span>
          </div>
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            キャンセル
          </button>
          <button className="primary-button compact" type="submit" disabled={saving}>
            {saving ? '保存中…' : timer ? '保存' : '作成'}
          </button>
        </div>
      </form>
    </div>
  )
}
