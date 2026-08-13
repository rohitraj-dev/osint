import { useState, useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, WMSTileLayer } from 'react-leaflet'
import AircraftLayer from './AircraftLayer.jsx'
import AnomalyLayer from './AnomalyLayer.jsx'
import GeminiPanel from './GeminiPanel.jsx'
import HistoryLayer from './HistoryLayer.jsx'
import ShipLayer from './ShipLayer.jsx'
import TimelineControls from './TimelineControls.jsx'
import { useHistorySnapshot } from '../hooks/useHistorySnapshot.js'

function MapView() {
  const [showSatellite, setShowSatellite] = useState(false)
  const [historyTs, setHistoryTs] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [geminiOpen, setGeminiOpen] = useState(false)
  const { aircraft, vessels } = useHistorySnapshot(historyTs)

  const fetchAnomalies = async () => {
    try {
      const response = await fetch('/api/backend/anomalies')
      if (response.ok) {
        const data = await response.json()
        setAnomalies(data)
      }
    } catch (error) {
      console.error('Error fetching anomalies:', error)
    }
  }

  useEffect(() => {
    fetchAnomalies()
    const interval = setInterval(fetchAnomalies, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="map-shell">
      <button
        type="button"
        className="satellite-toggle"
        onClick={() => setShowSatellite((current) => !current)}
      >
        {showSatellite ? '🛰 Satellite ✓' : '🛰 Satellite'}
      </button>
      <button
        type="button"
        onClick={() => setGeminiOpen(true)}
        style={{
          position: 'absolute',
          top: '60px',
          right: '10px',
          zIndex: 999,
          backgroundColor: '#0d1117',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        🛰 Analyse
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
            <AnomalyLayer anomalies={anomalies} />
          </>
        )}
      </MapContainer>
      <TimelineControls onTimestampChange={setHistoryTs} />
      <GeminiPanel
        anomalies={anomalies}
        isOpen={geminiOpen}
        onClose={() => setGeminiOpen(false)}
      />
    </div>
  )
}

export default MapView
