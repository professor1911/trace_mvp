const mongoose = require('mongoose');

const InputRegisterSchema = new mongoose.Schema({
  input_id: { type: String, required: true, unique: true, index: true },
  plot_id: { type: String, required: true, index: true },
  crop_cycle_id: { type: String, required: true, index: true },
  category: String,
  product: String,
  manufacturer: String,
  supplier: String,
  batch: String,
  organic_cert: String,
  dose: Number,
  unit: String,
  application_date: Date,
  method: String,
  cost: Number,
  invoice: String,
  operator: String,
  gps: String,
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('InputRegister', InputRegisterSchema);
