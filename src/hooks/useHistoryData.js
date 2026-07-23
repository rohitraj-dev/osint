import { useEffect, useState } from 'react'

const REQUEST_TIMEOUT_MS = 3000
const HISTORY_RANGE_URL = 'http://localhost:8000/history/range'

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  return fetch(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId)
  })
}

export function useHistoryData() {
  const [earliest, setEarliest] = useState(null)
  const [latest, setLatest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    let isActive = true

    const loadHistoryRange = async () => {
      setLoading(true)

      try {
        const response = await fetchWithTimeout(HISTORY_RANGE_URL)

        if (!response.ok) {
          throw new Error('history-range-failed')
        }

        const data = await response.json()

        if (!isActive) {
          return
        }

        setEarliest(data.earliest)
        setLatest(data.latest)
        setUsingMock(false)
      } catch {
        if (!isActive) {
          return
        }

        const now = new Date()
        const fallbackEarliest = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        setEarliest(fallbackEarliest.toISOString())
        setLatest(now.toISOString())
        setUsingMock(true)
        console.warn('History API unavailable — using mock data')
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadHistoryRange()

    return () => {
      isActive = false
    }
  }, [])

  return { earliest, latest, loading, usingMock }
}
