const mongoose = require('mongoose');

// 환경 변수에서 MongoDB URI 불러오기
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/horoscope_db';
//const MONGO_URI = 'mongodb://localhost:27017/horoscope_db';
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log("⚠️ MongoDB 이미 연결됨.");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000, // 20초 타임아웃 설정
      socketTimeoutMS: 45000 // 45초 타임아웃 설정
    });

  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

