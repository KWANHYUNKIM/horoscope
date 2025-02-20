require('dotenv').config();
const express = require('express');
const connectDB = require('./config/mongoose'); // MongoDB 연결
const hospitalRoutes = require('./routes/hospitalRoutes');
const hospitalSearchRouter = require('./elastic/hospitalSearch');
const hospitalSubjectRoutes = require('./routes/hospitalSubjectRoutes'); // 새로운 라우터 추가
const hospitalDetailSearchRoutes = require('./elastic/hospitalDetailSearch');
const { reindex } = require('./elastic/elastics'); // reindex 불러오기

const app = express();
const cors = require('cors');
const allowedOrigins = [
  'https://my-client-284451238916.asia-northeast3.run.app',  // 운영 환경 도메인
  'https://bippobippo119.com.',
  'https://bippobippo119.com',
  'https://www.bippobippo119.com',
  'https://www.bippobippo119.com.',
  'http://localhost:8081' // 개발 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);  // 허용된 도메인인 경우
    } else {
      callback(new Error('Not allowed by CORS'));  // 허용되지 않은 경우
    }
  }
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
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
