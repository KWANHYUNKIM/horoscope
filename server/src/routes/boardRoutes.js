const express = require('express');
const pool = require('../config/mysql');
const { authenticateToken, isAdmin } = require('./authRoutes');      
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 이미지 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

// 이미지 업로드 엔드포인트
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 설정 가져오기
router.get('/config', async (req, res) => {
  try {
    const [configs] = await pool.query(
      'SELECT key_name, value FROM hospital_server_configs WHERE is_active = 1'
    );
    
    const config = {};
    configs.forEach(item => {
      config[item.key_name] = item.value;
    });
    
    res.json(config);
  } catch (error) {
    console.error('설정 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 게시글 목록 조회
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const categoryId = req.query.categoryId;

    let whereClause = '';
    let queryParams = [];

    if (categoryId) {
      // 선택된 카테고리의 모든 하위 카테고리 ID 조회
      const [categories] = await pool.query(`
        WITH RECURSIVE CategoryHierarchy AS (
          SELECT id, parent_id
          FROM hospital_board_categories
          WHERE id = ?
          UNION ALL
          SELECT c.id, c.parent_id
          FROM hospital_board_categories c
          INNER JOIN CategoryHierarchy ch ON c.parent_id = ch.id
        )
        SELECT id FROM CategoryHierarchy
      `, [categoryId]);

      const categoryIds = categories.map(cat => cat.id);
      categoryIds.push(categoryId); // 선택한 카테고리도 포함

      whereClause = 'WHERE b.category_id IN (?)';
      queryParams = [categoryIds];
    }

    // 전체 게시글 수 조회
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM hospital_board b ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const query = `
      SELECT 
        b.*,
        c.category_name,
        c.category_type,
        c.parent_id,
        u.username,
        u.nickname,
        (SELECT COUNT(*) FROM hospital_board_comments WHERE board_id = b.id) as comment_count
      FROM hospital_board b
      JOIN hospital_board_categories c ON b.category_id = c.id
      JOIN hospital_users u ON b.user_id = u.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [boards] = await pool.query(
      query, 
      whereClause ? [...queryParams, limit, offset] : [limit, offset]
    );
    
    // 각 게시글의 content와 additional_info 추가
    const boardsWithDetails = await Promise.all(boards.map(async (board) => {
      const [details] = await pool.query(
        'SELECT content, additional_info FROM hospital_board_details WHERE board_id = ?',
        [board.id]
      );
      return {
        ...board,
        content: details[0]?.content || '',
        additional_info: details[0]?.additional_info || ''
      };
    }));

    res.json({
      boards: boardsWithDetails,
      totalPages,
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('게시글 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카테고리 목록 조회
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM hospital_board_categories ORDER BY category_name');
    res.json(categories);
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카테고리 생성 (관리자 전용)
router.post('/categories', authenticateToken, isAdmin, async (req, res) => {
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

// 카테고리 삭제 (관리자 전용)
router.delete('/categories/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM hospital_board_categories WHERE id = ?', [id]);
    res.json({ message: '카테고리가 삭제되었습니다.' });
  } catch (error) {
    console.error('카테고리 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 게시글 조회수 증가
router.post('/:id/view', async (req, res) => {
  try {
    await pool.query(
      'UPDATE hospital_board SET view_count = view_count + 1 WHERE id = ?',
      [req.params.id]
    );
    res.json({ message: '조회수가 증가되었습니다.' });
  } catch (error) {
    console.error('조회수 증가 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 게시글 상세 조회
router.get('/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [board] = await connection.query(
      `SELECT 
        b.*,
        c.category_name,
        u.username,
        u.nickname
      FROM hospital_board b
      JOIN hospital_board_categories c ON b.category_id = c.id
      JOIN hospital_users u ON b.user_id = u.id
      WHERE b.id = ?`,
      [req.params.id]
    );

    if (board.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    const [details] = await connection.query(
      'SELECT content, additional_info FROM hospital_board_details WHERE board_id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({
      ...board[0],
      content: details[0]?.content || '',
      additional_info: details[0]?.additional_info || ''
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('게시글 상세 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 게시글 작성
router.post('/', authenticateToken, async (req, res) => {
  const { category_id, title, summary, content, additional_info } = req.body;
  const userId = req.user.id;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 카테고리 정보 조회
    const [category] = await connection.query(
      'SELECT allow_comments, is_secret_default FROM hospital_board_categories WHERE id = ?',
      [category_id]
    );

    if (category.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }

    // 게시글 기본 정보 저장
    const [result] = await connection.query(
      'INSERT INTO hospital_board (user_id, category_id, title, summary) VALUES (?, ?, ?, ?)',
      [userId, category_id, title, summary]
    );

    // 게시글 상세 정보 저장
    await connection.query(
      'INSERT INTO hospital_board_details (board_id, content, additional_info) VALUES (?, ?, ?)',
      [result.insertId, content, additional_info]
    );

    await connection.commit();
    res.status(201).json({ 
      message: '게시글이 작성되었습니다.',
      allow_comments: category[0].allow_comments,
      is_secret_default: category[0].is_secret_default
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('게시글 작성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 게시글 수정
router.put('/:id', authenticateToken, async (req, res) => {
  const { category_id, title, summary, content, additional_info } = req.body;
  const userId = req.user.id;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 게시글 작성자 확인
    const [board] = await connection.query(
      'SELECT user_id FROM hospital_board WHERE id = ?',
      [req.params.id]
    );

    if (board.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    if (board[0].user_id !== userId && req.user.role !== 'admin') {
      await connection.rollback();
      return res.status(403).json({ message: '수정 권한이 없습니다.' });
    }

    // 카테고리 정보 조회
    const [category] = await connection.query(
      'SELECT allow_comments, is_secret_default FROM hospital_board_categories WHERE id = ?',
      [category_id]
    );

    if (category.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }

    // 게시글 기본 정보 수정
    await connection.query(
      'UPDATE hospital_board SET category_id = ?, title = ?, summary = ? WHERE id = ?',
      [category_id, title, summary, req.params.id]
    );

    // 게시글 상세 정보 수정
    await connection.query(
      'UPDATE hospital_board_details SET content = ?, additional_info = ? WHERE board_id = ?',
      [content, additional_info, req.params.id]
    );

    await connection.commit();
    res.json({ 
      message: '게시글이 수정되었습니다.',
      allow_comments: category[0].allow_comments,
      is_secret_default: category[0].is_secret_default
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('게시글 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 게시글 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [board] = await pool.query(
      'SELECT user_id FROM hospital_board WHERE id = ?',
      [req.params.id]
    );

    if (board.length === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    if (board[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    await pool.query('DELETE FROM hospital_board WHERE id = ?', [req.params.id]);
    res.json({ message: '게시글이 삭제되었습니다.' });
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 댓글 목록 조회
router.get('/:id/comments', async (req, res) => {
  try {
    const [comments] = await pool.query(
      `SELECT 
        c.*,
        u.username
      FROM hospital_board_comments c
      JOIN hospital_users u ON c.user_id = u.id
      WHERE c.board_id = ?
      ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(comments);
  } catch (error) {
    console.error('댓글 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 댓글 작성
router.post('/:id/comments', authenticateToken, async (req, res) => {
  const { comment, parent_id } = req.body;
  const userId = req.user.id;

  try {
    // 게시글의 카테고리 정보 조회
    const [board] = await pool.query(
      `SELECT c.allow_comments 
       FROM hospital_board b
       JOIN hospital_board_categories c ON b.category_id = c.id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (board.length === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    if (!board[0].allow_comments) {
      return res.status(403).json({ message: '이 카테고리에서는 댓글을 작성할 수 없습니다.' });
    }

    // parent_id가 있는 경우 해당 댓글이 존재하는지 확인
    if (parent_id) {
      const [parentComment] = await pool.query(
        'SELECT id FROM hospital_board_comments WHERE id = ? AND board_id = ?',
        [parent_id, req.params.id]
      );

      if (parentComment.length === 0) {
        return res.status(404).json({ message: '부모 댓글을 찾을 수 없습니다.' });
      }
    }

    await pool.query(
      'INSERT INTO hospital_board_comments (board_id, user_id, comment, parent_id) VALUES (?, ?, ?, ?)',
      [req.params.id, userId, comment, parent_id || null]
    );
    res.status(201).json({ message: '댓글이 작성되었습니다.' });
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 댓글 삭제
router.delete('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const [comment] = await pool.query(
      'SELECT user_id FROM hospital_board_comments WHERE id = ?',
      [req.params.commentId]
    );

    if (comment.length === 0) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    if (comment[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    await pool.query(
      'DELETE FROM hospital_board_comments WHERE id = ?',
      [req.params.commentId]
    );
    res.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 댓글 수정
router.put('/:boardId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { boardId, commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    // 댓글 작성자나 관리자인지 확인
    const [commentData] = await pool.query(
      'SELECT user_id FROM hospital_board_comments WHERE id = ?',
      [commentId]
    );

    if (commentData.length === 0) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    if (commentData[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '댓글을 수정할 권한이 없습니다.' });
    }

    await pool.query(
      'UPDATE hospital_board_comments SET comment = ? WHERE id = ?',
      [comment, commentId]
    );

    // 수정된 댓글 정보 조회
    const [updatedComment] = await pool.query(
      `SELECT c.*, u.nickname, u.username 
       FROM hospital_board_comments c 
       JOIN hospital_users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [commentId]
    );

    res.json(updatedComment[0]);
  } catch (error) {
    console.error('댓글 수정 실패:', error);
    res.status(500).json({ message: '댓글 수정에 실패했습니다.' });
  }
});

// 카테고리별 게시글 목록 조회
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // 선택된 카테고리의 모든 하위 카테고리 ID 조회
    const [categories] = await pool.query(`
      WITH RECURSIVE CategoryHierarchy AS (
        SELECT id, parent_id
        FROM hospital_board_categories
        WHERE id = ?
        UNION ALL
        SELECT c.id, c.parent_id
        FROM hospital_board_categories c
        INNER JOIN CategoryHierarchy ch ON c.parent_id = ch.id
      )
      SELECT id FROM CategoryHierarchy
    `, [categoryId]);

    const categoryIds = categories.map(cat => cat.id);
    categoryIds.push(categoryId); // 선택한 카테고리도 포함

    // 카테고리별 전체 게시글 수 조회
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM hospital_board WHERE category_id IN (?)',
      [categoryIds]
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const query = `
      SELECT 
        b.*,
        c.category_name,
        c.category_type,
        c.parent_id,
        c.allow_comments,
        c.is_secret_default,
        u.username,
        u.nickname,
        (SELECT COUNT(*) FROM hospital_board_comments WHERE board_id = b.id) as comment_count
      FROM hospital_board b
      JOIN hospital_board_categories c ON b.category_id = c.id
      JOIN hospital_users u ON b.user_id = u.id
      WHERE b.category_id IN (?)
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [boards] = await pool.query(query, [categoryIds, limit, offset]);
    
    // 각 게시글의 content와 additional_info 추가
    const boardsWithDetails = await Promise.all(boards.map(async (board) => {
      const [details] = await pool.query(
        'SELECT content, additional_info FROM hospital_board_details WHERE board_id = ?',
        [board.id]
      );
      return {
        ...board,
        content: details[0]?.content || '',
        additional_info: details[0]?.additional_info || ''
      };
    }));

    res.json({
      boards: boardsWithDetails,
      totalPages,
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('카테고리별 게시글 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 관련 게시글 조회
router.get('/related/:id', async (req, res) => {
  try {
    const boardId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    // 현재 게시글의 카테고리 조회
    const [currentBoard] = await pool.query(
      'SELECT category_id FROM hospital_board WHERE id = ?',
      [boardId]
    );

    if (currentBoard.length === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 전체 게시글 수 조회
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM hospital_board WHERE category_id = ? AND id != ?',
      [currentBoard[0].category_id, boardId]
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // 같은 카테고리의 게시글 조회 (현재 게시글 제외, 페이지네이션 적용)
    const query = `
      SELECT 
        b.*,
        c.category_name,
        u.username,
        (SELECT COUNT(*) FROM hospital_board_comments WHERE board_id = b.id) as comment_count
      FROM hospital_board b
      JOIN hospital_board_categories c ON b.category_id = c.id
      JOIN hospital_users u ON b.user_id = u.id
      WHERE b.category_id = ? AND b.id != ?
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [boards] = await pool.query(query, [currentBoard[0].category_id, boardId, limit, offset]);
    
    // 각 게시글의 content 추가
    const boardsWithContent = await Promise.all(boards.map(async (board) => {
      const [details] = await pool.query(
        'SELECT content FROM hospital_board_details WHERE board_id = ?',
        [board.id]
      );
      return {
        ...board,
        content: details[0]?.content || ''
      };
    }));

    res.json({
      boards: boardsWithContent,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('관련 게시글 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 