const mongoose = require('mongoose');

/**
 * One document per packaging batch — this is what a single QR code resolves to.
 * Structured in two parts, matching Rice_Traceability_Data_Schema.docx §11 / §12.2:
 *   - full_record: everything (internal/admin use only, never sent to the public API)
 *   - consumer_view: the curated subset shown on the public QR landing page
 *
 * For an MVP this embeds nested data directly on the batch. If/when farmers or
 * plots need independent lookup (e.g. one farmer across many batches), split
 * Farmer and Plot into their own collections and reference by _id instead.
 */

const FarmerSchema = new mongoose.Schema({
  farmer_id: String,
  name: String,
  village: String,
  district: String,
  state: String,
  experience_years: Number,
  story: String,
  fpo: String,
  certification: String,
  contact_number: { type: String, select: false } // internal only — never returned in consumer_view
}, { _id: false });

const FarmSchema = new mongoose.Schema({
  area_acres: Number,
  soil_type: String,
  irrigation: String,
  organic_since: Date,
  gps_lat: { type: Number, select: false }, // internal only, per governance rules
  gps_long: { type: Number, select: false }
}, { _id: false });

const CropSchema = new mongoose.Schema({
  crop: String,
  variety: String,
  season: String,
  sowing_date: Date,
  harvest_date: Date
}, { _id: false });

const HarvestSummarySchema = new mongoose.Schema({
  yield_kg: Number,
  moisture_pct: Number,
  method: String
}, { _id: false });

const ProcessingSummarySchema = new mongoose.Schema({
  milling: String,
  grading: String,
  recovery_pct: Number
}, { _id: false });

const NutritionSchema = new mongoose.Schema({
  protein: Number,
  fiber: Number,
  iron: Number,
  calcium: Number,
  heavy_metals: String,
  pesticides: String,
  microbiology: String
}, { _id: false });

const SustainabilitySchema = new mongoose.Schema({
  basalt_erw_applied: String,
  co2_removal: String,
  water_retention: String,
  biodiversity: String
}, { _id: false });

const BatchSchema = new mongoose.Schema({
  batch_id: { type: String, required: true, unique: true, index: true },
  product_name: String,
  pack_size: String,
  pack_date: Date,
  expiry: Date,

  status: { type: String, enum: ['active', 'revoked'], default: 'active' },

  qr_code_url: String,     // the public trace URL encoded in the QR
  qr_image_path: String,   // where the generated PNG lives (or a CDN URL)

  farmer: FarmerSchema,
  farm: FarmSchema,
  crop: CropSchema,
  harvest_summary: HarvestSummarySchema,
  processing_summary: ProcessingSummarySchema,
  nutrition_and_safety: NutritionSchema,
  sustainability: SustainabilitySchema,

  // Raw/internal fields kept for the full backend record but excluded from
  // the public API response by default (see routes/batches.js)
  internal: {
    cost_data: mongoose.Schema.Types.Mixed,
    lab_report_url: String,
    dispatch: mongoose.Schema.Types.Mixed,
    activity_log: mongoose.Schema.Types.Mixed,
    inputs: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

module.exports = mongoose.model('Batch', BatchSchema);
