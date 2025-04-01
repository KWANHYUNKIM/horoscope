const db = require('../config/database');

class CorsConfig {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM cors_configs');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM cors_configs WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(config) {
    const { origin, is_active } = config;
    const [result] = await db.query(
      'INSERT INTO cors_configs (origin, is_active) VALUES (?, ?)',
      [origin, is_active]
    );
    return result.insertId;
  }

  static async update(id, config) {
    const { origin, is_active } = config;
    await db.query(
      'UPDATE cors_configs SET origin = ?, is_active = ? WHERE id = ?',
      [origin, is_active, id]
    );
    return id;
  }

  static async delete(id) {
    await db.query('DELETE FROM cors_configs WHERE id = ?', [id]);
    return id;
  }
}

module.exports = CorsConfig; 