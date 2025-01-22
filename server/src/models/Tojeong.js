// src/models/Tojeong.js

const mongoose = require('mongoose');

const TojeongSchema = new mongoose.Schema({
  year: {
    type: Number,
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

module.exports = mongoose.model('Tojeong', TojeongSchema);