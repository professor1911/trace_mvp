/**
 * One-time import of the pilot data (extracted from the original spreadsheet)
 * into MongoDB, generating a QR for each batch that doesn't already have one.
 *
 * Usage: npm run seed
 * Expects portal_view.json in this folder (already included).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Batch = require('./models/Batch');
const { generateQRForBatch } = require('./utils/generateQR');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rice_trace';
const SEED_FILE = path.join(__dirname, 'portal_view.json');

function normalizePlotIds(record) {
  // Plot IDs come out of the spreadsheet as numbers (92.0) — normalize to
  // strings so lookups by plot_id (e.g. the KML upload route) are consistent.
  if (Array.isArray(record.farm_plots)) {
    record.farm_plots = record.farm_plots.map(p => ({
      ...p,
      plot_id: p.plot_id != null ? String(p.plot_id) : p.plot_id
    }));
  }
  return record;
}

async function run() {
  if (!fs.existsSync(SEED_FILE)) {
    console.error(`Seed file not found: ${SEED_FILE}`);
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected for seeding');

  const records = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  let created = 0, skipped = 0;

  for (const raw of records) {
    const rec = normalizePlotIds(raw);
    const existing = await Batch.findOne({ batch_id: rec.batch_id });
    if (existing) { skipped++; continue; }

    const batch = new Batch(rec);
    const { url, filePath } = await generateQRForBatch(rec.batch_id);
    batch.qr_code_url = url;
    batch.qr_image_path = filePath;
    await batch.save();
    created++;
  }

  console.log(`Seed complete: ${created} created, ${skipped} already existed.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
