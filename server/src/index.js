require('dotenv').config({ path: '.env.local' }); // .env.local 파일에서 환경 변수 로드
const express = require('express');
const connectDB = require('./config/mongoose'); // MongoDB 연결
const hospitalRoutes = require('./routes/hospitalRoutes');
const hospitalSearchRouter = require('./elastic/hospitalSearch');
const hospitalSubjectRoutes = require('./routes/hospitalSubjectRoutes'); // 새로운 라우터 추가
const autoCompleteRouter = require('./elastic/autoComplete');
const chatRouter = require('./routes/chat'); // 채팅 라우터 추가
const adminRoutes = require('./routes/adminRoutes'); // adminRoutes로 이름 변경
const boardRoutes = require('./routes/boardRoutes');
const hospitalReviewRoutes = require('./routes/hospitalReviewRoutes');  // 리뷰 라우터 추가
const pharmacySearchRouter = require('./elastic/pharmacySearch');
const pharmacyAutoCompleteRouter = require('./routes/pharmacyAutoComplete');
const hospitalDetailRouter = require('./elastic/hospitalDetail');
const healthCenterRoutes = require('./routes/healthCenterRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const nursingHospitalSearchRouter = require('./elastic/nursingHospitalSearch');
const nursingHospitalAutoCompleteRouter = require('./elastic/nursingHospitalAutoComplete');
//const chatRoutes = require('./routes/chatRoutes');
const { reindex } = require('./elastic/elastics'); // reindex 불러오기
const { reindexMap } = require('./elastic/elastics'); // reindexMap 불러오기
const { reindexPharmacies } = require('./elastic/elastics'); // reindexPharmacies 불러오기
const { reindexMapCluster } = require('./elastic/elastics'); // reindexMapCluster 불러오기
const cors = require('cors');
const cookieParser = require('cookie-parser'); // cookie-parser 추가
const { router: authRouter } = require('./routes/authRoutes');
const emailRouter = require('./routes/emailRoutes');
const HospitalOrigin = require('./models/HospitalOrigin');
const hospitalOriginRoutes = require('./routes/hospitalOriginRoutes');
const path = require('path');
const fs = require('fs');
const mapRouter = require('./routes/map');
const mapSummaryRouter = require('./routes/map-summary');
const app = express();

connectDB();

// uploads 디렉토리 생성
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


// 기본 origin 추가 함수
const addDefaultOrigins = async () => {
  try {
    const origins = await HospitalOrigin.findAll({});
    if (origins.length === 0) {
      await HospitalOrigin.create({
        origin_url: 'http://localhost:3000',
        environment: process.env.ENVIRONMENT,
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
      environment: process.env.ENVIRONMENT
    });
    
    const allowedOrigins = origins.map(origin => origin.origin_url);
    
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

// uploads 디렉토리를 정적 파일로 서빙
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Elasticsearch Map Reindexing
//reindexMap()
//  .then(() => {
//    console.log("✅ Elasticsearch Map Reindexing Complete!");
//  })
//  .catch(err => {
//    console.error("❌ Error in reindexing:", err);
//    console.error("Stack trace:", err.stack);
//  });

//reindexPharmacies()
//.then(() => {
//    console.log("✅ Elasticsearch Reindexing Complete!");
//  })
//  .catch(err => {
//    console.error("❌ Error in reindexing:", err);
//    console.error("Stack trace:", err.stack);
//  });



//reindexMapCluster()
//.then(() => {
//  console.log("✅ Elasticsearch Map Cluster Reindexing Complete!");
//})
//.catch(err => {
//  console.error("❌ Error in reindexing:", err);
//  console.error("Stack trace:", err.stack);
//});

// API 라우트 설정
console.log('라우터 설정 시작');
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRouter);
app.use('/api/hospitals/search', hospitalSearchRouter);
app.use('/api/hospitals/detail', hospitalDetailRouter);
app.use('/api/hospitals/subjects', hospitalSubjectRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/nursing-hospitals/search', nursingHospitalSearchRouter);
app.use('/api/nursing-hospitals', hospitalReviewRoutes);
app.use('/api/nursing-hospitals/autoComplete', nursingHospitalAutoCompleteRouter);
app.use('/api/pharmacies', pharmacySearchRouter);
app.use('/api/pharmacy-autocomplete', pharmacyAutoCompleteRouter);
app.use('/api/health-centers', healthCenterRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/boards', boardRoutes);
app.use('/api/origins', hospitalOriginRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/autocomplete', autoCompleteRouter);
app.use('/api/map-summary', mapSummaryRouter);
// map 라우터 설정
console.log('map 라우터 설정');
app.use('/api/map', mapRouter);
// 라우터 디버깅 미들웨어
app.use((req, res, next) => {
  console.log(`요청 경로: ${req.path}`);
  console.log(`요청 메서드: ${req.method}`);
  console.log(`요청 쿼리:`, req.query);
  next();
});

// 등록된 라우트 목록 출력
console.log('등록된 라우트 목록:');
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log(`- ${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
    }
});

//app.use('/api/chat', chatRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});