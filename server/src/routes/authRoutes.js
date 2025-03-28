const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/mysql');

// JWT 시크릿 키 설정
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 사용자 정보 조회
    const [users] = await pool.query('SELECT * FROM hospital_users WHERE username = ?', [username]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 사용자 역할 조회
    const [roles] = await pool.query(
      `SELECT r.role_name 
       FROM hospital_roles r 
       JOIN hospital_user_roles ur ON r.id = ur.role_id 
       WHERE ur.user_id = ?`,
      [user.id]
    );

    const userRole = roles.length > 0 ? roles[0].role_name : 'user';
    console.log('User role from database:', userRole); // 디버깅용 로그

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: userRole
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // HTTPOnly 쿠키로 토큰 저장
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
      sameSite: 'strict', // CSRF 방지
      maxAge: 24 * 60 * 60 * 1000 // 24시간
    });

    // 사용자 정보에서 비밀번호 제외
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.role = userRole;

    res.json({
      message: '로그인 성공',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ message: '로그아웃 성공' });
});

// 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded); // 디버깅용 로그
    req.user = decoded;
    next();
  } catch (error) {
    console.error('토큰 검증 오류:', error); // 디버깅용 로그
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

// 관리자 권한 검증 미들웨어
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  next();
};

// 관리자 권한 체크
router.get('/check-admin', authenticateToken, (req, res) => {
  res.json({ isAdmin: req.user.role === 'admin' });
});

// 인증 상태 확인
router.get('/check-auth', authenticateToken, (req, res) => {
  console.log('Check auth user:', req.user); // 디버깅용 로그
  res.json({ 
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// 회원가입
router.post('/register', async (req, res) => {
  const { 
    username, 
    password, 
    email, 
    nickname, 
    interests,
    isEmailVerified 
  } = req.body;
  
  try {
    // 아이디 중복 체크
    const [existingUsers] = await pool.execute(
      'SELECT id FROM hospital_users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 사용 중인 아이디입니다.' 
      });
    }

    // 이메일 중복 체크
    const [existingEmails] = await pool.execute(
      'SELECT id FROM hospital_users WHERE email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 사용 중인 이메일입니다.' 
      });
    }

    // 닉네임 중복 체크
    const [existingNicknames] = await pool.execute(
      'SELECT id FROM hospital_users WHERE nickname = ?',
      [nickname]
    );

    if (existingNicknames.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 사용 중인 닉네임입니다.' 
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 등록
    const [result] = await pool.execute(
      `INSERT INTO hospital_users 
       (username, password, email, nickname, interests, is_email_verified) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, email, nickname, JSON.stringify(interests), isEmailVerified ? 1 : 0]
    );

    // 기본 사용자 역할 부여
    await pool.execute(
      `INSERT INTO hospital_user_roles (user_id, role_id) 
       SELECT ?, id FROM hospital_roles WHERE role_name = 'user'`,
      [result.insertId]
    );

    res.status(201).json({ 
      success: true, 
      message: '회원가입이 완료되었습니다.' 
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

module.exports = {
  router,
  authenticateToken,
  isAdmin
}; 