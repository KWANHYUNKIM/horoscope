// src/models/DailyHoroscope.js

const mongoose = require('mongoose');

const DailyHoroscopeSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  sign: {
    type: String,
    required: true,
    enum: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
           'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
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

DailyHoroscopeSchema.index({ sign: 1, date: 1 });

module.exports = mongoose.model('DailyHoroscope', DailyHoroscopeSchema);
