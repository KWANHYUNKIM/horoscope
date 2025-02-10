require('dotenv').config();
const express = require('express');
const connectDB = require('./config/mongoose'); // MongoDB 연결
const hospitalRoutes = require('./routes/hospitalRoutes');
const hospitalSearchRouter = require('./elastic/hospitalSearch');
const hospitalSubjectRoutes = require('./routes/hospitalSubjectRoutes'); // 새로운 라우터 추가
const hospitalDetailSearchRoutes = require('./elastic/hospitalDetailSearch');
//const { reindex } = require('./elastic/elastics'); // reindex 불러오기

const app = express();
const cors = require('cors');
const allowedOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL    // 운영 환경: production 환경 변수에 설정한 클라이언트 URL 사용
  : 'http://localhost:8081';  // 개발 환경: 로컬 호스트 사용

app.use(cors({
  origin: allowedOrigin,
}));

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
app.use('/api/hospitals/details/search', hospitalDetailSearchRoutes);
app.use('/api/hospitals/subjects', hospitalSubjectRoutes); // 새로운 라우터 사용

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));