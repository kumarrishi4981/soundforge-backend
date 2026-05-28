const express = require('express');
const Pattern = require('../models/Pattern');

const router = express.Router();

// GET / — List all patterns (newest first, max 50)
router.get('/', async (req, res, next) => {
  try {
    const patterns = await Pattern.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(patterns);
  } catch (err) {
    next(err);
  }
});

// GET /:id — Get a single pattern
router.get('/:id', async (req, res, next) => {
  try {
    const pattern = await Pattern.findById(req.params.id).lean();
    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    res.json(pattern);
  } catch (err) {
    // Handle invalid ObjectId format
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid pattern ID' });
    }
    next(err);
  }
});

// POST / — Create a new pattern
router.post('/', async (req, res, next) => {
  try {
    const { title, grid } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!grid || !Array.isArray(grid)) {
      return res.status(400).json({ error: 'Grid data is required and must be an array' });
    }

    const pattern = new Pattern(req.body);
    const saved = await pattern.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }
    next(err);
  }
});

// DELETE /:id — Delete a pattern
router.delete('/:id', async (req, res, next) => {
  try {
    const pattern = await Pattern.findByIdAndDelete(req.params.id);
    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    res.json({ message: 'Pattern deleted', id: req.params.id });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid pattern ID' });
    }
    next(err);
  }
});

module.exports = router;
