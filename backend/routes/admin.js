const express = require('express');
const multer = require('multer');
const router = express.Router();

const requireAdmin = require('../middleware/requireAdmin');
const { makeCrudRouter } = require('../utils/crudRouter');
const { generateQRForBatch } = require('../utils/generateQR');
const { importWorkbook } = require('../utils/excelImporter');
const { importKMZ } = require('../utils/kmzImporter');

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

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

/**
 * Lets the admin login screen confirm a key before storing it in
 * sessionStorage — single shared secret, no accounts/sessions to manage.
 * POST /api/admin/login  { key }
 */
router.post('/login', (req, res) => {
  const { key } = req.body;
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  res.json({ message: 'ok' });
});

// Plain CRUD entities — same 5 handlers per sheet, generated once.
router.use('/farmers', makeCrudRouter(Farmer, 'farmer_id'));
router.use('/plots', makeCrudRouter(Plot, 'plot_id'));
router.use('/soil-health', makeCrudRouter(SoilHealth, 'sample_id'));
router.use('/crop-cycles', makeCrudRouter(CropCycle, 'crop_cycle_id'));
router.use('/inputs', makeCrudRouter(InputRegister, 'input_id'));
router.use('/activities', makeCrudRouter(ActivityLog, 'activity_id'));
router.use('/pest-disease', makeCrudRouter(PestDisease, 'inspection_id'));
router.use('/irrigation', makeCrudRouter(Irrigation, 'record_id'));
router.use('/monitoring', makeCrudRouter(Monitoring, 'monitoring_id'));
router.use('/harvest', makeCrudRouter(Harvest, 'harvest_id'));
router.use('/processing', makeCrudRouter(Processing, 'processing_id'));
router.use('/lab-testing', makeCrudRouter(LabTesting, 'test_id'));
router.use('/dispatch', makeCrudRouter(Dispatch, 'dispatch_id'));
router.use('/sustainability', makeCrudRouter(Sustainability, 'record_id'));

// Packaging: list/get/put/delete are plain CRUD, but POST auto-generates the
// QR (the "once all the info is filled in, a QR should be generated" step).
const packagingRouter = express.Router();
packagingRouter.get('/', requireAdmin, async (req, res) => {
  res.json(await Packaging.find().sort({ createdAt: -1 }).limit(1000));
});
packagingRouter.get('/:id', requireAdmin, async (req, res) => {
  const doc = await Packaging.findOne({ batch_id: req.params.id });
  if (!doc) return res.status(404).json({ error: 'not_found' });
  res.json(doc);
});
packagingRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const { batch_id, farmer_id, sku, pack_size, pack_date } = req.body;
    if (!batch_id || !farmer_id || !sku || !pack_size || !pack_date) {
      return res.status(400).json({ error: 'batch_id, farmer_id, sku, pack_size, and pack_date are required' });
    }
    if (await Packaging.findOne({ batch_id })) {
      return res.status(409).json({ error: 'batch_id already exists' });
    }

    let qrCode = req.body.qr_code && String(req.body.qr_code).trim();
    if (!qrCode) {
      const seq = (await Packaging.countDocuments()) + 1;
      const year = new Date(pack_date).getFullYear() || new Date().getFullYear();
      qrCode = `QR-${String(seq).padStart(3, '0')}-${year}`;
    }
    if (await Packaging.findOne({ qr_code: qrCode })) {
      return res.status(409).json({ error: 'qr_code already exists' });
    }

    const packaging = new Packaging({ ...req.body, qr_code: qrCode });
    const { url, filePath } = await generateQRForBatch(qrCode);
    packaging.qr_image_path = filePath;
    await packaging.save();

    res.status(201).json({ message: 'Packaging created and QR generated', batch_id, qr_code: qrCode, qr_url: url, qr_image_path: filePath });
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});
packagingRouter.put('/:id', requireAdmin, async (req, res) => {
  const doc = await Packaging.findOneAndUpdate({ batch_id: req.params.id }, req.body, { new: true, runValidators: true });
  if (!doc) return res.status(404).json({ error: 'not_found' });
  res.json(doc);
});
packagingRouter.delete('/:id', requireAdmin, async (req, res) => {
  const doc = await Packaging.findOneAndDelete({ batch_id: req.params.id });
  if (!doc) return res.status(404).json({ error: 'not_found' });
  res.json({ message: 'deleted', batch_id: req.params.id });
});
router.use('/packaging', packagingRouter);

/**
 * INTERNAL — upload the (re-exported) database.xlsx. Append-only: rows whose
 * ID already exists in the DB are left untouched, matches "I will only be
 * adding new rows, never editing existing ones".
 * POST /api/admin/sync-excel  multipart field "excel"
 */
router.post('/sync-excel', requireAdmin, upload.single('excel'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file uploaded, expected field name "excel"' });
    const summary = await importWorkbook(req.file.buffer);
    res.json({ message: 'Excel sync complete', summary });
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

/**
 * INTERNAL — upload the plot boundaries .kmz. Matches each placemark's name
 * to a Plot's plot_id, rather than one KML upload per plot.
 * POST /api/admin/sync-kmz  multipart field "kmz"
 */
router.post('/sync-kmz', requireAdmin, upload.single('kmz'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file uploaded, expected field name "kmz"' });
    const result = await importKMZ(req.file.buffer);
    res.json({ message: 'KMZ sync complete', ...result });
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;
