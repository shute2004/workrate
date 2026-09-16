import { useEffect, useMemo, useState } from 'react'
import { Clock3, Plus, RefreshCw, X } from 'lucide-react'
import './App.css'
import { backend } from './backend'
import { ConfirmModal } from './components/ConfirmModal'
import { TimerCard } from './components/TimerCard'
import { TimerModal } from './components/TimerModal'
import { useVisibleClock } from './hooks/useVisibleClock'
import { JPY, USD, formatUpdatedAt, summarizeTimers } from './lib/timer'
import type { AppStateData, TimerRecord } from './types'

function App() {
  const [state, setState] = useState<AppStateData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [editingTimer, setEditingTimer] = useState<TimerRecord | null | undefined>(undefined)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<TimerRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TimerRecord | null>(null)
  const [refreshingRate, setRefreshingRate] = useState(false)
  const now = useVisibleClock()

  useEffect(() => {
    let cancelled = false
    let unlisten: (() => void) | undefined

    const load = async () => {
      try {
        const loaded = await backend.getAppState()
        if (!cancelled) setState(loaded)
        unlisten = await backend.onExchangeRateUpdated((nextState) => {
          if (!cancelled) setState(nextState)
        })
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error))
      }
    }

    void load()
    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    const closeMenus = () => setOpenMenuId(null)
    window.addEventListener('blur', closeMenus)
    return () => window.removeEventListener('blur', closeMenus)
  }, [])

  const summary = useMemo(
    () => state ? summarizeTimers(state, now) : null,
    [state, now],
  )

  const updateState = async (operation: () => Promise<AppStateData>) => {
    try {
      const next = await operation()
      setState(next)
      setLoadError('')
      return next
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  const refreshRate = async () => {
    setRefreshingRate(true)
    try {
      await updateState(() => backend.refreshExchangeRate(true))
    } finally {
      setRefreshingRate(false)
    }
  }

  if (!state || !summary) {
    return (
      <main className="loading-screen" data-tauri-drag-region>
        <div className="loading-mark"><Clock3 size={24} /></div>
        <p>{loadError || 'Workrateを読み込んでいます…'}</p>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-drag-zone" data-tauri-drag-region />
        <div className="brand">Workrate</div>

        <div className="nav-item active">
          <Clock3 size={19} />
          <span>タイマー</span>
        </div>

        <div className="sidebar-divider" />

        <div className="status-summary">
          <div><span>実行中</span><strong><i className="summary-dot green" />{summary.running}</strong></div>
          <div><span>停止中</span><strong><i className="summary-dot gray" />{summary.stopped}</strong></div>
        </div>

        <div className="sidebar-divider" />

        <section className="sidebar-section earnings-summary">
          <span className="sidebar-label">合計収益</span>
          <strong>{USD.format(summary.totalUsd)}</strong>
          <small>{summary.totalJpy === null ? '円換算を取得中' : `約 ${JPY.format(summary.totalJpy)}`}</small>
        </section>

        <section className="sidebar-section exchange-summary">
          <span className="sidebar-label">USD / JPY</span>
          <strong>{state.usdJpyRate?.toFixed(2) ?? '—'}</strong>
          <small>最終更新 {formatUpdatedAt(state.exchangeRateUpdatedAt)}</small>
        </section>
      </aside>

      <main className={`main-panel ${loadError ? 'has-error' : ''}`}>
        <header className="topbar">
          <div className="topbar-drag-strip" data-tauri-drag-region />
          <h1 data-tauri-drag-region>タイマー</h1>
          <div className="topbar-actions">
            <button className="exchange-button" type="button" onClick={refreshRate} disabled={refreshingRate}>
              <span>1 USD = {state.usdJpyRate?.toFixed(2) ?? '—'} JPY</span>
              <RefreshCw size={17} className={refreshingRate ? 'spinning' : ''} />
            </button>
            <button className="primary-button" type="button" onClick={() => setEditingTimer(null)}>
              <Plus size={20} />
              新しいタイマー
            </button>
          </div>
        </header>

        {loadError && (
          <div className="error-banner">
            <span>{loadError}</span>
            <button type="button" onClick={() => setLoadError('')}><X size={15} /></button>
          </div>
        )}

        <section className="timer-list" aria-label="タイマー一覧" onClick={() => openMenuId && setOpenMenuId(null)}>
          {state.timers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Clock3 size={23} /></div>
              <h2>タイマーはまだありません</h2>
              <p>名前と時給だけ設定して、すぐに計測を始められます。</p>
              <button className="primary-button compact" type="button" onClick={() => setEditingTimer(null)}>
                <Plus size={18} />
                タイマーを追加
              </button>
            </div>
          ) : (
            state.timers.map((timer) => (
              <div key={timer.id} onClick={(event) => event.stopPropagation()}>
                <TimerCard
                  timer={timer}
                  now={now}
                  exchangeRate={state.usdJpyRate}
                  menuOpen={openMenuId === timer.id}
                  onToggleMenu={() => setOpenMenuId((current) => current === timer.id ? null : timer.id)}
                  onRunChange={async (running) => {
                    await updateState(() => backend.setTimerRunning(timer.id, running))
                  }}
                  onEdit={() => {
                    setOpenMenuId(null)
                    setEditingTimer(timer)
                  }}
                  onReset={() => setResetTarget(timer)}
                  onDelete={() => {
                    setOpenMenuId(null)
                    setDeleteTarget(timer)
                  }}
                />
              </div>
            ))
          )}
        </section>

        <footer className="footer-bar">
          <span>実行中のタイマー <strong>{summary.running}</strong></span>
          <span>合計 <strong>{USD.format(summary.totalUsd)}</strong>{summary.totalJpy !== null && `（約 ${JPY.format(summary.totalJpy)}）`}</span>
          <span>為替レート更新済み <strong>{formatUpdatedAt(state.exchangeRateUpdatedAt)}</strong></span>
        </footer>
      </main>

      {editingTimer !== undefined && (
        <TimerModal
          timer={editingTimer}
          onClose={() => setEditingTimer(undefined)}
          onSubmit={async ({ name, hourlyRateUsd }) => {
            if (editingTimer) {
              await updateState(() => backend.updateTimer(editingTimer.id, name, hourlyRateUsd))
            } else {
              await updateState(() => backend.createTimer(name, hourlyRateUsd))
            }
            setEditingTimer(undefined)
          }}
        />
      )}

      {resetTarget && (
        <ConfirmModal
          title="タイマーをリセット"
          message={`「${resetTarget.name}」の経過時間と収益を0に戻します。実行中の場合は、そのまま0から計測を続けます。`}
          confirmLabel="リセット"
          onClose={() => setResetTarget(null)}
          onConfirm={async () => {
            await updateState(() => backend.resetTimer(resetTarget.id))
            setResetTarget(null)
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="タイマーを削除"
          message={`「${deleteTarget.name}」を削除します。保存されている経過時間も削除されます。`}
          confirmLabel="削除"
          danger
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await updateState(() => backend.deleteTimer(deleteTarget.id))
            setDeleteTarget(null)
          }}
        />
      )}
    </div>
  )
}

export default App
