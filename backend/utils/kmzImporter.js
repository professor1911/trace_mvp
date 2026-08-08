const AdmZip = require('adm-zip');
const Plot = require('../models/Plot');
const { kmlStringToGeoJSON } = require('./kmlParser');

function polygonCentroid(geometry) {
  const rings = geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map(p => p[0]);
  let sumLat = 0, sumLng = 0, count = 0;
  for (const ring of rings) {
    for (const [lng, lat] of ring) { sumLat += lat; sumLng += lng; count++; }
  }
  return count ? { lat: sumLat / count, lng: sumLng / count } : null;
}

/**
 * Each Placemark's <name> in the KMZ (e.g. "2", "92") is the plot number —
 * matches Farm_Plots' "Plot ID" column. We match on that instead of asking
 * staff to upload one KML per plot (the old admin.html flow).
 */
async function importKMZ(buffer) {
  const zip = new AdmZip(buffer);
  const kmlEntry = zip.getEntries().find(e => e.entryName.toLowerCase().endsWith('.kml'));
  if (!kmlEntry) throw new Error('no .kml file found inside the .kmz archive');

  const kmlString = zip.readAsText(kmlEntry);
  const geojson = kmlStringToGeoJSON(kmlString);

  const matched = [];
  const unmatched = [];

  for (const feature of geojson.features) {
    if (!feature.geometry || (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon')) continue;
    const plotId = (feature.properties && feature.properties.name ? String(feature.properties.name).trim() : null);
    if (!plotId) { unmatched.push({ reason: 'placemark has no name' }); continue; }

    const plot = await Plot.findOne({ plot_id: plotId });
    if (!plot) { unmatched.push({ plot_id: plotId, reason: 'no matching Plot document' }); continue; }

    plot.geo_boundary = feature.geometry;
    if (!plot.centroid || plot.centroid.lat == null) {
      plot.centroid = polygonCentroid(feature.geometry);
    }
    await plot.save();
    matched.push(plotId);
  }

  return { matched, unmatched };
}

module.exports = { importKMZ };
