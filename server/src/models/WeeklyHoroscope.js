// src/models/WeeklyHoroscope.js

const mongoose = require('mongoose');

const WeeklyHoroscopeSchema = new mongoose.Schema({
  weekStartDate: {
    type: Date,
    required: true,
  },
  weekEndDate: {
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

WeeklyHoroscopeSchema.index({ sign: 1, weekStartDate: 1 });

module.exports = mongoose.model('WeeklyHoroscope', WeeklyHoroscopeSchema);