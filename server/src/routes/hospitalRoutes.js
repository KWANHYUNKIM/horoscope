const express = require('express');
const { fetchHospitals } = require('../controllers/hospitalController'); // 정확한 경로로 가져오기

const router = express.Router();

// 병원 데이터를 API에서 가져와 MongoDB에 저장
router.get('/fetch', fetchHospitals);

module.exports = router;