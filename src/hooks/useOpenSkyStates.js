import { useEffect, useRef, useState } from 'react'

const POLL_INTERVAL_MS = 20000

function mapAircraftState(ac) {
  if (ac.lon == null || ac.lat == null) {
    return null
  }

  const baroAltitude = ac.alt_baro === 'ground' ? 0 : ac.alt_baro

  return {
    icao24: ac.hex,
    callsign: ac.flight?.trim() ?? '',
    longitude: ac.lon,
    latitude: ac.lat,
    baroAltitude,
    onGround: ac.alt_baro === 'ground',
    velocity: ac.gs,
    trueTrack: ac.track,
    geoAltitude: ac.alt_geom,
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

      const lat = ((bounds.getNorth() + bounds.getSouth()) / 2).toFixed(4)
      const lon = ((bounds.getEast() + bounds.getWest()) / 2).toFixed(4)
      const dist = 250 // nautical miles, max allowed is 250

      const url = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${dist}`

      try {
        const response = await fetch(url, { signal: controller.signal })

        if (!response.ok) {
          throw new Error(response.status === 429 ? 'rate-limit' : 'request-failed')
        }

        const data = await response.json()
        const nextAircraft = (data.ac ?? [])
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
