export type TimerRecord = {
  id: string
  name: string
  hourlyRateUsd: number
  accumulatedSeconds: number
  isRunning: boolean
  startedAt: number | null
}

export type AppStateData = {
  timers: TimerRecord[]
  usdJpyRate: number | null
  exchangeRateUpdatedAt: number | null
}

export type TimerDraft = {
  name: string
  hourlyRateUsd: number
}
