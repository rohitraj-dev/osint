/**
 * Calculates distance between two points using the Haversine formula
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks proximity of assets to sensitive zones
 * @param {Array} assets Array of objects with lat and lon
 * @param {Object} zones GeoJSON FeatureCollection
 * @param {number} thresholdKm Proximity threshold in km
 * @returns {Array} Enriched assets array
 */
export function checkProximity(assets, zones, thresholdKm = 50) {
  if (!assets || !zones || !zones.features) return assets || [];

  return assets.map(asset => {
    let nearestZone = null;
    let minDistance = Infinity;

    zones.features.forEach(zone => {
      // Use the zone's first coordinate as centroid approximation
      // GeoJSON Polygon coordinates are [longitude, latitude]
      // coordinates[0] is the exterior ring, [0][0] is the first point [lon, lat]
      const firstCoord = zone.geometry.coordinates[0][0];
      const zoneLon = firstCoord[0];
      const zoneLat = firstCoord[1];
      
      const distance = haversine(asset.lat, asset.lon, zoneLat, zoneLon);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    });

    if (nearestZone && minDistance < thresholdKm) {
      return {
        ...asset,
        nearZone: true,
        zoneName: nearestZone.properties.name,
        zoneType: nearestZone.properties.type,
        zoneRisk: nearestZone.properties.risk,
        distanceKm: Number(minDistance.toFixed(1))
      };
    }

    return asset;
  });
}
