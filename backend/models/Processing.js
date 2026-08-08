const mongoose = require('mongoose');

const ProcessingSchema = new mongoose.Schema({
  processing_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  harvest_id: { type: String, required: true, index: true },
  drying_date: Date,
  dry_moisture: Number,
  milling: String,
  sorting: String,
  grading: String,
  packing_date: Date,
  recovery_pct: Number
}, { timestamps: true });

module.exports = mongoose.model('Processing', ProcessingSchema);
