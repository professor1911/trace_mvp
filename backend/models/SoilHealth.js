const mongoose = require('mongoose');

const SoilHealthSchema = new mongoose.Schema({
  sample_id: { type: String, required: true, unique: true, index: true },
  plot_id: { type: String, required: true, index: true },
  date: Date,
  pH: Number,
  EC: Number,
  OC: Number,
  CEC: Number,
  N: Number,
  P: Number,
  K: Number,
  Ca: Number,
  Mg: Number,
  Zn: Number,
  Fe: Number,
  Mn: Number,
  B: Number,
  bulk_density: Number,
  whc: Number,
  infiltration: Number,
  lab: String
}, { timestamps: true });

module.exports = mongoose.model('SoilHealth', SoilHealthSchema);
