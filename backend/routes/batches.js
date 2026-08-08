const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const { generateQRForBatch } = require('../utils/generateQR');

/**
 * PUBLIC — this is the one the frontend/QR calls. No auth. No internal fields.
 * GET /api/batches/:batchId/consumer
 */
router.get('/:batchId/consumer', async (req, res) => {
  try {
    const batch = await Batch.findOne({ batch_id: req.params.batchId, status: 'active' })
      .select('-internal -farmer.contact_number -farm.gps_lat -farm.gps_long -_id -__v');

    if (!batch) {
      // Deliberately vague — don't reveal whether the ID never existed or was revoked
      return res.status(404).json({ error: 'not_found', message: 'No active batch found for this code.' });
    }

    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * INTERNAL — full record for staff/admin tools. Protect with real auth
 * (API key, JWT, whatever your team uses) before going live — this stub only
 * checks a shared header for demo purposes.
 * GET /api/batches/:batchId/full
 */
router.get('/:batchId/full', requireAdmin, async (req, res) => {
  const batch = await Batch.findOne({ batch_id: req.params.batchId });
  if (!batch) return res.status(404).json({ error: 'not_found' });
  res.json(batch);
});

/**
 * INTERNAL — create a new batch (this is the "packaging" step).
 * Automatically generates and attaches a QR code — no separate manual step.
 * POST /api/batches
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.batch_id) {
      return res.status(400).json({ error: 'batch_id is required' });
    }

    const existing = await Batch.findOne({ batch_id: payload.batch_id });
    if (existing) {
      return res.status(409).json({ error: 'batch_id already exists' });
    }

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
 * INTERNAL — revoke a batch (mislabeled packet, recall, etc).
 * The public endpoint will then 404 for this batch_id without deleting the record.
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

/**
 * Minimal admin guard for the demo — replace with real auth before production.
 * Expects header: x-admin-key: <ADMIN_API_KEY>
 */
function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key');
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

module.exports = router;
