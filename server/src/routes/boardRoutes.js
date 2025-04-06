const express = require('express');
const pool = require('../config/mysql');
const { authenticateToken, isAdmin } = require('./authRoutes');      
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');

const router = express.Router();

// Elasticsearch 클라이언트 설정
const elasticClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// 카테고리 조회
router.get('/categories', async (req, res) => {
  try {
    const { parent_id, type_id } = req.query;
    let query = `
      SELECT c.*, 
             ct.type_name, 
             ct.type_code,
             (SELECT COUNT(*) FROM hospital_board_categories WHERE parent_id = c.id) as has_children
      FROM hospital_board_categories c
      JOIN hospital_board_category_types ct ON c.category_type_id = ct.id
      WHERE c.is_active = 1
    `;
    
    const params = [];
    
    if (parent_id) {
      query += ' AND c.parent_id = ?';
      params.push(parent_id);
    } else {
      query += ' AND c.parent_id IS NULL';
    }
    
    if (type_id) {
      query += ' AND c.category_type_id = ?';
      params.push(type_id);
    }
    
    query += ' ORDER BY c.order_sequence';
    
    const [categories] = await pool.query(query, params);
    res.json(categories);
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    res.status(500).json({ error: '카테고리를 불러오는데 실패했습니다.' });
  }
});

