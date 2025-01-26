const express = require('express');
const { fetchHospitals } = require('../controllers/hospitalController'); // 정확한 경로로 가져오기
const { fetchHospitalsTime } = require('../controllers/hospitalTimeController')
const { getHospitalsList } = require('../controllers/hospitalListController');
const router = express.Router();

// 병원 데이터를 API에서 가져와 MongoDB에 저장
router.get('/fetch', fetchHospitals);
router.get('/details/time/fetch' , fetchHospitalsTime);

// 병원 컬렉션 목록 조회
router.get('/list', getHospitalsList);

module.exports = router;