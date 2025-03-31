const pool = require('../config/mysql');

class SocialConfig {
  static async findByProvider(provider) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM hospital_social_configs WHERE provider = ?',
        [provider]
      );
      return rows[0];
    } catch (error) {
      console.error('소셜 설정 조회 오류:', error);
      throw error;
    }
  }

  static async update(provider, data) {
    try {
      const { client_id, client_secret, redirect_uri } = data;
      await pool.query(
        `UPDATE hospital_social_configs 
         SET client_id = ?, client_secret = ?, redirect_uri = ?, 
             updated_at = NOW()
         WHERE provider = ?`,
        [client_id, client_secret, redirect_uri, provider]
      );
      return true;
    } catch (error) {
      console.error('소셜 설정 수정 오류:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM hospital_social_configs');
      return rows;
    } catch (error) {
      console.error('소셜 설정 목록 조회 오류:', error);
      throw error;
    }
  }
}

module.exports = SocialConfig; 