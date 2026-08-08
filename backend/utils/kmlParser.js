const { DOMParser } = require('xmldom');
const togeojson = require('@tmcw/togeojson');

/**
 * Converts an uploaded KML file (as a string) into GeoJSON.
 * Accepts KML exported from Google Earth, QGIS, most GPS survey apps.
 * Returns the first Polygon/MultiPolygon feature found — if the KML has
 * multiple placemarks (e.g. one per plot), pass which index you want, or
 * loop over `features` yourself for a bulk-import script.
 */
function kmlStringToGeoJSON(kmlString) {
  const dom = new DOMParser().parseFromString(kmlString, 'text/xml');
  const geojson = togeojson.kml(dom);
  return geojson; // { type: "FeatureCollection", features: [...] }
}

module.exports = { kmlStringToGeoJSON };
