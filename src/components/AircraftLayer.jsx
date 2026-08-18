import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { useOpenSkyStates } from '../hooks/useOpenSkyStates.js'
import { checkProximity } from '../utils/proximityCheck.js'

function formatAltitude(baroAltitude, geoAltitude) {
  const altitude = baroAltitude ?? geoAltitude

  if (altitude == null) {
    return '—'
  }

  return `${Math.round(altitude / 10) * 10} m`
}

function formatHeading(trueTrack) {
  return trueTrack == null ? '—' : `${Math.round(trueTrack)}°`
}

function formatVelocity(velocity) {
  return velocity == null ? '—' : `${Math.round(velocity * 3.6)} km/h`
}

function formatAge(lastUpdated, now) {
  if (!lastUpdated) {
    return 'Updated —'
  }

  const ageSeconds = Math.max(0, Math.floor((now - lastUpdated.getTime()) / 1000))
  return `Updated ${ageSeconds}s ago`
}

function AircraftBoundsTracker({ onBoundsChange }) {
  const timeoutRef = useRef(null)

  useMapEvents({
    moveend(event) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        onBoundsChange(event.target.getBounds())
      }, 800)
    },
  })

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return null
}

function AircraftLayer({ zones }) {
  const map = useMap()
  const [bounds, setBounds] = useState(() => map.getBounds())
  const [now, setNow] = useState(Date.now())
  const { aircraft: rawAircraft, loading, error, lastUpdated } = useOpenSkyStates()

  const aircraft = useMemo(() => {
    if (!rawAircraft || !zones) return rawAircraft
    const mapped = rawAircraft.map(a => ({ ...a, lat: a.latitude, lon: a.longitude }))
    return checkProximity(mapped, zones)
  }, [rawAircraft, zones])

  useEffect(() => {
    setBounds(map.getBounds())
  }, [map])

  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(timerId)
  }, [])

  const statusText = useMemo(() => {
    if (loading && !lastUpdated) {
      return 'Loading live aircraft...'
    }

    return formatAge(lastUpdated, now)
  }, [lastUpdated, loading, now])

  return (
    <>
      <AircraftBoundsTracker onBoundsChange={setBounds} />
      {aircraft.map((plane) => (
        <CircleMarker
          key={plane.icao24}
          center={[plane.latitude, plane.longitude]}
          radius={4}
          pathOptions={{
            color: plane.onGround ? '#94a3b8' : '#22d3ee',
            fillColor: plane.onGround ? '#94a3b8' : '#22d3ee',
            fillOpacity: 0.85,
            weight: 1,
          }}
        >
          <Tooltip>
            <div className="aircraft-tooltip">
              <div>{plane.icao24.toUpperCase()}</div>
              <div>{plane.callsign || '—'}</div>
              <div>{formatAltitude(plane.baroAltitude, plane.geoAltitude)}</div>
              <div>{formatHeading(plane.trueTrack)}</div>
              <div>{formatVelocity(plane.velocity)}</div>
              {plane.nearZone && (
                <div style={{ color: '#f87171', marginTop: '4px', fontWeight: 'bold' }}>
                  ⚠ {plane.zoneName} ({plane.distanceKm} km)
                </div>
              )}
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
      <div className="aircraft-overlay">
        <div>{aircraft.length} aircraft</div>
        <div>{statusText}</div>
        {error ? <div className="aircraft-overlay__error">{error}</div> : null}
      </div>
    </>
  )
}

export default AircraftLayer
