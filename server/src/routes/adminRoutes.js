const express = require('express');
const router = express.Router();
const pool = require('../config/mysql');
const { authenticateToken, isAdmin } = require('./authRoutes');
const { Hospital } = require('../models/hospital');

// 모든 admin 라우트에 인증 미들웨어 적용
router.use(authenticateToken, isAdmin);

// 대시보드 통계 데이터 제공
router.get('/dashboard/stats', async (req, res) => {
  try {
    // 모델 존재 여부 확인
    if (!Hospital) {
      throw new Error('필요한 모델이 로드되지 않았습니다.');
    }

    // 병원 총 문서 수
    const totalHospitals = await Hospital.find().countDocuments();

    // 병원 유형별 분포
    const hospitalsByType = await Hospital.aggregate([
      { $group: { _id: '$clCdNm', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } }
    ]);

    // 지역별 분포
    const hospitalsByRegion = await Hospital.aggregate([
      { $group: { _id: '$sidoCdNm', count: { $sum: 1 } } },
      { $project: { region: '$_id', count: 1, _id: 0 } }
    ]);

    // 최근 업데이트된 병원
    const recentUpdates = await Hospital.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('yadmNm updatedAt');

    // 빈 필드 현황
    const emptyFields = await Hospital.aggregate([
      {
        $project: {
          name: { $ifNull: ['$yadmNm', 1] },
          address: { $ifNull: ['$addr', 1] },
          phone: { $ifNull: ['$telno', 1] },
          type: { $ifNull: ['$clCdNm', 1] },
          location: { $ifNull: ['$XPos', 1] }
        }
      },
      {
        $group: {
          _id: null,
          name: { $sum: '$name' },
          address: { $sum: '$address' },
          phone: { $sum: '$phone' },
          type: { $sum: '$type' },
          location: { $sum: '$location' }
        }
      }
    ]);

    // 데이터 품질 평가
    const dataQuality = await Hospital.aggregate([
      {
        $project: {
          complete: {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$yadmNm', null] },
                  { $ne: ['$addr', null] },
                  { $ne: ['$telno', null] },
                  { $ne: ['$clCdNm', null] },
                  { $ne: ['$XPos', null] }
                ]
              },
              then: 1,
              else: 0
            }
          },
          partial: {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$yadmNm', null] },
                  { $ne: ['$addr', null] },
                  { $or: [
                    { $ne: ['$telno', null] },
                    { $ne: ['$clCdNm', null] },
                    { $ne: ['$XPos', null] }
                  ]}
                ]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          complete: { $sum: '$complete' },
          partial: { $sum: '$partial' }
        }
      }
    ]);

    // 컬렉션별 통계
    const collectionStats = {
      hospitals: {
        total: totalHospitals,
        complete: dataQuality[0]?.complete || 0,
        partial: dataQuality[0]?.partial || 0,
        incomplete: totalHospitals - (dataQuality[0]?.complete || 0) - (dataQuality[0]?.partial || 0)
      }
    };

    res.json({
      collectionStats,
      hospitalsByType: hospitalsByType.reduce((acc, curr) => {
        acc[curr.type] = curr.count;
        return acc;
      }, {}),
      hospitalsByRegion: hospitalsByRegion.reduce((acc, curr) => {
        acc[curr.region] = curr.count;
        return acc;
      }, {}),
      recentUpdates,
      emptyFields: emptyFields[0] || {}
    });
  } catch (error) {
    console.error('대시보드 통계 조회 실패:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 소셜 로그인 설정 목록 조회
router.get('/social-configs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hospital_social_configs');
    res.json(rows);
  } catch (error) {
    console.error('소셜 설정 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 소셜 로그인 설정 추가
router.post('/social-configs', async (req, res) => {
  try {
    const { provider, client_id, client_secret, redirect_uri, environment, is_active } = req.body;
    await pool.query(
      `INSERT INTO hospital_social_configs 
       (provider, client_id, client_secret, redirect_uri, environment, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [provider, client_id, client_secret, redirect_uri, environment, is_active]
    );
    res.status(201).json({ message: '설정이 추가되었습니다.' });
  } catch (error) {
    console.error('소셜 설정 추가 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 소셜 로그인 설정 수정
router.put('/social-configs/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { client_id, client_secret, redirect_uri, environment, is_active } = req.body;
    await pool.query(
      `UPDATE hospital_social_configs 
       SET client_id = ?, client_secret = ?, redirect_uri = ?, 
           environment = ?, is_active = ?
       WHERE provider = ?`,
      [client_id, client_secret, redirect_uri, environment, is_active, provider]
    );
    res.json({ message: '설정이 수정되었습니다.' });
  } catch (error) {
    console.error('소셜 설정 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 소셜 로그인 설정 삭제
router.delete('/social-configs/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    await pool.query('DELETE FROM hospital_social_configs WHERE provider = ?', [provider]);
    res.json({ message: '설정이 삭제되었습니다.' });
  } catch (error) {
    console.error('소셜 설정 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 