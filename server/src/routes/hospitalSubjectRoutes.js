// routes/hospitalSubjectRoutes.js
const express = require('express');
const router = express.Router();
const { fetchSubjects } = require('../controllers/hospitalSubjectController');

// 과목 데이터 가져오기 라우트
router.get('/fetch', fetchSubjects);

module.exports = router;