require('dotenv').config();
const express = require('express');
const connectDB = require('./config/mongoose'); // MongoDB 연결
const sequelize = require('./config/database'); // PostgreSQL 연결
const hospitalRoutes = require('./routes/hospitalRoutes');

const app = express();

// MongoDB 연결
connectDB();

// 미들웨어
app.use(express.json());

// 라우트
app.use('/api/hospitals', hospitalRoutes);

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));