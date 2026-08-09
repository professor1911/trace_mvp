require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Farmer = require('../models/Farmer');

const PHOTOS_DIR = path.join(__dirname, '..', '..', 'netlify-site', 'farmer-photos');

/**
 * Matches netlify-site/farmer-photos/<farmer_id>.<ext> to Farmer.photo, so a
 * photo just needs to be dropped in that folder + deployed — no manual URL
 * typing in the admin form. Re-running this after adding more photos is
 * safe; it always sets photo to whatever file currently matches the ID.
 */
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const files = fs.readdirSync(PHOTOS_DIR).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  let updated = 0, missing = [];

  for (const file of files) {
    const farmerId = path.parse(file).name;
    const photoPath = `farmer-photos/${file}`;
    const farmer = await Farmer.findOne({ farmer_id: farmerId });
    if (!farmer) { missing.push(farmerId); continue; }
    farmer.photo = photoPath;
    await farmer.save();
    console.log(`${farmerId} -> ${photoPath}`);
    updated++;
  }

  console.log(`Done. Linked ${updated} photos.`);
  if (missing.length) console.log('No matching Farmer document for:', missing.join(', '));
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
