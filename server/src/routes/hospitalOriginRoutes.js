const express = require('express');
const router = express.Router();
const HospitalOrigin = require('../models/HospitalOrigin');
const HospitalOriginHistory = require('../models/HospitalOriginHistory');
const { authenticateToken, isAdmin } = require('./authRoutes');

// 모든 Origin 조회
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const origins = await HospitalOrigin.findAll();
    res.json(origins);
  } catch (error) {
    console.error('Origin 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 새로운 Origin 생성
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const originData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const originId = await HospitalOrigin.create(originData);
    const origin = await HospitalOrigin.findById(originId);

    // 변경 이력 기록
    await HospitalOriginHistory.create({
      origin_id: origin.id,
      action: 'CREATE',
      new_value: JSON.stringify(origin),
      changed_by: req.user.id
    });

    res.status(201).json(origin);
  } catch (error) {
    console.error('Origin 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// Origin 수정
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('Origin 수정 요청 시작 - ID:', req.params.id);
    console.log('요청 본문:', req.body);

    const origin = await HospitalOrigin.findById(req.params.id);
    if (!origin) {
      console.log('Origin을 찾을 수 없음 - ID:', req.params.id);
      return res.status(404).json({ message: 'Origin을 찾을 수 없습니다.' });
    }

    console.log('기존 Origin 데이터:', origin);

    const previousValue = JSON.stringify(origin);
    const originData = {
      ...req.body,
      updated_by: req.user.id
    };

    console.log('업데이트할 데이터:', originData);

    const success = await HospitalOrigin.update(req.params.id, originData);

    if (!success) {
      console.log('Origin 업데이트 실패');
      return res.status(500).json({ message: 'Origin 수정에 실패했습니다.' });
    }

    const updatedOrigin = await HospitalOrigin.findById(req.params.id);
    console.log('업데이트된 Origin 데이터:', updatedOrigin);

    // 변경 이력 기록
    await HospitalOriginHistory.create({
      origin_id: updatedOrigin.id,
      action: 'UPDATE',
      previous_value: previousValue,
      new_value: JSON.stringify(updatedOrigin),
      changed_by: req.user.id
    });

    res.json(updatedOrigin);
  } catch (error) {
    console.error('Origin 수정 오류:', error);
    console.error('Error Stack:', error.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// Origin 비활성화
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const origin = await HospitalOrigin.findById(req.params.id);
    if (!origin) {
      return res.status(404).json({ message: 'Origin을 찾을 수 없습니다.' });
    }

    const previousValue = JSON.stringify(origin);
    const originData = {
      is_active: false,
      updated_by: req.user.id
    };

    const success = await HospitalOrigin.update(req.params.id, originData);

    if (!success) {
      return res.status(500).json({ message: 'Origin 비활성화에 실패했습니다.' });
    }

    const updatedOrigin = await HospitalOrigin.findById(req.params.id);

    // 변경 이력 기록
    await HospitalOriginHistory.create({
      origin_id: updatedOrigin.id,
      action: 'DEACTIVATE',
      previous_value: previousValue,
      new_value: JSON.stringify(updatedOrigin),
      changed_by: req.user.id
    });

    res.json({ message: 'Origin이 비활성화되었습니다.' });
  } catch (error) {
    console.error('Origin 비활성화 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 