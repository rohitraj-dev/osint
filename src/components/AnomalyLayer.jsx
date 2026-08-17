import { CircleMarker, Popup } from 'react-leaflet';

const AnomalyLayer = ({ anomalies, aircraft, vessels, onSelectAnomaly }) => {
  return (
    <>
      {anomalies.map((anomaly, index) => {
        const isAircraft = anomaly.type === 'aircraft';
        const color = isAircraft ? 'red' : 'orange';

        // Check if this anomaly asset is flagged near a zone
        const asset = isAircraft 
          ? aircraft?.find(a => a.icao24 === anomaly.icao)
          : vessels?.find(v => v.mmsi === anomaly.mmsi);
        
        const nearZone = asset?.nearZone;

        return (
          <CircleMarker
            key={index}
            center={[anomaly.lat, anomaly.lon]}
            radius={10}
            pathOptions={{ color: color, fillColor: color, fillOpacity: 0.6 }}
            className="anomaly-pulse"
            eventHandlers={{
              click: () => onSelectAnomaly({
                ...anomaly,
                callsign: isAircraft ? (asset?.callsign || anomaly.icao) : (asset?.name || anomaly.mmsi),
                zone: asset?.zoneName || 'Unknown Zone',
                score: anomaly.anomaly_score
              })
            }}
          >
            <Popup>
              <div>
                <strong>Type:</strong> {anomaly.type}<br />
                <strong>{isAircraft ? 'ICAO:' : 'MMSI:'}</strong> {anomaly.icao || anomaly.mmsi}<br />
                <strong>Anomaly Score:</strong> {anomaly.anomaly_score}<br />
                <strong>Timestamp:</strong> {new Date(anomaly.timestamp).toLocaleString()}
                {nearZone && (
                  <div style={{ marginTop: '5px', color: 'red', fontWeight: 'bold' }}>
                    Near Sensitive Zone: {asset.zoneName} ({asset.distanceKm} km)
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};

export default AnomalyLayer;
