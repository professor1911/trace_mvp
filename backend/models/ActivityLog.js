const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  activity_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  crop_cycle_id: { type: String, required: true, index: true },
  date: Date,
  activity: String,
  description: String,
  machine: String,
  labour: Number,
  hours: Number,
  fuel: String,
  weather: String,
  photo: String,
  video: String,
  verified_by: String
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
