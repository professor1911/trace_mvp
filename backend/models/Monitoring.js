const mongoose = require('mongoose');

const MonitoringSchema = new mongoose.Schema({
  monitoring_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  crop_cycle_id: { type: String, required: true, index: true },
  week: Number,
  plant_height: Number,
  tillers: Number,
  ndvi: Number,
  spad: Number,
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('Monitoring', MonitoringSchema);
