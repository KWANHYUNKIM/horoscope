const mongoose = require('mongoose');
const vectorDBService = require('../services/vectorDBService');

const initializeVectorDB = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/horoscope_db');
    console.log('MongoDB 연결 성공');

    // 벡터 DB 초기화
    await vectorDBService.initialize();
    
    // 병원 데이터 벡터화
    await vectorDBService.createHospitalEmbeddings();

    console.log('벡터 DB 초기화 완료');
    process.exit(0);
  } catch (error) {
    console.error('벡터 DB 초기화 실패:', error);
    process.exit(1);
  }
};

initializeVectorDB(); 