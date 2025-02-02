require('dotenv').config();
const express = require('express');
const connectDB = require('./config/mongoose'); // MongoDB 연결
const sequelize = require('./config/database'); // PostgreSQL 연결
const hospitalRoutes = require('./routes/hospitalRoutes');
const hospitalSearchRouter = require('./elastic/hospitalSearch');
const hospitalSubjectRoutes = require('./routes/hospitalSubjectRoutes'); // 새로운 라우터 추가
const { reindex } = require('./elastic/elastics'); // reindex 불러오기

const app = express();

// MongoDB 연결
connectDB();

reindex().then(() => {
    console.log("🚀 Elasticsearch Reindexing Complete!");
  }).catch(err => console.error("❌ Error in reindexing:", err));
  

// 미들웨어
app.use(express.json());

// 라우트
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hospitals/search', hospitalSearchRouter);
app.use('/api/hospitals/subjects', hospitalSubjectRoutes); // 새로운 라우터 사용

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));