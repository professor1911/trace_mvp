const mongoose = require('mongoose');

const LabTestingSchema = new mongoose.Schema({
  test_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  batch_id: { type: String, required: true, index: true },
  protein: Number,
  fiber: Number,
  moisture: Number,
  ash: Number,
  Ca: Number,
  Mg: Number,
  Zn: Number,
  Fe: Number,
  heavy_metals: String,
  pesticides: String,
  microbiology: String,
  lab_report: String
}, { timestamps: true });

module.exports = mongoose.model('LabTesting', LabTestingSchema);
