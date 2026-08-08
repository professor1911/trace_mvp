/**
 * One-time import of the existing pilot data (from the original spreadsheet)
 * into MongoDB, generating a QR for each batch that doesn't already have one.
 *
 * Usage: npm run seed
 * Expects consumer_view_data.json and full_traceability_data.json in this folder
 * (copy them in from the extraction step, or point SEED_FILE at your own export).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Batch = require('./models/Batch');
const { generateQRForBatch } = require('./utils/generateQR');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rice_trace';
const SEED_FILE = path.join(__dirname, 'consumer_view_data.json');

async function run() {
  if (!fs.existsSync(SEED_FILE)) {
    console.error(`Seed file not found: ${SEED_FILE}`);
    console.error('Copy consumer_view_data.json into the backend folder first.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected for seeding');

  const records = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  let created = 0, skipped = 0;

  for (const rec of records) {
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
