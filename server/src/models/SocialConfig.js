const db = require('../config/database');

class SocialConfig {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM social_configs');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM social_configs WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(config) {
    const { provider, client_id, client_secret, redirect_uri, is_active } = config;
    const [result] = await db.query(
      'INSERT INTO social_configs (provider, client_id, client_secret, redirect_uri, is_active) VALUES (?, ?, ?, ?, ?)',
      [provider, client_id, client_secret, redirect_uri, is_active]
    );
    return result.insertId;
  }

  static async update(id, config) {
    const { provider, client_id, client_secret, redirect_uri, is_active } = config;
    await db.query(
      'UPDATE social_configs SET provider = ?, client_id = ?, client_secret = ?, redirect_uri = ?, is_active = ? WHERE id = ?',
      [provider, client_id, client_secret, redirect_uri, is_active, id]
    );
    return id;
  }

  static async delete(id) {
    await db.query('DELETE FROM social_configs WHERE id = ?', [id]);
    return id;
  }
}

module.exports = SocialConfig; 