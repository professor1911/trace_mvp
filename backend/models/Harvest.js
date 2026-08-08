const mongoose = require('mongoose');

const HarvestSchema = new mongoose.Schema({
  harvest_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  crop_cycle_id: { type: String, required: true, index: true },
  date: Date,
  yield_kg: Number,
  moisture: Number,
  harvest_method: String,
  storage: String,
  photos: String
}, { timestamps: true });

module.exports = mongoose.model('Harvest', HarvestSchema);
