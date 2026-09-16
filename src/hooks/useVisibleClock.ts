import { useEffect, useState } from 'react'

export function useVisibleClock() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let timerId: number | undefined

    const syncClock = () => {
      if (timerId !== undefined) {
        window.clearInterval(timerId)
        timerId = undefined
      }

      setNow(Date.now())
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        timerId = window.setInterval(() => setNow(Date.now()), 1000)
      }
    }

    document.addEventListener('visibilitychange', syncClock)
    window.addEventListener('focus', syncClock)
    window.addEventListener('blur', syncClock)
    syncClock()

    return () => {
      if (timerId !== undefined) window.clearInterval(timerId)
      document.removeEventListener('visibilitychange', syncClock)
      window.removeEventListener('focus', syncClock)
      window.removeEventListener('blur', syncClock)
    }
  }, [])

  return now
}
