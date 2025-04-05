const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// 게시글 작성
router.post('/', authenticateToken, async (req, res) => {
  const { title, content, category_id, tags, entityTags } = req.body;
  const userId = req.user.id;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 게시글 작성
    const [boardResult] = await connection.query(
      'INSERT INTO hospital_board (title, user_id, category_id) VALUES (?, ?, ?)',
      [title, userId, category_id]
    );
    const boardId = boardResult.insertId;

    // 게시글 상세 내용 저장
    await connection.query(
      'INSERT INTO hospital_board_details (board_id, content) VALUES (?, ?)',
      [boardId, content]
    );

    // 일반 태그 처리
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tagId => [boardId, tagId]);
      await connection.query(
        'INSERT INTO hospital_board_post_tags (board_id, tag_id) VALUES ?',
        [tagValues]
      );
    }

    // 엔티티 태그 처리 (@ 태그)
    if (entityTags && entityTags.length > 0) {
      for (const tag of entityTags) {
        // 엔티티 태그 생성 또는 조회
        const [existingTag] = await connection.query(
          'SELECT id FROM hospital_entity_tags WHERE tag_type_id = ? AND entity_id = ?',
          [tag.typeId, tag.entityId]
        );

        let entityTagId;
        if (existingTag.length === 0) {
          const [newTag] = await connection.query(
            'INSERT INTO hospital_entity_tags (tag_type_id, entity_id) VALUES (?, ?)',
            [tag.typeId, tag.entityId]
          );
          entityTagId = newTag.insertId;
        } else {
          entityTagId = existingTag[0].id;
        }

        // 게시글-엔티티 태그 매핑
        await connection.query(
          'INSERT INTO hospital_board_entity_tags (board_id, entity_tag_id) VALUES (?, ?)',
          [boardId, entityTagId]
        );
      }
    }

    await connection.commit();

    // 작성된 게시글과 태그 정보 조회
    const [board] = await connection.query(
      `SELECT b.*, bd.content,
        GROUP_CONCAT(DISTINCT t.id) as tag_ids,
        GROUP_CONCAT(DISTINCT t.name) as tag_names,
        GROUP_CONCAT(DISTINCT et.id) as entity_tag_ids,
        GROUP_CONCAT(DISTINCT tt.type_name) as entity_tag_types,
        GROUP_CONCAT(DISTINCT et.entity_id) as entity_ids
       FROM hospital_board b
       LEFT JOIN hospital_board_details bd ON b.id = bd.board_id
       LEFT JOIN hospital_board_post_tags bpt ON b.id = bpt.board_id
       LEFT JOIN hospital_board_tags t ON bpt.tag_id = t.id
       LEFT JOIN hospital_board_entity_tags bet ON b.id = bet.board_id
       LEFT JOIN hospital_entity_tags et ON bet.entity_tag_id = et.id
       LEFT JOIN hospital_tag_types tt ON et.tag_type_id = tt.id
       WHERE b.id = ?
       GROUP BY b.id`,
      [boardId]
    );

    res.json({
      success: true,
      board: {
        ...board[0],
        tags: board[0].tag_ids ? board[0].tag_ids.split(',').map((id, index) => ({
          id: parseInt(id),
          name: board[0].tag_names.split(',')[index]
        })) : [],
        entityTags: board[0].entity_tag_ids ? board[0].entity_tag_ids.split(',').map((id, index) => ({
          id: parseInt(id),
          type: board[0].entity_tag_types.split(',')[index],
          entityId: parseInt(board[0].entity_ids.split(',')[index])
        })) : []
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('게시글 작성 오류:', error);
    res.status(500).json({ success: false, message: '게시글 작성에 실패했습니다.' });
  } finally {
    connection.release();
  }
});

// 게시글 조회
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [board] = await pool.query(
      `SELECT b.*, bd.content,
        GROUP_CONCAT(DISTINCT t.id) as tag_ids,
        GROUP_CONCAT(DISTINCT t.name) as tag_names,
        GROUP_CONCAT(DISTINCT et.id) as entity_tag_ids,
        GROUP_CONCAT(DISTINCT tt.type_name) as entity_tag_types,
        GROUP_CONCAT(DISTINCT et.entity_id) as entity_ids
       FROM hospital_board b
       LEFT JOIN hospital_board_details bd ON b.id = bd.board_id
       LEFT JOIN hospital_board_post_tags bpt ON b.id = bpt.board_id
       LEFT JOIN hospital_board_tags t ON bpt.tag_id = t.id
       LEFT JOIN hospital_board_entity_tags bet ON b.id = bet.board_id
       LEFT JOIN hospital_entity_tags et ON bet.entity_tag_id = et.id
       LEFT JOIN hospital_tag_types tt ON et.tag_type_id = tt.id
       WHERE b.id = ?
       GROUP BY b.id`,
      [id]
    );

    if (board.length === 0) {
      return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
    }

    const formattedBoard = {
      ...board[0],
      tags: board[0].tag_ids ? board[0].tag_ids.split(',').map((id, index) => ({
        id: parseInt(id),
        name: board[0].tag_names.split(',')[index]
      })) : [],
      entityTags: board[0].entity_tag_ids ? board[0].entity_tag_ids.split(',').map((id, index) => ({
        id: parseInt(id),
        type: board[0].entity_tag_types.split(',')[index],
        entityId: parseInt(board[0].entity_ids.split(',')[index])
      })) : []
    };

    res.json({ success: true, board: formattedBoard });
  } catch (error) {
    console.error('게시글 조회 오류:', error);
    res.status(500).json({ success: false, message: '게시글 조회에 실패했습니다.' });
  }
});

module.exports = router; 