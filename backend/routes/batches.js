const express = require('express');
const multer = require('multer');
const router = express.Router();
const Batch = require('../models/Batch');
const { generateQRForBatch } = require('../utils/generateQR');
const { kmlStringToGeoJSON } = require('../utils/kmlParser');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * PUBLIC — this is what the QR scanner and the portal page call. No auth.
 * Returns the full three-section portal view already stored on the batch —
 * farmer_profile, farm_plots (with GPS/GeoJSON), full_disclosure.
 * The schema itself has no age/gender/mobile/banking fields, so there's
 * nothing to filter out here — the guarantee is structural, not a query-time
 * exclusion that could be forgotten on a future field.
 * GET /api/batches/:batchId/consumer
 */
router.get('/:batchId/consumer', async (req, res) => {
  try {
    const batch = await Batch.findOne({ batch_id: req.params.batchId, status: 'active' })
      .select('-_id -__v');

    if (!batch) {
      return res.status(404).json({ error: 'not_found', message: 'No active batch found for this code.' });
    }

    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * INTERNAL — full Mongo document, admin tools only.
 * GET /api/batches/:batchId/full
 */
router.get('/:batchId/full', requireAdmin, async (req, res) => {
  const batch = await Batch.findOne({ batch_id: req.params.batchId });
  if (!batch) return res.status(404).json({ error: 'not_found' });
  res.json(batch);
});

/**
 * INTERNAL — create a batch. Auto-generates its QR in the same request.
 * POST /api/batches
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.batch_id) return res.status(400).json({ error: 'batch_id is required' });

    const existing = await Batch.findOne({ batch_id: payload.batch_id });
    if (existing) return res.status(409).json({ error: 'batch_id already exists' });

    const batch = new Batch(payload);
    const { url, filePath } = await generateQRForBatch(batch.batch_id);
    batch.qr_code_url = url;
    batch.qr_image_path = filePath;

    await batch.save();
    res.status(201).json({
      message: 'Batch created and QR generated',
      batch_id: batch.batch_id,
      qr_code_url: batch.qr_code_url,
      qr_image_path: batch.qr_image_path
    });
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

/**
 * INTERNAL — upload a KML shapefile for a specific plot on a batch's farmer.
 * Multiple plots per farmer are supported — pass plot_id to target the right one.
 * POST /api/batches/:batchId/plots/:plotId/boundary
 * Body: multipart/form-data, field name "kml"
 */
router.post('/:batchId/plots/:plotId/boundary', requireAdmin, upload.single('kml'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file uploaded, expected field name "kml"' });

    const geojson = kmlStringToGeoJSON(req.file.buffer.toString('utf8'));
    const feature = geojson.features.find(f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
    if (!feature) return res.status(400).json({ error: 'no polygon/multipolygon geometry found in KML' });

    const batch = await Batch.findOne({ batch_id: req.params.batchId });
    if (!batch) return res.status(404).json({ error: 'batch not found' });

    const plot = batch.farm_plots.find(p => p.plot_id === req.params.plotId);
    if (!plot) return res.status(404).json({ error: 'plot not found on this batch' });

    plot.geo_boundary = feature.geometry;
    await batch.save();

    res.json({ message: 'Plot boundary updated', plot_id: plot.plot_id, geo_boundary: plot.geo_boundary });
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

/**
 * INTERNAL — revoke a batch.
 * PATCH /api/batches/:batchId/revoke
 */
router.patch('/:batchId/revoke', requireAdmin, async (req, res) => {
  const batch = await Batch.findOneAndUpdate(
    { batch_id: req.params.batchId },
    { status: 'revoked' },
    { new: true }
  );
  if (!batch) return res.status(404).json({ error: 'not_found' });
  res.json({ message: 'Batch revoked', batch_id: batch.batch_id });
});

function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key');
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

module.exports = router;
