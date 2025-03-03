const express = require('express');
const connectDB = require('./config/mongoose'); // MongoDB 연결
const hospitalRoutes = require('./routes/hospitalRoutes');
const hospitalSearchRouter = require('./elastic/hospitalSearch');
const hospitalSubjectRoutes = require('./routes/hospitalSubjectRoutes'); // 새로운 라우터 추가
const hospitalDetailSearchRoutes = require('./elastic/hospitalDetailSearch');
const autoCompleteRouter = require('./elastic/autoComplete');

//const { reindex } = require('./elastic/elastics'); // reindex 불러오기
//const User = require('./models/User');

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

//reindex().then(() => {
//    console.log("🚀 Elasticsearch Reindexing Complete!");
//  }).catch(err => console.error("❌ Error in reindexing:", err));

// 미들웨어
app.use(express.json());

//app.post('/api/login', async (req, res) => {
//  const { username, password } = req.body;
// try {
//   const user = await User.findOne({ username });
//    if (!user) {
//      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
//    }
//    const isMatch = await user.comparePassword(password);
//    if (!isMatch) {
//      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
//    }
    // 인증 성공 시 role 반환 (실제 환경에서는 JWT 토큰 발행을 권장)
//    return res.json({ success: true, role: user.role });
//  } catch (error) {
//    console.error('로그인 에러:', error);
//    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
//  }
//});

// 라우트

app.use('/api/autocomplete', autoCompleteRouter);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hospitals/search', hospitalSearchRouter);
app.use('/api/hospitals/details/search', hospitalDetailSearchRoutes);
app.use('/api/hospitals/subjects', hospitalSubjectRoutes); // 새로운 라우터 사용

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
