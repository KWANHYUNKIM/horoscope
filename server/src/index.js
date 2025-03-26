//require('dotenv').config(); // 운영서버 , if not 주석
const express = require('express');
const connectDB = require('./config/mongoose'); // MongoDB 연결
const jwt = require('jsonwebtoken');
const hospitalRoutes = require('./routes/hospitalRoutes');
const hospitalSearchRouter = require('./elastic/hospitalSearch');
const hospitalSubjectRoutes = require('./routes/hospitalSubjectRoutes'); // 새로운 라우터 추가
const hospitalDetailSearchRoutes = require('./elastic/hospitalDetailSearch');
const autoCompleteRouter = require('./elastic/autoComplete');
const chatRouter = require('./routes/chat'); // 채팅 라우터 추가
const adminRouter = require('./routes/admin'); // 관리자 라우터 추가
const chatRoutes = require('./routes/chatRoutes');
//const { reindex } = require('./elastic/elastics'); // reindex 불러오기
const User = require('./models/User');
const cors = require('cors');

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
  allowedHeaders: 'Content-Type, Authorization' // 최소한의 헤더만 허용
}));


app.use(express.json());
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

// JWT 시크릿 키 설정
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
        }
        req.user = user;
        next();
    });
};

// 관리자 권한 확인 미들웨어
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }
};

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    return res.json({ 
      success: true, 
      token,
      role: user.role 
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// 보호된 라우트에 인증 미들웨어 추가
app.use('/api/admin', authenticateToken, isAdmin, adminRouter);

// 인증이 필요 없는 라우트
app.use('/api/autocomplete', autoCompleteRouter);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hospitals/search', hospitalSearchRouter);
app.use('/api/hospitals/details/search', hospitalDetailSearchRoutes);
app.use('/api/hospitals/subjects', hospitalSubjectRoutes);
app.use('/aip/chat', chatRouter);
//app.use('/api/chat', chatRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
