import { CircleMarker, Popup } from 'react-leaflet'

function HistoryLayer({ aircraft, vessels }) {
  return (
    <>
      {aircraft.map((plane) => (
        <CircleMarker
          key={`history-aircraft-${plane.icao24}-${plane.timestamp}`}
          center={[plane.lat, plane.lon]}
          radius={4}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.85,
            weight: 1,
          }}
        >
          <Popup>
            <div className="history-popup">
              <div>icao24: {plane.icao24 ?? '—'}</div>
              <div>lat: {plane.lat ?? '—'}</div>
              <div>lon: {plane.lon ?? '—'}</div>
              <div>alt: {plane.alt ?? '—'}</div>
              <div>velocity: {plane.velocity ?? '—'}</div>
              <div>track: {plane.track ?? '—'}</div>
              <div>timestamp: {plane.timestamp ?? '—'}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {vessels.map((vessel) => (
        <CircleMarker
          key={`history-vessel-${vessel.mmsi}-${vessel.timestamp}`}
          center={[vessel.lat, vessel.lon]}
          radius={5}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.85,
            weight: 1,
          }}
        >
          <Popup>
            <div className="history-popup">
              <div>mmsi: {vessel.mmsi ?? '—'}</div>
              <div>lat: {vessel.lat ?? '—'}</div>
              <div>lon: {vessel.lon ?? '—'}</div>
              <div>speed: {vessel.speed ?? '—'}</div>
              <div>course: {vessel.course ?? '—'}</div>
              <div>timestamp: {vessel.timestamp ?? '—'}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}

export default HistoryLayer
