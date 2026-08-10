import { useEffect, useState } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';

const AnomalyLayer = () => {
  const [anomalies, setAnomalies] = useState([]);

  const fetchAnomalies = async () => {
    try {
      const response = await fetch('/api/backend/anomalies');
      if (response.ok) {
        const data = await response.json();
        setAnomalies(data);
      }
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    }
  };

  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {anomalies.map((anomaly, index) => {
        const isAircraft = anomaly.type === 'aircraft';
        const color = isAircraft ? 'red' : 'orange';

        return (
          <CircleMarker
            key={index}
            center={[anomaly.lat, anomaly.lon]}
            radius={10}
            pathOptions={{ color: color, fillColor: color, fillOpacity: 0.6 }}
            className="anomaly-pulse"
          >
            <Popup>
              <div>
                <strong>Type:</strong> {anomaly.type}<br />
                <strong>{isAircraft ? 'ICAO:' : 'MMSI:'}</strong> {anomaly.icao || anomaly.mmsi}<br />
                <strong>Anomaly Score:</strong> {anomaly.anomaly_score}<br />
                <strong>Timestamp:</strong> {new Date(anomaly.timestamp).toLocaleString()}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};

export default AnomalyLayer;
