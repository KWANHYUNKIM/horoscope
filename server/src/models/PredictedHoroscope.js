// src/models/PredictedHoroscope.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PredictedHoroscope = sequelize.define('PredictedHoroscope', {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  zodiac: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prediction: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

module.exports = PredictedHoroscope;