const mongoose = require('mongoose');

const SustainabilitySchema = new mongoose.Schema({
  record_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  crop_cycle_id: { type: String, required: true, index: true },
  basalt_applied: String,
  co2_removal: Number,
  water_retention: String,
  biodiversity: String,
  trees: Number,
  pollinators: Number
}, { timestamps: true });

module.exports = mongoose.model('Sustainability', SustainabilitySchema);
