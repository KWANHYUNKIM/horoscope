const mysql = require('../config/mysql');

class HospitalOrigin {
  static async findAll(where = {}) {
    let query = 'SELECT * FROM hospital_origins';
    const params = [];
    
    if (Object.keys(where).length > 0) {
      const conditions = [];
      for (const [key, value] of Object.entries(where)) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    try {
      const [rows] = await mysql.query(query, params);
      return rows;
    } catch (error) {
      console.error('HospitalOrigin.findAll 오류:', error);
      throw error;
    }
  }

  static async create(data) {
    try {
      const [result] = await mysql.query(
        'INSERT INTO hospital_origins SET ?',
        [data]
      );
      return result.insertId;
    } catch (error) {
      console.error('HospitalOrigin.create 오류:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      console.log('Update 메서드 시작 - ID:', id);
      console.log('입력 데이터:', data);

      // 업데이트할 필드만 선택
      const allowedFields = ['origin_url', 'environment', 'is_active', 'description', 'updated_by'];
      const updateData = {};
      
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }

      console.log('필터링된 업데이트 데이터:', updateData);

      if (Object.keys(updateData).length === 0) {
        console.log('업데이트할 데이터가 없음');
        return false;
      }

      // SET 절을 동적으로 생성
      const setClause = Object.keys(updateData)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = [...Object.values(updateData), id];
      
      const query = `UPDATE hospital_origins SET ${setClause} WHERE id = ?`;
      console.log('실행할 쿼리:', query);
      console.log('쿼리 파라미터:', values);

      const [result] = await mysql.query(query, values);
      console.log('쿼리 실행 결과:', result);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('HospitalOrigin.update 오류:', error);
      console.error('Update Data:', data);
      console.error('Error Stack:', error.stack);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await mysql.query(
        'DELETE FROM hospital_origins WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('HospitalOrigin.delete 오류:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await mysql.query(
        'SELECT * FROM hospital_origins WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('HospitalOrigin.findById 오류:', error);
      throw error;
    }
  }
}

module.exports = HospitalOrigin; 