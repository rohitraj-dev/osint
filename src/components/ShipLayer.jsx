import { useEffect, useRef, useState } from 'react'
import { CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { useAISStream } from '../hooks/useAISStream.js'

function formatSpeed(sog) {
  return sog == null ? '—' : `${sog.toFixed(1)} kn`
}

function formatHeading(trueHeading, cog) {
  if (trueHeading != null && trueHeading !== 511) {
    return `${Math.round(trueHeading)}°`
  }

  if (cog != null) {
    return `${Math.round(cog)}°`
  }

  return '—'
}

function getVesselColor(navStatus) {
  if (navStatus === 0) {
    return '#84cc16'
  }

  if (navStatus === 1 || navStatus === 5) {
    return '#f97316'
  }

  return '#eab308'
}

function ShipBoundsTracker({ onBoundsChange }) {
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

function ShipLayer() {
  const map = useMap()
  const [bounds, setBounds] = useState(null)
  const { vessels, connected, error } = useAISStream(bounds)

  return (
    <>
      <ShipBoundsTracker onBoundsChange={setBounds} />
      {Array.from(vessels.values()).map((vessel) => {
        const color = getVesselColor(vessel.navStatus)

        return (
          <CircleMarker
            key={vessel.mmsi}
            center={[vessel.latitude, vessel.longitude]}
            radius={5}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.85,
              weight: 1,
            }}
          >
            <Tooltip>
              <div className="aircraft-tooltip">
                <div>{vessel.shipName || 'Unknown'}</div>
                <div>{vessel.mmsi}</div>
                <div>{formatSpeed(vessel.sog)}</div>
                <div>{formatHeading(vessel.trueHeading, vessel.cog)}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}
      <div className="ship-overlay">
        <div>{vessels.size} vessels</div>
        <div>{connected ? 'Connected' : 'Disconnected'}</div>
        {!bounds && vessels.size === 0 && !connected ? (
          <div>Pan or zoom to load vessels</div>
        ) : null}
        {error ? <div className="ship-overlay__error">{error}</div> : null}
      </div>
    </>
  )
}

export default ShipLayer
