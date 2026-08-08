const XLSX = require('xlsx');

const Farmer = require('../models/Farmer');
const Plot = require('../models/Plot');
const SoilHealth = require('../models/SoilHealth');
const CropCycle = require('../models/CropCycle');
const InputRegister = require('../models/InputRegister');
const ActivityLog = require('../models/ActivityLog');
const PestDisease = require('../models/PestDisease');
const Irrigation = require('../models/Irrigation');
const Monitoring = require('../models/Monitoring');
const Harvest = require('../models/Harvest');
const Processing = require('../models/Processing');
const LabTesting = require('../models/LabTesting');
const Packaging = require('../models/Packaging');
const Dispatch = require('../models/Dispatch');
const Sustainability = require('../models/Sustainability');

/**
 * Excel gives numeric IDs as floats (1001.0, 92.0). String IDs (CC-2026-92-1,
 * BATCH-2026-005, etc.) pass through unchanged. Everything downstream (Mongo
 * docs, routes, admin forms) treats *_id fields as strings.
 */
function idStr(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return String(Math.trunc(v));
  return String(v).trim();
}
function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// The sheet uses the literal text "None" as its own empty marker in several
// columns (e.g. Pest_Disease's Pest/Disease/Follow-up) — normalize it to a
// real null before mapping, otherwise it fails Date casts and pollutes text fields.
function cleanRow(raw) {
  const cleaned = {};
  for (const [k, v] of Object.entries(raw)) {
    cleaned[k] = (typeof v === 'string' && v.trim() === 'None') ? null : v;
  }
  return cleaned;
}

