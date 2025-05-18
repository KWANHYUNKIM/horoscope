const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const pool = require('../config/mysql');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
});

// 저장 전에 비밀번호 해싱 처리
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});

// 비밀번호 비교 메서드
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.statics.findByEmail = async function (email) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM hospital_users WHERE email = ?',
      [email]
    );
    return rows[0];
  } catch (error) {
    console.error('findByEmail 에러:', error);
    throw error;
  }
};

module.exports = mongoose.model('User', UserSchema);