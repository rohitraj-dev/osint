import { useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, WMSTileLayer } from 'react-leaflet'
import AircraftLayer from './AircraftLayer.jsx'
import AnomalyLayer from './AnomalyLayer.jsx'
import HistoryLayer from './HistoryLayer.jsx'
import ShipLayer from './ShipLayer.jsx'
import TimelineControls from './TimelineControls.jsx'
import { useHistorySnapshot } from '../hooks/useHistorySnapshot.js'

function MapView() {
  const [showSatellite, setShowSatellite] = useState(false)
  const [historyTs, setHistoryTs] = useState(null)
  const { aircraft, vessels } = useHistorySnapshot(historyTs)

  return (
    <div className="map-shell">
      <button
        type="button"
        className="satellite-toggle"
        onClick={() => setShowSatellite((current) => !current)}
      >
        {showSatellite ? '🛰 Satellite ✓' : '🛰 Satellite'}
      </button>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom
        preferCanvas
        className="map-view"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showSatellite ? (
          <WMSTileLayer
            attribution="Imagery courtesy NASA GIBS"
            url="https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"
            layers="MODIS_Terra_CorrectedReflectance_TrueColor"
            format="image/jpeg"
            transparent={false}
            version="1.1.1"
            crs={L.CRS.EPSG4326}
            opacity={0.75}
            zIndex={10}
          />
        ) : null}
        {historyTs ? (
          <HistoryLayer aircraft={aircraft} vessels={vessels} />
        ) : (
          <>
            <AircraftLayer />
            <ShipLayer />
            <AnomalyLayer />
          </>
        )}
      </MapContainer>
      <TimelineControls onTimestampChange={setHistoryTs} />
    </div>
  )
}

export default MapView
