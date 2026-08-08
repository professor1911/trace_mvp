const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');

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

// Public farmer fields only — age, gender, mobile, bank_linked are never
// selected here, so there is nothing for this route to leak even by accident.
const FARMER_PUBLIC_FIELDS = 'farmer_id name photo village district state ics_group fpo certification experience_years story training_attended -_id';

/**
 * PUBLIC — no auth. What a scanned QR resolves to.
 * Walks Packaging -> Farmer -> Plots -> CropCycles -> {activities, inputs,
 * monitoring, pest, irrigation, sustainability, soil} -> Harvest -> Processing
 * -> LabTesting -> Dispatch, and returns one nested "field to pack" story.
 * GET /api/trace/:qrCode
 */
router.get('/:qrCode', async (req, res) => {
  try {
    const code = req.params.qrCode;
    let packaging = await Packaging.findOne({ qr_code: code, status: 'active' }).select('-_id -__v');
    // Backward-compat: codes printed before the QR-first cutover may have
    // been shared/looked-up by batch_id.
    if (!packaging) {
      packaging = await Packaging.findOne({ batch_id: code, status: 'active' }).select('-_id -__v');
    }
    if (!packaging) {
      return res.status(404).json({ error: 'not_found', message: 'No active batch found for this code.' });
    }

    const farmer = await Farmer.findOne({ farmer_id: packaging.farmer_id }).select(FARMER_PUBLIC_FIELDS);
    const plots = await Plot.find({ farmer_id: packaging.farmer_id }).select('-_id -__v');
    const plotIds = plots.map(p => p.plot_id);

    const [soilHealth, cropCycles] = await Promise.all([
      SoilHealth.find({ plot_id: { $in: plotIds } }).select('-_id -__v'),
      CropCycle.find({ plot_id: { $in: plotIds } }).select('-_id -__v')
    ]);
    const cropCycleIds = cropCycles.map(c => c.crop_cycle_id);

    const [inputs, activities, pest, irrigation, monitoring, sustainability] = await Promise.all([
      InputRegister.find({ crop_cycle_id: { $in: cropCycleIds } }).select('-_id -__v'),
      ActivityLog.find({ crop_cycle_id: { $in: cropCycleIds } }).select('-_id -__v'),
      PestDisease.find({ crop_cycle_id: { $in: cropCycleIds } }).select('-_id -__v'),
      Irrigation.find({ crop_cycle_id: { $in: cropCycleIds } }).select('-_id -__v'),
      Monitoring.find({ crop_cycle_id: { $in: cropCycleIds } }).select('-_id -__v'),
      Sustainability.find({ crop_cycle_id: { $in: cropCycleIds } }).select('-_id -__v')
    ]);

    const harvests = await Harvest.find({ crop_cycle_id: { $in: cropCycleIds } }).select('-_id -__v');
    const harvestIds = harvests.map(h => h.harvest_id);

    const [processing, labTesting, dispatch] = await Promise.all([
      Processing.find({ harvest_id: { $in: harvestIds } }).select('-_id -__v'),
      LabTesting.find({ batch_id: packaging.batch_id }).select('-_id -__v'),
      Dispatch.find({ batch_id: packaging.batch_id }).select('-_id -__v')
    ]);

    res.json({
      packaging, farmer,
      plots: plots.map(p => ({ ...p.toObject(), soil_health: soilHealth.filter(s => s.plot_id === p.plot_id) })),
      crop_cycles: cropCycles,
      inputs, activities, pest_disease: pest, irrigation, monitoring, sustainability,
      harvest: harvests, processing, lab_testing: labTesting, dispatch
    });
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

/**
 * INTERNAL — revoke a packet's QR so scans stop resolving.
 * PATCH /api/trace/:qrCode/revoke
 */
router.patch('/:qrCode/revoke', requireAdmin, async (req, res) => {
  const packaging = await Packaging.findOneAndUpdate(
    { qr_code: req.params.qrCode },
    { status: 'revoked' },
    { new: true }
  );
  if (!packaging) return res.status(404).json({ error: 'not_found' });
  res.json({ message: 'Batch revoked', qr_code: packaging.qr_code });
});

module.exports = router;