// 카테고리 상세 조회
router.get('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [categories] = await pool.query(`
      SELECT c.*, 
             ct.type_name, 
             ct.type_code,
             (SELECT COUNT(*) FROM hospital_board_categories WHERE parent_id = c.id) as has_children
      FROM hospital_board_categories c
      JOIN hospital_board_category_types ct ON c.category_type_id = ct.id
      WHERE c.id = ? AND c.is_active = 1
    `, [id]);

    if (categories.length === 0) {
      return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    }

    res.json(categories[0]);
  } catch (error) {
    console.error('카테고리 상세 조회 오류:', error);
    res.status(500).json({ error: '카테고리를 불러오는데 실패했습니다.' });
  }
});

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

// 게시판 설정 조회
router.get('/config', async (req, res) => {
  try {
    res.json({
      EDITOR_API: process.env.EDITOR_API_KEY
    });
  } catch (error) {
    console.error('설정 조회 오류:', error);
    res.status(500).json({ error: '설정을 불러오는데 실패했습니다.' });
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

// 메타 필드 조회
router.get('/meta-fields/:categoryTypeId', async (req, res) => {
  try {
    const { categoryTypeId } = req.params;
    const [fields] = await pool.query(
      'SELECT * FROM hospital_board_meta_fields WHERE category_type_id = ? ORDER BY order_sequence',
      [categoryTypeId]
    );
    res.json(fields);
  } catch (error) {
    console.error('메타 필드 조회 오류:', error);
    res.status(500).json({ error: '메타 필드를 불러오는데 실패했습니다.' });
  }
});

// 태그 조회
router.get('/tags', async (req, res) => {
  try {
    const [tags] = await pool.query('SELECT * FROM hospital_board_tags');
    res.json(tags);
  } catch (error) {
    console.error('태그 조회 오류:', error);
    res.status(500).json({ error: '태그를 불러오는데 실패했습니다.' });
  }
});

// 파일 업로드
router.post('/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }

    const fileUrls = await Promise.all(req.files.map(async (file) => {
      const [result] = await pool.query(
        'INSERT INTO hospital_board_attachments (file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?)',
        [file.originalname, file.path, file.size, file.mimetype]
      );
      return {
        id: result.insertId,
        url: file.path,
        name: file.originalname
      };
    }));

    res.json(fileUrls);
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    res.status(500).json({ error: '파일 업로드에 실패했습니다.' });
  }
});

// 게시글 작성
router.post('/', authenticateToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { title, content, category_id, meta_data, tags, attachments } = req.body;
    const userId = req.user.id;

    // 게시글 기본 정보 저장
    const [boardResult] = await conn.query(
      'INSERT INTO hospital_board (user_id, category_id, title) VALUES (?, ?, ?)',
      [userId, category_id, title]
    );
    const boardId = boardResult.insertId;

    // 게시글 상세 정보 저장
    let parsedMetaData;
    try {
      parsedMetaData = typeof meta_data === 'string' ? JSON.parse(meta_data) : meta_data;
    } catch (error) {
      console.error('메타 데이터 파싱 오류:', error);
      parsedMetaData = {};
    }

    await conn.query(
      'INSERT INTO hospital_board_details (board_id, content, meta_data) VALUES (?, ?, ?)',
      [boardId, content, JSON.stringify(parsedMetaData)]
    );

    // 태그 연결
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tagId => [boardId, tagId]);
      await conn.query(
        'INSERT INTO hospital_board_post_tags (board_id, tag_id) VALUES ?',
        [tagValues]
      );
    }

    // 첨부파일 연결
    if (attachments && attachments.length > 0) {
      const attachmentValues = attachments.map(attachment => [
        boardId,
        attachment.name,
        attachment.url,
        attachment.size || 0,
        attachment.type || 'application/octet-stream'
      ]);
      await conn.query(
        'INSERT INTO hospital_board_attachments (board_id, file_name, file_path, file_size, mime_type) VALUES ?',
        [attachmentValues]
      );
    }

    await conn.commit();
    res.json({ id: boardId });
  } catch (error) {
    await conn.rollback();
    console.error('게시글 작성 오류:', error);
    res.status(500).json({ error: '게시글 작성에 실패했습니다.' });
  } finally {
    conn.release();
  }
});

// 게시글 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 게시글 기본 정보 조회
    const [boards] = await pool.query(`
      SELECT 
        b.*, 
        u.username as author_name,
        c.category_name
      FROM hospital_board b
      LEFT JOIN hospital_users u ON b.user_id = u.id
      LEFT JOIN hospital_board_categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [id]);

    if (boards.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    const board = boards[0];

    // 게시글 상세 정보 조회
    const [details] = await pool.query(
      'SELECT content, meta_data FROM hospital_board_details WHERE board_id = ?',
      [id]
    );

    // 태그 조회
    const [tags] = await pool.query(`
      SELECT t.* 
      FROM hospital_board_tags t
      JOIN hospital_board_post_tags pt ON t.id = pt.tag_id
      WHERE pt.board_id = ?
    `, [id]);

    // 첨부파일 조회
    const [attachments] = await pool.query(
      'SELECT * FROM hospital_board_attachments WHERE board_id = ?',
      [id]
    );

    // 조회수 증가
    await pool.query(
      'UPDATE hospital_board SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    res.json({
      ...board,
      content: details[0]?.content || '',
      meta_data: details[0]?.meta_data || {},
      tags,
      attachments
    });
  } catch (error) {
    console.error('게시글 조회 오류:', error);
    res.status(500).json({ error: '게시글을 불러오는데 실패했습니다.' });
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
        u.username as author_name,
        u.nickname,
        (SELECT COUNT(*) FROM hospital_board_comments WHERE board_id = b.id) as comment_count
      FROM hospital_board b
      JOIN hospital_board_categories c ON b.category_id = c.id
      JOIN hospital_users u ON b.user_id = u.id
    `;

    let countQuery = 'SELECT COUNT(*) as total FROM hospital_board b';
    let params = [];
    let countParams = [];

    if (categoryId) {
      query += ` WHERE b.category_id = ?`;
      countQuery += ` WHERE b.category_id = ?`;
      params.push(categoryId);
      countParams.push(categoryId);
    }

    query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [posts] = await pool.query(query, params);
    const [total] = await pool.query(countQuery, countParams);
    
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

// 카테고리 생성 (관리자 전용)
router.post('/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { category_name, description, allow_comments, is_secret_default, parent_id, category_type_id } = req.body;
    
    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 같은 부모를 가진 카테고리 중 가장 큰 order_sequence 값 조회
      const [maxOrderResult] = await connection.query(
        'SELECT MAX(order_sequence) as max_order FROM hospital_board_categories WHERE parent_id = ?',
        [parent_id]
      );
      
      const newOrderSequence = (maxOrderResult[0].max_order || 0) + 1;
      
      // 카테고리 생성
      const [result] = await connection.query(
        'INSERT INTO hospital_board_categories (category_name, description, allow_comments, is_secret_default, parent_id, category_type_id, order_sequence, path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [category_name, description, allow_comments, is_secret_default, parent_id, category_type_id, newOrderSequence, '/']
      );

      // 생성된 카테고리의 path 설정
      let newPath = '/';
      if (parent_id) {
        // 부모 카테고리의 path 조회
        const [parentCategory] = await connection.query(
          'SELECT path FROM hospital_board_categories WHERE id = ?',
          [parent_id]
        );
        if (parentCategory.length > 0) {
          newPath = parentCategory[0].path;
        }
      }
      newPath += `${result.insertId}/`;

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
router.get('/:boardId/comments', async (req, res) => {
  const { boardId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const conn = await pool.getConnection();
    try {
      // 댓글과 작성자 정보 조회
      const [comments] = await conn.query(`
        SELECT 
          c.*,
          u.username,
          u.nickname,
          u.profile_image as author_profile_image,
          GROUP_CONCAT(DISTINCT et.entity_id) as hospital_ids,
          GROUP_CONCAT(DISTINCT et.id) as entity_tag_ids,
          GROUP_CONCAT(DISTINCT tt.type_name) as entity_tag_types
        FROM hospital_board_comments c
        LEFT JOIN hospital_users u ON c.user_id = u.id
        LEFT JOIN hospital_comment_entity_tags cet ON c.id = cet.comment_id
        LEFT JOIN hospital_entity_tags et ON cet.entity_tag_id = et.id
        LEFT JOIN hospital_tag_types tt ON et.tag_type_id = tt.id
        WHERE c.board_id = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `, [boardId, parseInt(limit), parseInt(offset)]);

      // 병원 정보 조회
      const hospitalIds = comments
        .map(comment => comment.hospital_ids)
        .filter(Boolean)
        .join(',')
        .split(',')
        .filter(Boolean);

      let hospitals = [];
      if (hospitalIds.length > 0) {
        try {
          const { body } = await elasticClient.search({
            index: 'hospitals',
            body: {
              query: {
                terms: {
                  ykiho: hospitalIds
                }
              }
            }
          });

          if (body && body.hits && body.hits.hits) {
            hospitals = body.hits.hits.map(hit => ({
              id: hit._source.ykiho,
              name: hit._source.yadmnm,
              address: hit._source.addr
            }));
          }
        } catch (elasticError) {
          console.error('Elasticsearch 조회 오류:', elasticError);
          // Elasticsearch 오류가 발생해도 계속 진행
        }
      }

      // 댓글에 병원 정보와 엔티티 태그 정보 매핑
      const commentsWithDetails = comments.map(comment => {
        const commentHospitalIds = comment.hospital_ids ? comment.hospital_ids.split(',') : [];
        const commentHospitals = hospitals.filter(hospital => 
          commentHospitalIds.includes(hospital.id)
        );

        // 엔티티 태그 정보 구성
        const entityTags = comment.entity_tag_ids ? 
          comment.entity_tag_ids.split(',').map((id, index) => ({
            id: parseInt(id),
            type: comment.entity_tag_types.split(',')[index],
            entityId: commentHospitalIds[index],
            entityName: hospitals.find(h => h.id === commentHospitalIds[index])?.name
          })) : [];

        return {
          ...comment,
          hospitals: commentHospitals,
          entityTags
        };
      });

      res.json({
        comments: commentsWithDetails,
        totalCount: comments.length
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: '댓글을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 댓글 작성
router.post('/:id/comments', authenticateToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { comment, entityTags } = req.body;
    const userId = req.user.id;
    const boardId = req.params.id;

    // 게시글 존재 여부 확인
    const [board] = await conn.query(
      `SELECT b.*, c.allow_comments 
       FROM hospital_board b
       JOIN hospital_board_categories c ON b.category_id = c.id
       WHERE b.id = ?`,
      [boardId]
    );

    if (board.length === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    if (!board[0].allow_comments) {
      return res.status(403).json({ message: '이 카테고리에서는 댓글을 작성할 수 없습니다.' });
    }

    // 댓글 작성
    const [result] = await conn.query(
      'INSERT INTO hospital_board_comments (board_id, user_id, comment) VALUES (?, ?, ?)',
      [boardId, userId, comment]
    );
    const commentId = result.insertId;

    // 엔티티 태그 처리
    if (entityTags && entityTags.length > 0) {
      for (const tag of entityTags) {
        if (!tag.typeId || !tag.entityId) {
          continue;
        }

        // 엔티티 태그 생성 또는 조회
        const [existingTag] = await conn.query(
          'SELECT id FROM hospital_entity_tags WHERE tag_type_id = ? AND entity_id = ?',
          [tag.typeId, tag.entityId]
        );

        let entityTagId;
        if (existingTag.length > 0) {
          entityTagId = existingTag[0].id;
        } else {
          const [newTag] = await conn.query(
            'INSERT INTO hospital_entity_tags (tag_type_id, entity_id) VALUES (?, ?)',
            [tag.typeId, tag.entityId]
          );
          entityTagId = newTag.insertId;
        }

        // 댓글-엔티티 태그 매핑
        await conn.query(
          'INSERT INTO hospital_comment_entity_tags (comment_id, entity_tag_id) VALUES (?, ?)',
          [commentId, entityTagId]
        );
      }
    }

    await conn.commit();

    // 작성된 댓글 정보 조회
    const [newComment] = await conn.query(`
      SELECT 
        c.*,
        u.username,
        u.nickname,
        GROUP_CONCAT(DISTINCT et.entity_id) as hospital_ids,
        GROUP_CONCAT(DISTINCT et.id) as entity_tag_ids,
        GROUP_CONCAT(DISTINCT tt.type_name) as entity_tag_types
      FROM hospital_board_comments c
      JOIN hospital_users u ON c.user_id = u.id
      LEFT JOIN hospital_comment_entity_tags cet ON c.id = cet.comment_id
      LEFT JOIN hospital_entity_tags et ON cet.entity_tag_id = et.id
      LEFT JOIN hospital_tag_types tt ON et.tag_type_id = tt.id
      WHERE c.id = ?
      GROUP BY c.id`,
      [commentId]
    );

    // 병원 정보 조회
    let hospitalTags = [];
    if (newComment[0]?.hospital_ids) {
      const hospitalIds = newComment[0].hospital_ids.split(',');
      const response = await elasticClient.search({
        index: 'hospitals',
        body: {
          query: {
            terms: {
              ykiho: hospitalIds
            }
          }
        }
      });

      if (response.hits && response.hits.hits) {
        hospitalTags = response.hits.hits.map(hit => ({
          id: hit._source.ykiho,
          name: hit._source.yadmnm,
          address: hit._source.addr
        }));
      }
    }

    // 엔티티 태그 정보 구성
    const entityTagInfo = newComment[0]?.entity_tag_ids && newComment[0]?.entity_tag_types ? 
      newComment[0].entity_tag_ids.split(',').map((id, index) => {
        const hospitalId = newComment[0].hospital_ids?.split(',')[index];
        const hospital = hospitalTags.find(h => h.id === hospitalId);
        return {
          id: parseInt(id),
          type: newComment[0].entity_tag_types.split(',')[index],
          entityId: hospitalId,
          entityName: hospital?.name
        };
      }) : [];

    const commentData = {
      ...newComment[0],
      hospitals: hospitalTags,
      entityTags: entityTagInfo
    };

    res.status(201).json({
      success: true,
      comment: commentData
    });
  } catch (error) {
    await conn.rollback();
    console.error('댓글 작성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  } finally {
    conn.release();
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

// 카테고리별 게시글 조회
router.get('/category/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    // 카테고리 정보 조회
    const [category] = await pool.query(
      'SELECT * FROM hospital_board_categories WHERE id = ?',
      [categoryId]
    );

    if (!category || category.length === 0) {
      return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    }

    // 게시글 조회 쿼리
    const query = `
      SELECT 
        b.*,
        c.category_name,
        ct.type_name as category_type_name,
        u.nickname as author_nickname,
        u.profile_image as author_profile_image,
        (SELECT COUNT(*) FROM hospital_board_likes WHERE board_id = b.id) as like_count,
        (SELECT COUNT(*) FROM hospital_board_comments WHERE board_id = b.id) as comment_count,
        (SELECT COUNT(*) FROM hospital_board_views WHERE board_id = b.id) as view_count
      FROM hospital_boards b
      JOIN hospital_board_categories c ON b.category_id = c.id
      JOIN hospital_board_category_types ct ON c.category_type_id = ct.id
      JOIN users u ON b.user_id = u.id
      WHERE b.category_id = ?
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [boards] = await pool.query(query, [categoryId, limit, offset]);

    // 전체 게시글 수 조회
    const [totalCount] = await pool.query(
      'SELECT COUNT(*) as count FROM hospital_boards WHERE category_id = ?',
      [categoryId]
    );

    const totalPages = Math.ceil(totalCount[0].count / limit);

    res.json({
      boards,
      currentPage: page,
      totalPages,
      categoryName: category[0].category_name
    });
  } catch (error) {
    console.error('카테고리별 게시글 조회 실패:', error);
    res.status(500).json({ error: '카테고리별 게시글 조회에 실패했습니다.' });
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

// 병원 검색 API
router.get('/autocomplete', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json({ hospital: [] });
    }

    // 몽고DB에서 병원 검색
    const hospitals = await Hospital.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(10)
    .lean();

    res.json({
      hospital: hospitals.map(hospital => ({
        dbId: hospital._id.toString(),  // 몽고DB ObjectId를 문자열로 변환
        name: hospital.name,
        address: hospital.address
      }))
    });
  } catch (error) {
    console.error('병원 검색 오류:', error);
    res.status(500).json({ error: '병원 검색에 실패했습니다.' });
  }
});

module.exports = router; 