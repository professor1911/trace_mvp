const mongoose = require('mongoose');

const IrrigationSchema = new mongoose.Schema({
  record_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  crop_cycle_id: { type: String, required: true, index: true },
  date: Date,
  method: String,
  water_source: String,
  hours: Number,
  quantity: String,
  rainfall: String
}, { timestamps: true });

module.exports = mongoose.model('Irrigation', IrrigationSchema);
