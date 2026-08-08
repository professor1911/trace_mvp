const mongoose = require('mongoose');

/**
 * One document per packaging batch — what a QR code resolves to.
 *
 * Deliberately excludes, everywhere, at the schema level: age, gender, mobile
 * number, and banking details. There is no field on this schema to even store
 * them — if that data exists upstream, it must be dropped before import, not
 * filtered at read time. That's a stronger guarantee than a route-level filter.
 */

const FarmerProfileSchema = new mongoose.Schema({
  photo_url: String,
  name: String,
  village: String,
  district: String,
  state: String,
  ics_group: String,
  fpo: String,
  certifications: [String],
  experience_years: Number,
  story: String,
  training_attended: String
}, { _id: false });

const SoilHealthSchema = new mongoose.Schema({}, { strict: false, _id: false });

const FarmPlotSchema = new mongoose.Schema({
  plot_id: String,
  survey_no: String,
  area_acres: Number,
  soil_type: String,
  previous_crop: String,
  irrigation: String,
  water_source: String,
  slope: Number,
  organic_since: Date,
  centroid: {
    lat: Number,
    lng: Number
  },
  // Standard GeoJSON Polygon/MultiPolygon, populated by the KML upload endpoint.
  geo_boundary: { type: mongoose.Schema.Types.Mixed, default: null },
  map_link: String,
  soil_health: [SoilHealthSchema]
}, { _id: false });

// Generic labeled block for "everything else" — deliberately loose-typed so
// new spreadsheet columns/entities don't require a schema migration to show up.
const DisclosureSectionSchema = new mongoose.Schema({
  title: String,
  fields: { type: mongoose.Schema.Types.Mixed },
  records: [{ type: mongoose.Schema.Types.Mixed }]
}, { _id: false });

const BatchSchema = new mongoose.Schema({
  batch_id: { type: String, required: true, unique: true, index: true },
  product_name: String,
  pack_size: String,
  pack_date: Date,
  expiry: Date,

  status: { type: String, enum: ['active', 'revoked'], default: 'active' },

  qr_code_url: String,
  qr_image_path: String,

  farmer_profile: FarmerProfileSchema,
  farm_plots: [FarmPlotSchema],
  full_disclosure: [DisclosureSectionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Batch', BatchSchema);
