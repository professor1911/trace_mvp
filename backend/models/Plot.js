const mongoose = require('mongoose');

const PlotSchema = new mongoose.Schema({
  plot_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  survey_no: String,
  gps_lat: Number,
  gps_long: Number,
  area_acres: Number,
  soil_type: String,
  previous_crop: String,
  irrigation: String,
  water_source: String,
  slope: Number,
  organic_since: Date,
  map_link: String,
  centroid: {
    lat: Number,
    lng: Number
  },
  // Standard GeoJSON Polygon/MultiPolygon, populated by sync-kmz matching placemark name to plot_id.
  geo_boundary: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Plot', PlotSchema);
