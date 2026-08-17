import { useState, useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, WMSTileLayer, ZoomControl } from 'react-leaflet'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import AircraftLayer from './AircraftLayer.jsx'
import AnomalyLayer from './AnomalyLayer.jsx'
import GeminiPanel from './GeminiPanel.jsx'
import HistoryLayer from './HistoryLayer.jsx'
import ShipLayer from './ShipLayer.jsx'
import ZoneLayer from './ZoneLayer.jsx'
import TimelineControls from './TimelineControls.jsx'
import { useOpenSkyStates } from '../hooks/useOpenSkyStates.js'
import { useAISStream } from '../hooks/useAISStream.js'
import { useHistorySnapshot } from '../hooks/useHistorySnapshot.js'
import { useHistoryData } from '../hooks/useHistoryData.js'
import { checkProximity } from '../utils/proximityCheck.js'

function MapView() {
  const [layerStates, setLayerStates] = useState({ aircraft: true, vessels: true, anomalies: true, satellite: false, zones: true })
  const [historyTs, setHistoryTs] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [geminiOpen, setGeminiOpen] = useState(false)
  const [zones, setZones] = useState(null)
  
  const [selectedAnomaly, setSelectedAnomaly] = useState(null)
  const [analysisText, setAnalysisText] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const { earliest, latest, loading, usingMock } = useHistoryData()
  const [currentTime, setCurrentTime] = useState(null)

  useEffect(() => {
    if (earliest && !currentTime) {
      setCurrentTime(new Date(earliest))
    }
  }, [earliest, currentTime])

  useEffect(() => {
    if (!isPlaying || !currentTime || !latest) return

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = new Date(prev.getTime() + 1000 * playbackSpeed)
        if (next > new Date(latest)) {
          setIsPlaying(false)
          return prev
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, latest, playbackSpeed, currentTime])

  const handleTimeChange = (newTime) => {
    setCurrentTime(newTime)
    setHistoryTs(newTime.toISOString())
  }

  useEffect(() => {
    if (currentTime) {
      setHistoryTs(currentTime.toISOString())
    }
  }, [currentTime])

  const handleToggleLayer = (layer, value) => setLayerStates(prev => ({ ...prev, [layer]: value }))
  
  // For live counts
  const { aircraft: liveAircraft } = useOpenSkyStates({ getSouth: () => -90, getWest: () => -180, getNorth: () => 90, getEast: () => 180 })
  const { vessels: liveVessels } = useAISStream({ getSouth: () => -90, getWest: () => -180, getNorth: () => 90, getEast: () => 180 })
  
  const { aircraft, vessels } = useHistorySnapshot(historyTs)

  const aircraftCount = historyTs ? aircraft.length : liveAircraft.length
  const vesselCount = historyTs ? vessels.length : (liveVessels.size || 0)

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

  const handleAnalyse = async () => {
    if (!selectedAnomaly) return;
    setIsLoading(true);
    setAnalysisText(null);

    const apiKey = import.meta.env.VITE_GEMINI_KEY;
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

    const prompt = `You are an OSINT domain awareness analyst. Analyze this anomaly: ${JSON.stringify(selectedAnomaly, null, 2)}. 
    Asset types: ${selectedAnomaly.type}, location: ${selectedAnomaly.lat}, ${selectedAnomaly.lon}.
    Provide a concise analysis including Risk Level and Recommendation.`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary available.';
      setAnalysisText(text);
    } catch (err) {
      setAnalysisText(`Failed to analyze: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch('/sensitive-zones.geojson')
      .then(res => res.json())
      .then(data => setZones(data))
      .catch(err => console.error('Error fetching zones:', err))
  }, [])

  const enrichedAircraft = useMemo(() => {
    if (!aircraft || !zones) return aircraft
    const mapped = aircraft.map(a => ({ ...a, lat: a.latitude, lon: a.longitude }))
    return checkProximity(mapped, zones)
  }, [aircraft, zones])

  const enrichedVessels = useMemo(() => {
    if (!vessels || !zones) return vessels
    const mapped = vessels.map(v => ({ ...v, lat: v.latitude, lon: v.longitude }))
    return checkProximity(mapped, zones)
  }, [vessels, zones])

  useEffect(() => {
    fetchAnomalies()
    const interval = setInterval(fetchAnomalies, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <Header
        aircraftCount={aircraftCount}
        vesselCount={vesselCount}
        anomalyCount={anomalies.length}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: '260px', minWidth: '260px', flexShrink: 0, height: '100%', overflowY: 'auto', background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
          <Sidebar 
            layerStates={layerStates}
            onToggleLayer={handleToggleLayer}
          />
        </div>
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
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
          <button
            type="button"
            onClick={() => handleToggleLayer('zones', !layerStates.zones)}
            style={{
              position: 'absolute',
              top: '100px',
              right: '10px',
              zIndex: 999,
              backgroundColor: layerStates.zones ? '#cc0000' : '#0d1117',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🔴 Zones
          </button>
          <MapContainer
            center={[20, 0]}
            zoom={2}
            scrollWheelZoom
            preferCanvas
            className="map-view"
            zoomControl={false}
            style={{ width: '100%', height: '100%' }}
          >
            <ZoomControl position="bottomleft" />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              subdomains="abcd"
              maxZoom={19}
            />
            {layerStates.satellite ? (
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
              <HistoryLayer aircraft={enrichedAircraft} vessels={enrichedVessels} />
            ) : (
              <>
                {layerStates.aircraft && <AircraftLayer zones={zones} />}
                {layerStates.vessels && <ShipLayer zones={zones} />}
                {layerStates.anomalies && (
                  <AnomalyLayer 
                    anomalies={anomalies} 
                    aircraft={enrichedAircraft} 
                    vessels={enrichedVessels} 
                    onSelectAnomaly={(a) => {
                      setSelectedAnomaly(a);
                      setGeminiOpen(true);
                    }}
                  />
                )}
                {layerStates.zones && <ZoneLayer />}
              </>
            )}
          </MapContainer>
        </div>
      </div>
      <TimelineControls 
        isLive={!usingMock}
        currentTime={currentTime}
        onTimeChange={handleTimeChange}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        playbackSpeed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        earliest={earliest}
        latest={latest}
        isLoading={loading}
      />
      <GeminiPanel
        selectedAnomaly={selectedAnomaly}
        onAnalyse={handleAnalyse}
        analysisText={analysisText}
        isLoading={isLoading}
        isOpen={geminiOpen}
        onClose={() => setGeminiOpen(false)}
      />
    </div>
  )
}

export default MapView
