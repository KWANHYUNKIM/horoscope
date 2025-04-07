const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('./authRoutes');
const pool = require('../config/mysql');

// 리뷰 작성
router.post('/:hospitalId/reviews', authenticateToken, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { rating, content, visitDate } = req.body;
    const userId = req.user.id;

    // 리뷰 작성
    const [result] = await pool.query(
      `INSERT INTO hospital_reviews 
       (hospital_id, user_id, hospital_type, rating, content, visit_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [hospitalId, userId, 'nursing', rating, content, visitDate]
    );

    // 이미지가 있는 경우 이미지 저장
    if (req.body.images && req.body.images.length > 0) {
      const reviewId = result.insertId;
      const imageValues = req.body.images.map(imageUrl => [reviewId, imageUrl]);
      
      await pool.query(
        `INSERT INTO hospital_review_images (review_id, image_url) VALUES ?`,
        [imageValues]
      );
    }

    res.status(201).json({ 
      message: '리뷰가 작성되었습니다.',
      reviewId: result.insertId 
    });
  } catch (error) {
    console.error('리뷰 작성 중 오류:', error);
    res.status(500).json({ message: '리뷰 작성 중 오류가 발생했습니다.' });
  }
});

// 병원별 리뷰 조회
router.get('/:hospitalId/reviews', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { page = 1, limit = 10, sort = 'latest' } = req.query;
    const offset = (page - 1) * limit;

    // 정렬 조건 설정
    let orderBy = 'r.created_at DESC';
    if (sort === 'rating') orderBy = 'r.rating DESC';
    else if (sort === 'likes') orderBy = 'like_count DESC';

    // 리뷰 데이터 조회
    const [reviews] = await pool.query(
      `SELECT 
        r.*,
        u.username,
        u.profile_image,
        COUNT(DISTINCT l.id) as like_count,
        GROUP_CONCAT(DISTINCT i.image_url) as image_urls
      FROM hospital_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN hospital_review_likes l ON r.id = l.review_id
      LEFT JOIN hospital_review_images i ON r.id = i.review_id
      WHERE r.hospital_id = ? AND r.status = 1
      GROUP BY r.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`,
      [hospitalId, parseInt(limit), offset]
    );

    // 전체 리뷰 수 조회
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT r.id) as total
       FROM hospital_reviews r
       WHERE r.hospital_id = ? AND r.status = 1`,
      [hospitalId]
    );

    // 평균 평점 조회
    const [[{ avgRating }]] = await pool.query(
      `SELECT AVG(rating) as avgRating
       FROM hospital_reviews
       WHERE hospital_id = ? AND status = 1`,
      [hospitalId]
    );

    res.json({
      reviews: reviews.map(review => ({
        ...review,
        images: review.image_urls ? review.image_urls.split(',') : [],
        image_urls: undefined
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        averageRating: avgRating || 0
      }
    });
  } catch (error) {
    console.error('리뷰 조회 중 오류:', error);
    res.status(500).json({ message: '리뷰 조회 중 오류가 발생했습니다.' });
  }
});

// 리뷰 수정
router.put('/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, content, visitDate } = req.body;
    const userId = req.user.id;

    // 리뷰 존재 여부와 작성자 확인
    const [[review]] = await pool.query(
      'SELECT * FROM hospital_reviews WHERE id = ?',
      [reviewId]
    );

    if (!review) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ message: '리뷰를 수정할 권한이 없습니다.' });
    }

    // 리뷰 수정
    await pool.query(
      `UPDATE hospital_reviews 
       SET rating = ?, content = ?, visit_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [rating, content, visitDate, reviewId]
    );

    // 이미지 처리 (기존 이미지 삭제 후 새 이미지 추가)
    if (req.body.images) {
      await pool.query('DELETE FROM hospital_review_images WHERE review_id = ?', [reviewId]);
      
      if (req.body.images.length > 0) {
        const imageValues = req.body.images.map(imageUrl => [reviewId, imageUrl]);
        await pool.query(
          `INSERT INTO hospital_review_images (review_id, image_url) VALUES ?`,
          [imageValues]
        );
      }
    }

    res.json({ message: '리뷰가 수정되었습니다.' });
  } catch (error) {
    console.error('리뷰 수정 중 오류:', error);
    res.status(500).json({ message: '리뷰 수정 중 오류가 발생했습니다.' });
  }
});

// 리뷰 삭제 (소프트 삭제)
router.delete('/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // 리뷰 존재 여부와 작성자 확인
    const [[review]] = await pool.query(
      'SELECT * FROM hospital_reviews WHERE id = ?',
      [reviewId]
    );

    if (!review) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ message: '리뷰를 삭제할 권한이 없습니다.' });
    }

    // 소프트 삭제 처리
    await pool.query(
      'UPDATE hospital_reviews SET status = 0 WHERE id = ?',
      [reviewId]
    );

    res.json({ message: '리뷰가 삭제되었습니다.' });
  } catch (error) {
    console.error('리뷰 삭제 중 오류:', error);
    res.status(500).json({ message: '리뷰 삭제 중 오류가 발생했습니다.' });
  }
});

// 리뷰 좋아요 토글
router.post('/reviews/:reviewId/like', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // 이미 좋아요를 눌렀는지 확인
    const [[existingLike]] = await pool.query(
      'SELECT * FROM hospital_review_likes WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (existingLike) {
      // 좋아요 취소
      await pool.query(
        'DELETE FROM hospital_review_likes WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
      );
      res.json({ message: '좋아요가 취소되었습니다.' });
    } else {
      // 좋아요 추가
      await pool.query(
        'INSERT INTO hospital_review_likes (review_id, user_id) VALUES (?, ?)',
        [reviewId, userId]
      );
      res.json({ message: '좋아요가 추가되었습니다.' });
    }
  } catch (error) {
    console.error('좋아요 처리 중 오류:', error);
    res.status(500).json({ message: '좋아요 처리 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 