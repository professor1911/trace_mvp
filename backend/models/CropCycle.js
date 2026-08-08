const mongoose = require('mongoose');

const CropCycleSchema = new mongoose.Schema({
  crop_cycle_id: { type: String, required: true, unique: true, index: true },
  plot_id: { type: String, required: true, index: true },
  crop: String,
  variety: String,
  season: String,
  land_prep: Date,
  nursery: String,
  sowing: Date,
  weeding: Date,
  flowering: Date,
  harvest: Date
}, { timestamps: true });

module.exports = mongoose.model('CropCycle', CropCycleSchema);
