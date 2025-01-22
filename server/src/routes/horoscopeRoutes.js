/**
 * @swagger
 * tags:
 *   name: Horoscope
 *   description: 운세 API
 */

/**
 * @swagger
 * /api/horoscope:
 *   get:
 *     summary: 모든 운세 데이터를 가져옵니다.
 *     tags: [Horoscope]
 *     responses:
 *       200:
 *         description: 성공적으로 데이터를 가져왔습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   zodiac:
 *                     type: string
 *                     example: 쥐띠
 *                   year:
 *                     type: integer
 *                     example: 1960
 *                   general_horoscope:
 *                     type: string
 *                     example: 잘못된 것이 있다면 과감하게 고치도록 하세요.
 *                   specific_horoscope:
 *                     type: string
 *                     example: 다른 사람과 함께 하는 일에서는 이득이 없어요.
 */

const express = require('express');
const router = express.Router();
const Horoscope = require('../models/Horoscope');


router.get('/', async (req, res) => {
  try {
    // 오늘 날짜 계산 (YYYY-MM-DD 형식)
    const today = new Date();
    const specificDate = today.toISOString().split('T')[0]; // 'YYYY-MM-DD' 형태 추출
    // MongoDB에서 오늘 날짜 데이터 조회
    const horoscopes = await Horoscope.find({Date : specificDate});

    // 결과 반환
    if (horoscopes.length === 0) {
      return res.status(404).json({ message: "오늘 날짜의 운세 데이터가 없습니다." });
    }

    res.json(horoscopes);
  } catch (err) {
    console.error("오류 발생: ", err.message);
    res.status(500).send("Server Error");
  }
});

router.get('/:zodiac', async (req, res) => {
  try {
    const { zodiac } = req.params;
    const horoscopes = await Horoscope.find({ zodiac }); // 특정 띠 데이터 조회
    res.json(horoscopes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
