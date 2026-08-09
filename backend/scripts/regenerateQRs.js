require('dotenv').config();
const mongoose = require('mongoose');
const Packaging = require('../models/Packaging');
const { generateQRForBatch } = require('../utils/generateQR');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected. Regenerating QR codes against', process.env.FRONTEND_URL);

  const all = await Packaging.find();
  let updated = 0;
  for (const p of all) {
    const { url, filePath } = await generateQRForBatch(p.qr_code);
    p.qr_image_path = filePath;
    await p.save();
    console.log(`${p.qr_code} -> ${url}`);
    updated++;
  }

  console.log(`Done. Regenerated ${updated} QR codes.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
