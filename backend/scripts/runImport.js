require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { importWorkbook } = require('../utils/excelImporter');

const MONGO_URI = process.env.MONGO_URI;
const XLSX_PATH = path.join(__dirname, '..', '..', 'database.xlsx');

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');
  const buffer = fs.readFileSync(XLSX_PATH);
  const summary = await importWorkbook(buffer);
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
