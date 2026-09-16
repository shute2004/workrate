import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { AppStateData } from './types'

const MOCK_STORAGE_KEY = 'workrate-dev-state-v1'

function nowSeconds() {
  return Math.floor(Date.now() / 1000)
}

function cloneState(state: AppStateData): AppStateData {
  return structuredClone(state)
}

function seedMockState(): AppStateData {
  const now = nowSeconds()
  return {
    timers: [
      {
        id: 'mock-research',
        name: 'Research',
        hourlyRateUsd: 15,
        accumulatedSeconds: 16 * 60,
        isRunning: true,
        startedAt: now,
      },
      {
        id: 'mock-coding',
        name: 'Coding Project',
        hourlyRateUsd: 30,
        accumulatedSeconds: 1 * 3600 + 23 * 60 + 41,
        isRunning: true,
        startedAt: now,
      },
      {
        id: 'mock-review',
        name: 'Review',
        hourlyRateUsd: 20,
        accumulatedSeconds: 0,
        isRunning: false,
        startedAt: null,
      },
    ],
    usdJpyRate: 155.27,
    exchangeRateUpdatedAt: now,
  }
}

function loadMockState(): AppStateData {
  const stored = localStorage.getItem(MOCK_STORAGE_KEY)
  if (!stored) {
    const seeded = seedMockState()
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  }

  try {
    return JSON.parse(stored) as AppStateData
  } catch {
    const seeded = seedMockState()
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  }
}

function saveMockState(state: AppStateData) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state))
  return cloneState(state)
}

function mockMutate(mutator: (state: AppStateData) => void): AppStateData {
  const state = loadMockState()
  mutator(state)
  return saveMockState(state)
}

export const backend = {
  isNative: isTauri(),

  async getAppState(): Promise<AppStateData> {
    if (isTauri()) return invoke<AppStateData>('get_app_state')
    return cloneState(loadMockState())
  },

  async createTimer(name: string, hourlyRateUsd: number): Promise<AppStateData> {
    if (isTauri()) {
      return invoke<AppStateData>('create_timer', { name, hourlyRateUsd })
    }

    return mockMutate((state) => {
      state.timers.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        hourlyRateUsd,
        accumulatedSeconds: 0,
        isRunning: false,
        startedAt: null,
      })
    })
  },

  async updateTimer(id: string, name: string, hourlyRateUsd: number): Promise<AppStateData> {
    if (isTauri()) {
      return invoke<AppStateData>('update_timer', { id, name, hourlyRateUsd })
    }

    return mockMutate((state) => {
      const timer = state.timers.find((item) => item.id === id)
      if (!timer) throw new Error('タイマーが見つかりません')
      timer.name = name.trim()
      timer.hourlyRateUsd = hourlyRateUsd
    })
  },

  async setTimerRunning(id: string, running: boolean): Promise<AppStateData> {
    if (isTauri()) {
      return invoke<AppStateData>('set_timer_running', { id, running })
    }

    const now = nowSeconds()
    return mockMutate((state) => {
      const timer = state.timers.find((item) => item.id === id)
      if (!timer) throw new Error('タイマーが見つかりません')

      if (!timer.isRunning && running) {
        timer.isRunning = true
        timer.startedAt = now
      } else if (timer.isRunning && !running) {
        if (timer.startedAt !== null) {
          timer.accumulatedSeconds += Math.max(0, now - timer.startedAt)
        }
        timer.isRunning = false
        timer.startedAt = null
      }
    })
  },

  async resetTimer(id: string): Promise<AppStateData> {
    if (isTauri()) return invoke<AppStateData>('reset_timer', { id })

    const now = nowSeconds()
    return mockMutate((state) => {
      const timer = state.timers.find((item) => item.id === id)
      if (!timer) throw new Error('タイマーが見つかりません')
      timer.accumulatedSeconds = 0
      timer.startedAt = timer.isRunning ? now : null
    })
  },

  async deleteTimer(id: string): Promise<AppStateData> {
    if (isTauri()) return invoke<AppStateData>('delete_timer', { id })

    return mockMutate((state) => {
      const previousLength = state.timers.length
      state.timers = state.timers.filter((item) => item.id !== id)
      if (state.timers.length === previousLength) throw new Error('タイマーが見つかりません')
    })
  },

  async refreshExchangeRate(force = true): Promise<AppStateData> {
    if (isTauri()) {
      return invoke<AppStateData>('refresh_exchange_rate', { force })
    }

    return mockMutate((state) => {
      state.exchangeRateUpdatedAt = nowSeconds()
    })
  },

  async onExchangeRateUpdated(
    callback: (state: AppStateData) => void,
  ): Promise<UnlistenFn> {
    if (!isTauri()) return () => undefined
    return listen<AppStateData>('exchange-rate-updated', (event) => callback(event.payload))
  },
}
