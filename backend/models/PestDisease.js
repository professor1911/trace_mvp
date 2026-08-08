const mongoose = require('mongoose');

const PestDiseaseSchema = new mongoose.Schema({
  inspection_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  crop_cycle_id: { type: String, required: true, index: true },
  date: Date,
  pest: String,
  disease: String,
  severity: String,
  organic_control: String,
  dose: String,
  follow_up: Date
}, { timestamps: true });

module.exports = mongoose.model('PestDisease', PestDiseaseSchema);
