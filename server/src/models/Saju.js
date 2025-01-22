// src/models/Saju.js

const mongoose = require('mongoose');

const SajuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  birthDateTime: {
    type: Date,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  categories: {
    health: { type: String },
    career: { type: String },
    love: { type: String },
    finance: { type: String },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Saju', SajuSchema);