// src/controllers/horoscopeController.js

const HoroscopeModel = require('../models/Horoscope');
const { predict } = require('../ai/predict');
const sendMessage = require('../kafka/producer');

exports.getHoroscope = async (req, res) => {
  const sign = req.params.sign;

  try {
    // PostgreSQL에서 사용자 데이터 조회 (예시)
    // const user = await User.findOne({ where: { sign: sign } });

    // MongoDB에서 운세 데이터 조회
    const horoscope = await HoroscopeModel.findOne({ sign: sign });

    if (!horoscope) {
      return res.status(404).json({ message: '운세 데이터를 찾을 수 없습니다.' });
    }

    // AI 모델을 사용한 추천 로직 (예시)
    const aiInput = [/* 사용자 데이터 */];
    const aiPrediction = await predict(aiInput);

    // Kafka를 통해 데이터 스트리밍 (예시)
    sendMessage('horoscope_topic', { sign: sign, aiPrediction: aiPrediction });

    res.json({
      sign: sign,
      horoscope: horoscope.text,
      recommendation: aiPrediction,
    });
  } catch (err) {
    console.error('Error fetching horoscope:', err);
    res.status(500).json({ message: '서버 오류' });
  }
};