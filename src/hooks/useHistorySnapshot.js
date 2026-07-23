import { useEffect, useState } from 'react'

const REQUEST_TIMEOUT_MS = 3000

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  return fetch(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId)
  })
}

function randomCoordinate(min, max) {
  return min + Math.random() * (max - min)
}

function createMockAircraft(timestamp) {
  return Array.from({ length: 10 }, (_, index) => ({
    icao24: `mock${index.toString(16).padStart(2, '0')}`,
    lat: randomCoordinate(-60, 75),
    lon: randomCoordinate(-180, 180),
    alt: Math.round(randomCoordinate(1000, 12000)),
    velocity: Math.round(randomCoordinate(180, 280)),
    track: Math.round(randomCoordinate(0, 359)),
    timestamp,
  }))
}

function createMockVessels(timestamp) {
  return Array.from({ length: 5 }, (_, index) => ({
    mmsi: `90000000${index}`,
    lat: randomCoordinate(-50, 65),
    lon: randomCoordinate(-180, 180),
    speed: Number(randomCoordinate(5, 28).toFixed(1)),
    course: Math.round(randomCoordinate(0, 359)),
    timestamp,
  }))
}

export function useHistorySnapshot(timestamp) {
  const [aircraft, setAircraft] = useState([])
  const [vessels, setVessels] = useState([])
  const [loading, setLoading] = useState(false)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    if (!timestamp) {
      setAircraft([])
      setVessels([])
      setLoading(false)
      setUsingMock(false)
      return undefined
    }

    let isActive = true

    const loadSnapshot = async () => {
      setLoading(true)

      try {
        const encodedTs = encodeURIComponent(timestamp)
        const [aircraftResponse, vesselResponse] = await Promise.all([
          fetchWithTimeout(`/api/backend/history/aircraft?ts=${encodedTs}`),
          fetchWithTimeout(`/api/backend/history/vessels?ts=${encodedTs}`),
        ])

        if (!aircraftResponse.ok || !vesselResponse.ok) {
          throw new Error('history-snapshot-failed')
        }

        const [aircraftData, vesselData] = await Promise.all([
          aircraftResponse.json(),
          vesselResponse.json(),
        ])

        if (!isActive) {
          return
        }

        setAircraft(aircraftData)
        setVessels(vesselData)
        setUsingMock(false)
      } catch {
        if (!isActive) {
          return
        }

        setAircraft(createMockAircraft(timestamp))
        setVessels(createMockVessels(timestamp))
        setUsingMock(true)
        console.warn('History API unavailable — using mock data')
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadSnapshot()

    return () => {
      isActive = false
    }
  }, [timestamp])

  return { aircraft, vessels, loading, usingMock }
}
