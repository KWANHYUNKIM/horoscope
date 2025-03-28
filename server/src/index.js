//require('dotenv').config(); // 환경 변수 로드
const express = require('express');
const connectDB = require('./config/mongoose'); // MongoDB 연결
const hospitalRoutes = require('./routes/hospitalRoutes');
const hospitalSearchRouter = require('./elastic/hospitalSearch');
const hospitalSubjectRoutes = require('./routes/hospitalSubjectRoutes'); // 새로운 라우터 추가
const hospitalDetailSearchRoutes = require('./elastic/hospitalDetailSearch');
const autoCompleteRouter = require('./elastic/autoComplete');
const chatRouter = require('./routes/chat'); // 채팅 라우터 추가
const adminRouter = require('./routes/admin'); // 관리자 라우터 추가
const boardRoutes = require('./routes/boardRoutes');
const chatRoutes = require('./routes/chatRoutes');
//const { reindex } = require('./elastic/elastics'); // reindex 불러오기
const User = require('./models/User');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // cookie-parser 추가
const { router: authRouter, authenticateToken, isAdmin } = require('./routes/authRoutes');
const emailRouter = require('./routes/emailRoutes');

const app = express();

const allowedOrigins = [
  'https://my-client-284451238916.asia-northeast3.run.app',  // 운영 환경 도메인
  'https://bippobippo119.com.',
  'https://bippobippo119.com',
  'https://www.bippobippo119.com',
  'https://www.bippobippo119.com.',
  'http://localhost:8081', // 개발
  'http://localhost:3001',
  'https://my-server-284451238916.asia-northeast3.run.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization, Cookie'
}));

app.use(express.json());
app.use(cookieParser()); // cookie-parser 미들웨어 추가
// MongoDB 연결
connectDB();

// Elasticsearch Reindexing
//console.log("🔄 Starting Elasticsearch reindexing process...");
//reindex()
//  .then(() => {
//    console.log("✅ Elasticsearch Reindexing Complete!");
//  })
//  .catch(err => {
//    console.error("❌ Error in reindexing:", err);
//    console.error("Stack trace:", err.stack);
//  });

// API 라우트 설정
app.use('/api/auth', authRouter);
app.use('/api/email', emailRouter);
app.use('/api/admin', authenticateToken, isAdmin, adminRouter);
app.use('/api/autocomplete', autoCompleteRouter);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hospitals/search', hospitalSearchRouter);
app.use('/api/hospitals/details/search', hospitalDetailSearchRoutes);
app.use('/api/hospitals/subjects', hospitalSubjectRoutes);
app.use('/aip/chat', chatRouter);
app.use('/api/boards', boardRoutes);

//app.use('/api/chat', chatRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
