const mysql = require('../config/mysql');

class HospitalOriginHistory {
  static async create(data) {
    try {
      const [result] = await mysql.query(
        'INSERT INTO hospital_origin_history SET ?',
        [data]
      );
      return result.insertId;
    } catch (error) {
      console.error('HospitalOriginHistory.create 오류:', error);
      throw error;
    }
  }

  static async findByOriginId(originId) {
    try {
      const [rows] = await mysql.query(
        'SELECT * FROM hospital_origin_history WHERE origin_id = ? ORDER BY created_at DESC',
        [originId]
      );
      return rows;
    } catch (error) {
      console.error('HospitalOriginHistory.findByOriginId 오류:', error);
      throw error;
    }
  }
}

module.exports = HospitalOriginHistory; 