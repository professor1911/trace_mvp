const mongoose = require('mongoose');

const DispatchSchema = new mongoose.Schema({
  dispatch_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  batch_id: { type: String, required: true, index: true },
  buyer: String,
  destination: String,
  container: String,
  vehicle: String,
  dispatch_date: Date,
  invoice: String,
  bl: String
}, { timestamps: true });

module.exports = mongoose.model('Dispatch', DispatchSchema);
