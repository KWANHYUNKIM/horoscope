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

// 카테고리 타입 조회
router.get('/category-types', async (req, res) => {
  try {
    const [types] = await pool.query(
      'SELECT * FROM hospital_board_category_types WHERE is_active = 1 ORDER BY order_sequence'
    );
    res.json(types);
  } catch (error) {
    console.error('카테고리 타입 조회 오류:', error);
    res.status(500).json({ error: '카테고리 타입을 불러오는데 실패했습니다.' });
  }
});

// 카테고리 타입 생성
router.post('/category-types', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { type_name, type_code, description, order_sequence, is_active } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO hospital_board_category_types (type_name, type_code, description, order_sequence, is_active) VALUES (?, ?, ?, ?, ?)',
      [type_name, type_code, description, order_sequence, is_active]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: '카테고리 타입이 생성되었습니다.' 
    });
  } catch (error) {
    console.error('카테고리 타입 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카테고리 타입 수정
router.put('/category-types/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { type_name, type_code, description, order_sequence, is_active } = req.body;
    
    await pool.query(
      'UPDATE hospital_board_category_types SET type_name = ?, type_code = ?, description = ?, order_sequence = ?, is_active = ? WHERE id = ?',
      [type_name, type_code, description, order_sequence, is_active, id]
    );
    
    res.json({ message: '카테고리 타입이 수정되었습니다.' });
  } catch (error) {
    console.error('카테고리 타입 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카테고리 타입 삭제
router.delete('/category-types/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 해당 타입을 사용하는 카테고리가 있는지 확인
    const [categories] = await pool.query(
      'SELECT COUNT(*) as count FROM hospital_board_categories WHERE category_type_id = ?',
      [id]
    );
    
    if (categories[0].count > 0) {
      return res.status(400).json({ 
        message: '해당 타입을 사용하는 카테고리가 존재합니다. 먼저 카테고리를 삭제하거나 다른 타입으로 변경해주세요.' 
      });
    }
    
    await pool.query(
      'DELETE FROM hospital_board_category_types WHERE id = ?',
      [id]
    );
    
    res.json({ message: '카테고리 타입이 삭제되었습니다.' });
  } catch (error) {
    console.error('카테고리 타입 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 게시글 목록 조회
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, categoryId } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        b.*,
        c.category_name,
        c.category_type_id,
        c.parent_id,
        u.username,
        u.nickname,
        (SELECT COUNT(*) FROM hospital_board_comments WHERE board_id = b.id) as comment_count
      FROM hospital_board b
      JOIN hospital_board_categories c ON b.category_id = c.id
      JOIN hospital_users u ON b.user_id = u.id
    `;

    if (categoryId) {
      query += ` WHERE b.category_id = ?`;
    }

    query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;

    const [posts] = await pool.query(query, categoryId ? [categoryId, parseInt(limit), parseInt(offset)] : [parseInt(limit), parseInt(offset)]);
    const [total] = await pool.query('SELECT COUNT(*) as total FROM hospital_board' + (categoryId ? ' WHERE category_id = ?' : ''), categoryId ? [categoryId] : []);
    
    res.json({
      posts,
      totalPages: Math.ceil(total[0].total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('게시글 목록 조회 오류:', error);
    res.status(500).json({ message: '게시글 목록을 불러오는데 실패했습니다.' });
  }
});

// 카테고리 조회
router.get('/categories', async (req, res) => {
  try {
    const { type, parent_id } = req.query;
    let query = `
      SELECT c.* FROM hospital_board_categories c
      WHERE c.is_active = 1
    `;
    const params = [];

    if (type) {
      query += ' AND c.category_type_id = ?';
      params.push(type);
    }

    if (parent_id) {
      query += ' AND c.parent_id = ?';
      params.push(parent_id);
    } else {
      query += ' AND c.parent_id IS NULL';
    }

    query += ' ORDER BY c.order_sequence';

    const [categories] = await pool.query(query, params);
    res.json(categories);
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    res.status(500).json({ error: '카테고리를 불러오는데 실패했습니다.' });
  }
});

// 카테고리 생성 (관리자 전용)
router.post('/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { category_name, description, allow_comments, is_secret_default, parent_id, category_type_id } = req.body;
    
    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      let parentPath = '/';
      if (parent_id) {
        // 부모 카테고리의 path 조회
        const [parentCategory] = await connection.query(
          'SELECT path FROM hospital_board_categories WHERE id = ?',
          [parent_id]
        );
        if (parentCategory.length === 0) {
          throw new Error('부모 카테고리를 찾을 수 없습니다.');
        }
        parentPath = parentCategory[0].path;
      }

      // 같은 부모를 가진 카테고리 중 가장 큰 order_sequence 값 조회
      const [maxOrderResult] = await connection.query(
        'SELECT MAX(order_sequence) as max_order FROM hospital_board_categories WHERE parent_id = ?',
        [parent_id]
      );
      
      const newOrderSequence = (maxOrderResult[0].max_order || 0) + 1;
      
      // 카테고리 생성
      const [result] = await connection.query(
        'INSERT INTO hospital_board_categories (category_name, description, allow_comments, is_secret_default, parent_id, category_type_id, order_sequence) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [category_name, description, allow_comments, is_secret_default, parent_id, category_type_id, newOrderSequence]
      );

      // 생성된 카테고리의 path 설정
      const newPath = `${parentPath}${result.insertId}/`;
      await connection.query(
        'UPDATE hospital_board_categories SET path = ? WHERE id = ?',
        [newPath, result.insertId]
      );
      
      await connection.commit();
      res.status(201).json({ id: result.insertId, message: '카테고리가 생성되었습니다.' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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
        c.category_type_id,
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

// 카테고리 수정 (관리자 전용)
router.put('/categories/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description, allow_comments, is_secret_default, parent_id } = req.body;
    
    // 자기 자신을 부모로 선택할 수 없도록 검증
    if (parent_id === parseInt(id)) {
      return res.status(400).json({ message: '자기 자신을 부모로 선택할 수 없습니다.' });
    }
    
    // 부모 카테고리가 존재하는지 확인
    if (parent_id) {
      const [parentCategory] = await pool.query(
        'SELECT id FROM hospital_board_categories WHERE id = ?',
        [parent_id]
      );
      
      if (parentCategory.length === 0) {
        return res.status(404).json({ message: '부모 카테고리를 찾을 수 없습니다.' });
      }
      
      // 순환 참조 방지: 부모의 부모가 현재 카테고리인지 확인
      const [parentParent] = await pool.query(
        'SELECT parent_id FROM hospital_board_categories WHERE id = ?',
        [parent_id]
      );
      
      if (parentParent.length > 0 && parentParent[0].parent_id === parseInt(id)) {
        return res.status(400).json({ message: '순환 참조를 방지하기 위해 이 작업을 수행할 수 없습니다.' });
      }
    }
    
    await pool.query(
      'UPDATE hospital_board_categories SET category_name = ?, description = ?, allow_comments = ?, is_secret_default = ?, parent_id = ? WHERE id = ?',
      [category_name, description, allow_comments, is_secret_default, parent_id, id]
    );
    
    res.json({ message: '카테고리가 수정되었습니다.' });
  } catch (error) {
    console.error('카테고리 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카테고리 위로 이동 (관리자 전용)
router.put('/categories/:id/move-up', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 현재 카테고리 정보 조회
    const [currentCategory] = await pool.query(
      'SELECT id, parent_id, path FROM hospital_board_categories WHERE id = ?',
      [id]
    );
    
    if (currentCategory.length === 0) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }
    
    // 같은 부모를 가진 카테고리 목록 조회 (현재 카테고리 포함)
    const [siblings] = await pool.query(
      'SELECT id, order_sequence FROM hospital_board_categories WHERE parent_id = ? ORDER BY order_sequence',
      [currentCategory[0].parent_id]
    );
    
    // 현재 카테고리의 인덱스 찾기
    const currentIndex = siblings.findIndex(cat => cat.id === parseInt(id));
    
    // 현재 카테고리가 목록에 없거나 이미 최상위에 있으면 이동 불가
    if (currentIndex === -1 || currentIndex === 0) {
      return res.status(400).json({ message: '이미 최상위에 있습니다.' });
    }
    
    // 이전 카테고리와 order_sequence 교환
    const prevCategory = siblings[currentIndex - 1];
    
    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      await connection.query(
        'UPDATE hospital_board_categories SET order_sequence = ? WHERE id = ?',
        [prevCategory.order_sequence, id]
      );
      
      await connection.query(
        'UPDATE hospital_board_categories SET order_sequence = ? WHERE id = ?',
        [siblings[currentIndex].order_sequence, prevCategory.id]
      );
      
      await connection.commit();
      res.json({ message: '카테고리가 위로 이동되었습니다.' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('카테고리 이동 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카테고리 아래로 이동 (관리자 전용)
router.put('/categories/:id/move-down', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 현재 카테고리 정보 조회
    const [currentCategory] = await pool.query(
      'SELECT id, parent_id, path FROM hospital_board_categories WHERE id = ?',
      [id]
    );
    
    if (currentCategory.length === 0) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }
    
    // 같은 부모를 가진 카테고리 목록 조회 (현재 카테고리 포함)
    const [siblings] = await pool.query(
      'SELECT id, order_sequence FROM hospital_board_categories WHERE parent_id = ? ORDER BY order_sequence',
      [currentCategory[0].parent_id]
    );
    
    // 현재 카테고리의 인덱스 찾기
    const currentIndex = siblings.findIndex(cat => cat.id === parseInt(id));
    
    // 현재 카테고리가 목록에 없거나 이미 최하위에 있으면 이동 불가
    if (currentIndex === -1 || currentIndex === siblings.length - 1) {
      return res.status(400).json({ message: '이미 최하위에 있습니다.' });
    }
    
    // 다음 카테고리와 order_sequence 교환
    const nextCategory = siblings[currentIndex + 1];
    
    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      await connection.query(
        'UPDATE hospital_board_categories SET order_sequence = ? WHERE id = ?',
        [nextCategory.order_sequence, id]
      );
      
      await connection.query(
        'UPDATE hospital_board_categories SET order_sequence = ? WHERE id = ?',
        [siblings[currentIndex].order_sequence, nextCategory.id]
      );
      
      await connection.commit();
      res.json({ message: '카테고리가 아래로 이동되었습니다.' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('카테고리 이동 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 