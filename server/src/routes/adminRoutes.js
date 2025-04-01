const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('./authRoutes');      
const ServerConfig = require('../models/ServerConfig');
const SocialConfig = require('../models/SocialConfig');
const CorsConfig = require('../models/CorsConfig');
const User = require('../models/User');
const { Hospital } = require('../models/hospital');
const pool = require('../config/mysql');

// 모든 관리자 라우트에 인증 및 관리자 권한 검증 미들웨어 적용
router.use(authenticateToken, isAdmin);

// 대시보드 통계
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

// 서버 설정 관리
router.get('/server-configs', async (req, res) => {
  try {
    const [configs] = await pool.query('SELECT * FROM hospital_server_configs');
    res.json(configs);
  } catch (error) {
    console.error('서버 설정 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.post('/server-configs', async (req, res) => {
  try {
    const { key_name, value, environment = 'development', description, is_active = 1 } = req.body;
    await pool.query(
      `INSERT INTO hospital_server_configs 
       (key_name, value, environment, description, is_active) 
       VALUES (?, ?, ?, ?, ?)`,
      [key_name, value, environment, description, is_active]
    );
    res.status(201).json({ message: '설정이 추가되었습니다.' });
  } catch (error) {
    console.error('서버 설정 추가 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.put('/server-configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { key_name, value, environment, description, is_active } = req.body;
    await pool.query(
      `UPDATE hospital_server_configs 
       SET key_name = ?, value = ?, environment = ?, 
           description = ?, is_active = ?
       WHERE id = ?`,
      [key_name, value, environment, description, is_active, id]
    );
    res.json({ message: '설정이 수정되었습니다.' });
  } catch (error) {
    console.error('서버 설정 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.delete('/server-configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM hospital_server_configs WHERE id = ?', [id]);
    res.json({ message: '설정이 삭제되었습니다.' });
  } catch (error) {
    console.error('서버 설정 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 소셜 로그인 설정 조회
router.get('/social-configs', async (req, res) => {
  try {
    const [configs] = await pool.query('SELECT * FROM hospital_social_configs');
    res.json(configs);
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

// CORS 설정 관리
router.get('/cors-configs', async (req, res) => {
  try {
    const configs = await CorsConfig.findAll();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: 'CORS 설정을 불러오는데 실패했습니다.' });
  }
});

router.post('/cors-configs', async (req, res) => {
  try {
    const id = await CorsConfig.create(req.body);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ message: 'CORS 설정 생성에 실패했습니다.' });
  }
});

router.put('/cors-configs/:id', async (req, res) => {
  try {
    await CorsConfig.update(req.params.id, req.body);
    res.json({ message: 'CORS 설정이 업데이트되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: 'CORS 설정 업데이트에 실패했습니다.' });
  }
});

router.delete('/cors-configs/:id', async (req, res) => {
  try {
    await CorsConfig.delete(req.params.id);
    res.json({ message: 'CORS 설정이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: 'CORS 설정 삭제에 실패했습니다.' });
  }
});

module.exports = router; 