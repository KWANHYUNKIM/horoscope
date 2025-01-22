// src/routes/horoscope.js
const express = require('express');
const router = express.Router();
const Horoscope = require('../models/Horoscope');  // MongoDB Horoscope 모델
const predictWithPython = require('../ai/python_predict');  // Python 예측 함수
const sequelize = require('../config/database');  // PostgreSQL 연결

// 오늘 날짜의 띠별 운세 예측 및 저장 엔드포인트
router.get('/predict', async (req, res) => {
  try {
    // MongoDB에서 오늘의 띠별 운세 데이터 가져오기
    const horoscopes = await Horoscope.find();  // 필요한 경우 날짜 필터 추가 가능

    // 각 운세 데이터를 예측
    const predictions = await Promise.all(
      horoscopes.map(async (horoscope) => {
        const inputData = {
          zodiac: horoscope.zodiac,
          general_horoscope: horoscope.general_horoscope,
          specific_horoscope: horoscope.specific_horoscope
        };

        // Python AI 모델로 예측 수행
        const prediction = await predictWithPython(inputData);

        // PostgreSQL에 저장할 결과 데이터
        return {
          date: new Date().toISOString().split('T')[0],
          zodiac: horoscope.zodiac,
          prediction: prediction[0]  // 예측 결과를 첫 번째 요소로 가정
        };
      })
    );

    // PostgreSQL에 예측 결과 저장
    for (const prediction of predictions) {
      await sequelize.models.PredictedHoroscope.create(prediction);
    }

    res.json({ message: '오늘의 띠별 운세가 예측되고 PostgreSQL에 저장되었습니다.', predictions });
  } catch (err) {
    console.error('Error predicting horoscope:', err);
    res.status(500).json({ message: '예측 중 오류가 발생했습니다.' });
  }
});

module.exports = router;