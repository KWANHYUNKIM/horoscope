const db = require('../config/database');

class ServerConfig {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM hospital_server_configs');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM hospital_server_configs WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(config) {
    const { key_name, value, environment, description, is_active } = config;
    const [result] = await db.query(
      'INSERT INTO hospital_server_configs (key_name, value, environment, description, is_active) VALUES (?, ?, ?, ?, ?)',
      [key_name, value, environment, description, is_active]
    );
    return result.insertId;
  }

  static async update(id, config) {
    const { key_name, value, environment, description, is_active } = config;
    await db.query(
      'UPDATE hospital_server_configs SET key_name = ?, value = ?, environment = ?, description = ?, is_active = ? WHERE id = ?',
      [key_name, value, environment, description, is_active, id]
    );
    return id;
  }

  static async delete(id) {
    await db.query('DELETE FROM hospital_server_configs WHERE id = ?', [id]);
    return id;
  }
}

module.exports = ServerConfig; 