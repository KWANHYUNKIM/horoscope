require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI ||
  (process.env.NODE_ENV === 'development'
    ? "mongodb://localhost:27017/horoscope_db"
    : "mongodb://mongodb-service:27017/horoscope_db");
    
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log("⚠️ MongoDB 이미 연결됨.");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);  // ✅ 불필요한 옵션 제거
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

