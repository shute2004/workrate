import type { AppStateData, TimerRecord } from '../types'

export const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const JPY = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
})

export function elapsedSeconds(timer: TimerRecord, nowMs: number) {
  if (!timer.isRunning || timer.startedAt === null) return timer.accumulatedSeconds
  return timer.accumulatedSeconds + Math.max(0, Math.floor(nowMs / 1000) - timer.startedAt)
}

export function earnedUsd(timer: TimerRecord, nowMs: number) {
  return (elapsedSeconds(timer, nowMs) / 3600) * timer.hourlyRateUsd
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export function formatUpdatedAt(epochSeconds: number | null) {
  if (epochSeconds === null) return '未取得'
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(epochSeconds * 1000))
}

export function summarizeTimers(state: AppStateData, nowMs: number) {
  let running = 0
  let totalUsd = 0

  for (const timer of state.timers) {
    if (timer.isRunning) running += 1
    totalUsd += earnedUsd(timer, nowMs)
  }

  return {
    running,
    stopped: state.timers.length - running,
    totalUsd,
    totalJpy: state.usdJpyRate === null ? null : totalUsd * state.usdJpyRate,
  }
}
