const express = require('express');
const pool = require('../config/mysql');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// 카테고리 관련 라우트 (관리자 전용)
router.post('/categories', adminAuth, async (req, res) => {
  try {
    const { category_name, description, allow_comments, is_secret_default } = req.body;
    const [result] = await pool.query(
      'INSERT INTO hospital_board_categories (category_name, description, allow_comments, is_secret_default) VALUES (?, ?, ?, ?)',
      [category_name, description, allow_comments, is_secret_default]
    );
    res.status(201).json({ id: result.insertId, message: '카테고리가 생성되었습니다.' });
  } catch (error) {
    console.error('카테고리 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM hospital_board_categories');
    res.json(categories);
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.delete('/categories/:id', adminAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // 해당 카테고리에 게시글이 있는지 확인
    const [posts] = await pool.query(
      'SELECT COUNT(*) as count FROM hospital_board WHERE category_id = ?',
      [categoryId]
    );

    if (posts[0].count > 0) {
      return res.status(400).json({ message: '게시글이 있는 카테고리는 삭제할 수 없습니다.' });
    }

    await pool.query('DELETE FROM hospital_board_categories WHERE id = ?', [categoryId]);
    res.json({ message: '카테고리가 삭제되었습니다.' });
  } catch (error) {
    console.error('카테고리 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 