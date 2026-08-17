import { useEffect, useRef, useState } from 'react'

const POLL_INTERVAL_MS = 20000

function mapAircraftState(state) {
  const longitude = state[5]
  const latitude = state[6]

  if (longitude == null || latitude == null) {
    return null
  }

  return {
    icao24: state[0],
    callsign: state[1]?.trim() ?? '',
    longitude,
    latitude,
    baroAltitude: state[7],
    onGround: Boolean(state[8]),
    velocity: state[9],
    trueTrack: state[10],
    geoAltitude: state[13],
  }
}

export function useOpenSkyStates(bounds) {
  const [aircraft, setAircraft] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!bounds) {
      setAircraft([])
      setLoading(false)
      setError(null)
      return undefined
    }

    let isActive = true

    const fetchStates = async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)

      const url =
        `https://opensky-network.org/api/states/all?lamin=${bounds.getSouth()}` +
        `&lomin=${bounds.getWest()}&lamax=${bounds.getNorth()}&lomax=${bounds.getEast()}`

      try {
        const response = await fetch(url, { signal: controller.signal })

        if (!response.ok) {
          throw new Error(response.status === 429 ? 'rate-limit' : 'request-failed')
        }

        const data = await response.json()
        const nextAircraft = (data.states ?? [])
          .map(mapAircraftState)
          .filter(Boolean)

        if (!isActive) {
          return
        }

        setAircraft(nextAircraft)
        setError(null)
        setLastUpdated(new Date())
      } catch (fetchError) {
        if (!isActive || fetchError.name === 'AbortError') {
          return
        }

        setError(
          fetchError.message === 'rate-limit'
            ? 'Anonymous daily request limit reached — zoom into a smaller area or try again later.'
            : 'Unable to load live aircraft data right now.',
        )
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    fetchStates()
    const intervalId = setInterval(fetchStates, POLL_INTERVAL_MS)

    return () => {
      isActive = false
      abortRef.current?.abort()
      clearInterval(intervalId)
    }
  }, [bounds])

  return { aircraft, loading, error, lastUpdated }
}
