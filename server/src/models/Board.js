const db = require('../config/database');

class Board {
  static async countDocuments() {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM boards');
    return rows[0].count;
  }

  static async findAll() {
    const [rows] = await db.query('SELECT * FROM boards');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM boards WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(board) {
    const { title, content, author_id, category } = board;
    const [result] = await db.query(
      'INSERT INTO boards (title, content, author_id, category) VALUES (?, ?, ?, ?)',
      [title, content, author_id, category]
    );
    return result.insertId;
  }

  static async update(id, board) {
    const { title, content, category } = board;
    await db.query(
      'UPDATE boards SET title = ?, content = ?, category = ? WHERE id = ?',
      [title, content, category, id]
    );
    return id;
  }

  static async delete(id) {
    await db.query('DELETE FROM boards WHERE id = ?', [id]);
    return id;
  }
}

module.exports = Board; 