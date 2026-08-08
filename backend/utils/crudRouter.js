const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');

/**
 * One small factory instead of hand-writing the same 5 handlers per entity.
 * `idField` is the human-readable unique key each sheet uses (e.g. "farmer_id"),
 * not Mongo's _id — admin forms and cross-entity dropdowns all reference these.
 */
function makeCrudRouter(Model, idField) {
  const router = express.Router();

  router.get('/', requireAdmin, async (req, res) => {
    const docs = await Model.find().sort({ createdAt: -1 }).limit(1000);
    res.json(docs);
  });

  router.get('/:id', requireAdmin, async (req, res) => {
    const doc = await Model.findOne({ [idField]: req.params.id });
    if (!doc) return res.status(404).json({ error: 'not_found' });
    res.json(doc);
  });

  router.post('/', requireAdmin, async (req, res) => {
    try {
      const value = req.body[idField];
      if (!value) return res.status(400).json({ error: `${idField} is required` });

      const existing = await Model.findOne({ [idField]: value });
      if (existing) return res.status(409).json({ error: `${idField} already exists` });

      const doc = new Model(req.body);
      await doc.save();
      res.status(201).json(doc);
    } catch (err) {
      res.status(500).json({ error: 'server_error', detail: err.message });
    }
  });

  router.put('/:id', requireAdmin, async (req, res) => {
    try {
      const doc = await Model.findOneAndUpdate(
        { [idField]: req.params.id },
        req.body,
        { new: true, runValidators: true }
      );
      if (!doc) return res.status(404).json({ error: 'not_found' });
      res.json(doc);
    } catch (err) {
      res.status(500).json({ error: 'server_error', detail: err.message });
    }
  });

  router.delete('/:id', requireAdmin, async (req, res) => {
    const doc = await Model.findOneAndDelete({ [idField]: req.params.id });
    if (!doc) return res.status(404).json({ error: 'not_found' });
    res.json({ message: 'deleted', [idField]: req.params.id });
  });

  return router;
}

module.exports = { makeCrudRouter };
