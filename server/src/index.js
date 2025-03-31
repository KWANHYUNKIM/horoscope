//require('dotenv').config(); // 환경 변수 로드
const express = require('express');
const connectDB = require('./config/mongoose'); // MongoDB 연결
const hospitalRoutes = require('./routes/hospitalRoutes');
const hospitalSearchRouter = require('./elastic/hospitalSearch');
const hospitalSubjectRoutes = require('./routes/hospitalSubjectRoutes'); // 새로운 라우터 추가
const hospitalDetailSearchRoutes = require('./elastic/hospitalDetailSearch');
const autoCompleteRouter = require('./elastic/autoComplete');
const chatRouter = require('./routes/chat'); // 채팅 라우터 추가
const adminRoutes = require('./routes/adminRoutes'); // adminRoutes로 이름 변경
const boardRoutes = require('./routes/boardRoutes');
const chatRoutes = require('./routes/chatRoutes');
//const { reindex } = require('./elastic/elastics'); // reindex 불러오기
const User = require('./models/User');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // cookie-parser 추가
const { router: authRouter, authenticateToken, isAdmin } = require('./routes/authRoutes');
const emailRouter = require('./routes/emailRoutes');
const HospitalOrigin = require('./models/HospitalOrigin');
const hospitalOriginRoutes = require('./routes/hospitalOriginRoutes');

const app = express();

// 기본 origin 추가 함수
const addDefaultOrigins = async () => {
  try {
    const origins = await HospitalOrigin.findAll({});
    if (origins.length === 0) {
      await HospitalOrigin.create({
        origin_url: 'http://localhost:3000',
        environment: process.env.NODE_ENV || 'development',
        is_active: true,
        description: '기본 개발 환경 origin'
      });
      console.log('기본 origin이 추가되었습니다.');
    }
  } catch (error) {
    console.error('기본 origin 추가 중 오류:', error);
  }
};

// CORS 설정을 위한 미들웨어
const corsMiddleware = async (req, res, next) => {
  try {
    const origins = await HospitalOrigin.findAll({
      is_active: true,
      environment: process.env.NODE_ENV || 'development'
    });
    
    const allowedOrigins = origins.map(origin => origin.origin_url);
    console.log('허용된 Origins:', allowedOrigins); // 디버깅용 로그
    
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log('차단된 Origin:', origin); // 디버깅용 로그
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: 'GET, POST, PUT, DELETE, OPTIONS',
      allowedHeaders: 'Content-Type, Authorization, Cookie'
    })(req, res, next);
  } catch (error) {
    console.error('CORS 설정 중 오류 발생:', error);
    next(error);
  }
};

app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser()); // cookie-parser 미들웨어 추가

connectDB();

// 기본 origin 추가
addDefaultOrigins();

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
app.use('/api/admin', adminRoutes); // adminRoutes로 변경하고 미들웨어 제거
app.use('/api/autocomplete', autoCompleteRouter);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hospitals/search', hospitalSearchRouter);
app.use('/api/hospitals/details/search', hospitalDetailSearchRoutes);
app.use('/api/hospitals/subjects', hospitalSubjectRoutes);
app.use('/aip/chat', chatRouter);
app.use('/api/boards', boardRoutes);
app.use('/api/origins', hospitalOriginRoutes);

//app.use('/api/chat', chatRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
