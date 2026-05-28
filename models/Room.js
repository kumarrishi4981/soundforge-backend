const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: [true, 'Room code is required'],
    uppercase: true,
    trim: true,
    minlength: 6,
    maxlength: 6,
  },
  name: {
    type: String,
    default: 'Untitled Room',
    trim: true,
    maxlength: [80, 'Room name cannot exceed 80 characters'],
  },
  grid: {
    type: [[Boolean]],
    default: () =>
      Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => false)),
  },
  bpm: {
    type: Number,
    default: 120,
    min: 20,
    max: 300,
  },
  waveform: {
    type: String,
    default: 'triangle',
    enum: ['sine', 'square', 'sawtooth', 'triangle'],
  },
  synthConfig: {
    type: Object,
    default: () => ({
      attack: 0.05,
      decay: 0.2,
      sustain: 0.3,
      release: 0.5,
      filterType: 'lowpass',
      filterFreq: 2000,
      filterQ: 1,
    }),
  },
  effects: {
    type: Object,
    default: () => ({
      reverb:     { enabled: false, roomSize: 0.7, wet: 0.3 },
      delay:      { enabled: false, time: 0.25, feedback: 0.3, wet: 0.3 },
      distortion: { enabled: false, amount: 0.5 },
      chorus:     { enabled: false, rate: 1.5, depth: 0.7 },
    }),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Room', roomSchema);