// One entry per sheet: which model+idField it upserts into, and how a raw
// sheet_to_json row (keyed by exact Excel header text) maps to the schema.
const SHEETS = [
  {
    sheet: 'Farmer_Master', Model: Farmer, idField: 'farmer_id',
    map: r => ({
      farmer_id: idStr(r['Farmer ID']),
      name: r['Farmer Name'], photo: r['Photo'], gender: r['Gender'], age: num(r['Age']),
      village: r['Village'], district: r['District'], state: r['State'], mobile: r['Mobile'] != null ? String(r['Mobile']) : null,
      ics_group: r['ICS Group'], fpo: r['FPO'], certification: r['Certification'],
      experience_years: num(r['Farm Experience']), story: r['Farmer Story'],
      training_attended: r['Training Attended'], bank_linked: r['Bank Linked'],
      created_by: r['Created By'], created_date: r['Created Date'] || null
    })
  },
  {
    sheet: 'Farm_Plots', Model: Plot, idField: 'plot_id',
    map: r => ({
      plot_id: idStr(r['Plot ID']), farmer_id: idStr(r['Farmer ID']), survey_no: r['Survey No'] != null ? String(r['Survey No']) : null,
      gps_lat: num(r['GPS Lat']), gps_long: num(r['GPS Long']), area_acres: num(r['Area (Ac)']),
      soil_type: r['Soil Type'], previous_crop: r['Previous Crop'], irrigation: r['Irrigation'],
      water_source: r['Water Source'], slope: num(r['Slope %']), organic_since: r['Organic Since'] || null,
      map_link: r['Map Link'],
      centroid: (num(r['GPS Lat']) != null && num(r['GPS Long']) != null) ? { lat: num(r['GPS Lat']), lng: num(r['GPS Long']) } : null
    })
  },
  {
    sheet: 'Soil_Health', Model: SoilHealth, idField: 'sample_id',
    map: r => ({
      sample_id: idStr(r['Sample ID']), plot_id: idStr(r['Plot ID']), date: r['Date'] || null,
      pH: num(r['pH']), EC: num(r['EC']), OC: num(r['OC']), CEC: num(r['CEC']),
      N: num(r['N']), P: num(r['P']), K: num(r['K']), Ca: num(r['Ca']), Mg: num(r['Mg']),
      Zn: num(r['Zn']), Fe: num(r['Fe']), Mn: num(r['Mn']), B: num(r['B']),
      bulk_density: num(r['Bulk Density']), whc: num(r['WHC']), infiltration: num(r['Infiltration']),
      lab: r['Lab']
    })
  },
  {
    sheet: 'Crop_Calendar', Model: CropCycle, idField: 'crop_cycle_id',
    map: r => ({
      crop_cycle_id: idStr(r['Crop Cycle ID']), plot_id: idStr(r['Plot ID']), crop: r['Crop'], variety: r['Variety'],
      season: r['Season'], land_prep: r['Land Prep'] || null, nursery: r['Nursery'],
      sowing: r['Sowing'] || null, weeding: r['Weeding'] || null, flowering: r['Flowering'] || null,
      harvest: r['Harvest'] || null
    })
  },
  {
    sheet: 'Input_Register', Model: InputRegister, idField: 'input_id',
    map: r => ({
      input_id: idStr(r['Input ID']), plot_id: idStr(r['Plot ID']), crop_cycle_id: idStr(r['Crop Cycle ID']),
      category: r['Category'], product: r['Product'], manufacturer: r['Manufacturer'], supplier: r['Supplier'],
      batch: r['Batch'], organic_cert: r['Organic Cert'], dose: num(r['Dose']), unit: r['Unit'],
      application_date: r['Application Date'] || null, method: r['Method'], cost: num(r['Cost']),
      invoice: r['Invoice'], operator: r['Operator'], gps: r['GPS'], remarks: r['Remarks']
    })
  },
  {
    sheet: 'Activity_Log', Model: ActivityLog, idField: 'activity_id',
    map: r => ({
      activity_id: idStr(r['Activity ID']), farmer_id: idStr(r['Farmer ID']), crop_cycle_id: idStr(r['Crop Cycle ID']),
      date: r['Date'] || null, activity: r['Activity'], description: r['Description'], machine: r['Machine'],
      labour: num(r['Labour']), hours: num(r['Hours']), fuel: r['Fuel'] != null ? String(r['Fuel']) : null,
      weather: r['Weather'], photo: r['Photo'], video: r['Video'], verified_by: r['Verified By']
    })
  },
  {
    sheet: 'Pest_Disease', Model: PestDisease, idField: 'inspection_id',
    map: r => ({
      inspection_id: idStr(r['Inspection ID']), farmer_id: idStr(r['Farmer ID']), crop_cycle_id: idStr(r['Crop Cycle ID']),
      date: r['Date'] || null, pest: r['Pest'], disease: r['Disease'], severity: r['Severity'],
      organic_control: r['Organic Control'], dose: r['Dose'] != null ? String(r['Dose']) : null,
      follow_up: r['Follow-up'] || null
    })
  },
  {
    sheet: 'Irrigation', Model: Irrigation, idField: 'record_id',
    map: r => ({
      record_id: idStr(r['Record ID']), farmer_id: idStr(r['Farmer ID']), crop_cycle_id: idStr(r['Crop Cycle ID']),
      date: r['Date'] || null, method: r['Method'], water_source: r['Water Source'], hours: num(r['Hours']),
      quantity: r['Quantity'] != null ? String(r['Quantity']) : null, rainfall: r['Rainfall'] != null ? String(r['Rainfall']) : null
    })
  },
  {
    sheet: 'Monitoring', Model: Monitoring, idField: 'monitoring_id',
    map: r => ({
      monitoring_id: idStr(r['Monitoring ID']), farmer_id: idStr(r['Farmer ID']), crop_cycle_id: idStr(r['Crop Cycle ID']),
      week: num(r['Week']), plant_height: num(r['Plant Height']), tillers: num(r['Tillers']),
      ndvi: num(r['NDVI']), spad: num(r['SPAD']), remarks: r['Remarks']
    })
  },
  {
    sheet: 'Harvest', Model: Harvest, idField: 'harvest_id',
    map: r => ({
      harvest_id: idStr(r['Harvest ID']), farmer_id: idStr(r['Farmer id']), crop_cycle_id: idStr(r['Crop Cycle ID']),
      date: r['Date'] || null, yield_kg: num(r['Yield']), moisture: num(r['Moisture']),
      harvest_method: r['Harvest Method'], storage: r['Storage'], photos: r['Photos']
    })
  },
  {
    sheet: 'Processing', Model: Processing, idField: 'processing_id',
    map: r => ({
      processing_id: idStr(r['Processing ID']), farmer_id: idStr(r['Farmer id']), harvest_id: idStr(r['Harvest ID']),
      drying_date: r['Drying'] || null, dry_moisture: num(r['Dry Moisture']), milling: r['Milling'],
      sorting: r['Sorting'], grading: r['Grading'], packing_date: r['Packing Date'] || null,
      recovery_pct: num(r['Recovery %'])
    })
  },
  {
    sheet: 'Lab_Testing', Model: LabTesting, idField: 'test_id',
    map: r => ({
      test_id: idStr(r['Test ID']), farmer_id: idStr(r['Farmer id']), batch_id: idStr(r['Batch ID']),
      protein: num(r['Protein']), fiber: num(r['Fiber']), moisture: num(r['Moisture']), ash: num(r['Ash']),
      Ca: num(r['Ca']), Mg: num(r['Mg']), Zn: num(r['Zn']), Fe: num(r['Fe']),
      heavy_metals: r['Heavy Metals'], pesticides: r['Pesticides'], microbiology: r['Microbiology'],
      lab_report: r['Lab Report']
    })
  },
  {
    sheet: 'Packaging', Model: Packaging, idField: 'batch_id',
    map: r => ({
      batch_id: idStr(r['Batch ID']), farmer_id: idStr(r['Farmer id']), sku: r['SKU'], pack_size: r['Pack Size'],
      pack_date: r['Pack Date'] || null, qr_code: r['QR Code'] != null ? String(r['QR Code']).trim() : null,
      expiry: r['Expiry'] || null, operator: r['Operator'], status: 'active'
    })
  },
  {
    sheet: 'Dispatch', Model: Dispatch, idField: 'dispatch_id',
    map: r => ({
      dispatch_id: idStr(r['Dispatch ID']), farmer_id: idStr(r['Farmer id']), batch_id: idStr(r['Batch ID']),
      buyer: r['Buyer'], destination: r['Destination'], container: r['Container'], vehicle: r['Vehicle'],
      dispatch_date: r['Dispatch Date'] || null, invoice: r['Invoice'], bl: r['BL']
    })
  },
  {
    sheet: 'Sustainability', Model: Sustainability, idField: 'record_id',
    map: r => ({
      record_id: idStr(r['Record ID']), farmer_id: idStr(r['Farmer id']), crop_cycle_id: idStr(r['Crop Cycle ID']),
      basalt_applied: r['Basalt Applied'], co2_removal: num(r['CO2 Removal']), water_retention: r['Water Retention'],
      biodiversity: r['Biodiversity'], trees: num(r['Trees']), pollinators: num(r['Pollinators'])
    })
  }
];

/**
 * Append-only sync: a row whose id already exists in the DB is left alone
 * (matches "I will only be adding new rows, never editing existing ones").
 */
async function importWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const summary = [];

  for (const { sheet, Model, idField, map } of SHEETS) {
    const ws = wb.Sheets[sheet];
    if (!ws) {
      summary.push({ sheet, created: 0, skipped: 0, error: 'sheet not found' });
      continue;
    }
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
    let created = 0, skipped = 0, invalid = 0;
    const errors = [];

    for (const raw of rows) {
      let doc;
      try {
        doc = map(cleanRow(raw));
        const idValue = doc[idField];
        if (!idValue) { invalid++; continue; }

        const existing = await Model.findOne({ [idField]: idValue });
        if (existing) { skipped++; continue; }

        await Model.create(doc);
        created++;
      } catch (err) {
        // One bad row (duplicate key, validation error) must not abort the
        // rest of this sheet or every sheet queued behind it.
        errors.push({ id: doc ? doc[idField] : null, message: err.message });
      }
    }
    summary.push({ sheet, created, skipped, invalid, errors: errors.length, errorSamples: errors.slice(0, 5) });
  }

  return summary;
}

module.exports = { importWorkbook };
