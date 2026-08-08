const mongoose = require('mongoose');

/**
 * gender/age/mobile/bank_linked are stored for internal/admin use only.
 * No route on the public trace path ever selects or returns them —
 * same structural guarantee the old Batch.farmer_profile schema used.
 */
const FarmerSchema = new mongoose.Schema({
  farmer_id: { type: String, required: true, unique: true, index: true },
  name: String,
  photo: String,
  gender: String,
  age: Number,
  village: String,
  district: String,
  state: String,
  mobile: String,
  ics_group: String,
  fpo: String,
  certification: String,
  experience_years: Number,
  story: String,
  training_attended: String,
  bank_linked: String,
  created_by: String,
  created_date: Date
}, { timestamps: true });

module.exports = mongoose.model('Farmer', FarmerSchema);
