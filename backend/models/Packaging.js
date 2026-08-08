const mongoose = require('mongoose');

/**
 * The QR anchor. One document per packet — what a scanned QR resolves to.
 * qr_code is the public lookup key (GET /api/trace/:qrCode); batch_id is
 * kept as the human-readable/internal reference and as a fallback lookup
 * for any codes printed before the QR-first cutover.
 */
const PackagingSchema = new mongoose.Schema({
  batch_id: { type: String, required: true, unique: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  sku: String,
  pack_size: String,
  pack_date: Date,
  qr_code: { type: String, required: true, unique: true, index: true },
  expiry: Date,
  operator: String,
  status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  qr_image_path: String
}, { timestamps: true });

module.exports = mongoose.model('Packaging', PackagingSchema);
