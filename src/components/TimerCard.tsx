import { useState } from 'react'
import { MoreHorizontal, Pause, Pencil, Play, RotateCcw, Trash2 } from 'lucide-react'
import { JPY, USD, earnedUsd, elapsedSeconds, formatDuration } from '../lib/timer'
import type { TimerRecord } from '../types'

type TimerCardProps = {
  timer: TimerRecord
  now: number
  exchangeRate: number | null
  menuOpen: boolean
  onToggleMenu: () => void
  onRunChange: (running: boolean) => Promise<void>
  onEdit: () => void
  onReset: () => void
  onDelete: () => void
}

export function TimerCard({
  timer,
  now,
  exchangeRate,
  menuOpen,
  onToggleMenu,
  onRunChange,
  onEdit,
  onReset,
  onDelete,
}: TimerCardProps) {
  const [changing, setChanging] = useState(false)
  const seconds = elapsedSeconds(timer, now)
  const currentEarnedUsd = earnedUsd(timer, now)
  const earnedJpy = exchangeRate === null ? null : currentEarnedUsd * exchangeRate

  const toggleRunning = async () => {
    setChanging(true)
    try {
      await onRunChange(!timer.isRunning)
    } finally {
      setChanging(false)
    }
  }

  return (
    <article className={`timer-card ${timer.isRunning ? 'running' : ''}`}>
      <div className="timer-identity">
        <div className={`status-pill ${timer.isRunning ? 'active' : 'idle'}`}>
          <span className="status-dot" />
          {timer.isRunning ? '実行中' : '停止中'}
        </div>
        <h3 title={timer.name}>{timer.name}</h3>
        <button className="rate-chip" type="button" onClick={onEdit} title="時給を編集">
          <span>{USD.format(timer.hourlyRateUsd)} / 時</span>
          <Pencil size={14} />
        </button>
      </div>

      <div className="timer-metrics">
        <div className="metric elapsed-metric">
          <span>経過時間</span>
          <strong className="tabular">{formatDuration(seconds)}</strong>
        </div>
        <div className="metric">
          <span>収益（USD）</span>
          <strong className="tabular">{USD.format(currentEarnedUsd)}</strong>
        </div>
        <div className="metric">
          <span>円換算</span>
          <strong className="tabular">{earnedJpy === null ? '—' : JPY.format(earnedJpy)}</strong>
        </div>
      </div>

      <div className="timer-actions">
        <button
          className={`timer-main-action ${timer.isRunning ? 'pause' : 'play'}`}
          type="button"
          onClick={toggleRunning}
          disabled={changing}
          aria-label={timer.isRunning ? '停止' : '開始'}
          title={timer.isRunning ? '停止' : '開始'}
        >
          {timer.isRunning ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}
        </button>
        <button className="icon-button" type="button" onClick={onReset} aria-label="リセット" title="リセット">
          <RotateCcw size={19} />
        </button>
        <div className="menu-anchor">
          <button className="icon-button" type="button" onClick={onToggleMenu} aria-label="その他" title="その他">
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <div className="timer-menu">
              <button type="button" onClick={onEdit}>
                <Pencil size={15} />
                編集
              </button>
              <button className="menu-danger" type="button" onClick={onDelete}>
                <Trash2 size={15} />
                削除
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
