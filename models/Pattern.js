const mongoose = require('mongoose');

const patternSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  author: { type: String, default: 'Anonymous', trim: true, maxlength: 50 },
  grid: {
    type: [[Boolean]],
    required: true,
    validate: {
      validator: (g) => g.length === 16 && g.every((r) => r.length === 16),
      message: 'Grid must be 16×16',
    },
  },
  bpm: { type: Number, default: 120, min: 30, max: 300 },
  waveform: { type: String, default: 'triangle', enum: ['sine', 'square', 'sawtooth', 'triangle'] },
  synthConfig: {
    attack: { type: Number, default: 0.05 },
    decay: { type: Number, default: 0.2 },
    sustain: { type: Number, default: 0.3 },
    release: { type: Number, default: 0.5 },
    filterType: { type: String, default: 'lowpass' },
    filterFreq: { type: Number, default: 2000 },
    filterQ: { type: Number, default: 1 },
  },
  effects: {
    reverb: { enabled: { type: Boolean, default: false }, wet: { type: Number, default: 0.3 } },
    delay: { enabled: { type: Boolean, default: false }, wet: { type: Number, default: 0.3 }, feedback: { type: Number, default: 0.3 } },
    distortion: { enabled: { type: Boolean, default: false }, amount: { type: Number, default: 0.4 } },
    chorus: { enabled: { type: Boolean, default: false }, wet: { type: Number, default: 0.3 } },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pattern', patternSchema);
