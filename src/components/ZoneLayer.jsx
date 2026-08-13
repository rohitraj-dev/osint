import { useEffect, useState } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';

const ZoneLayer = () => {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    fetch('/sensitive-zones.geojson')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.features) {
          setZones(data.features);
        }
      })
      .catch((err) => console.error('Error loading zones:', err));
  }, []);

  const getStyle = (risk) => {
    if (risk === 'high') {
      return { color: '#ff4444', fillColor: '#ff4444', fillOpacity: 0.25 };
    }
    return { color: '#ff8800', fillColor: '#ff8800', fillOpacity: 0.2 };
  };

  return (
    <>
      {zones.map((zone, index) => {
        const { coordinates } = zone.geometry;
        const { name, type, risk } = zone.properties;

        // GeoJSON coordinates are [lng, lat], Leaflet Polygon expects [lat, lng]
        const leafletPositions = coordinates[0].map((coord) => [coord[1], coord[0]]);

        return (
          <Polygon
            key={index}
            positions={leafletPositions}
            pathOptions={getStyle(risk)}
          >
            <Tooltip sticky>
              <div>
                <strong>{name}</strong> ({type})
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
};

export default ZoneLayer;
