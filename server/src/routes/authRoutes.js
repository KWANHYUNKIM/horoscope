const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/mysql');
const User = require('../models/User');
const axios = require('axios');
const SocialConfig = require('../models/SocialConfig');

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

// 이메일 중복 확인 API
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: '이메일이 필요합니다.' });
    }

    const user = await User.findByEmail(email);
    
    return res.json({
      exists: !!user,
      message: user ? '이미 가입된 이메일입니다.' : '사용 가능한 이메일입니다.'
    });
  } catch (error) {
    console.error('이메일 중복 확인 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 네이버 로그인 콜백 처리
router.post('/naver/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    // 네이버 액세스 토큰 받기
    const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code,
        state
      }
    });

    const { access_token } = tokenResponse.data;

    // 네이버 사용자 정보 가져오기
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userInfo = userResponse.data.response;
    
    // DB에서 사용자 찾기 또는 생성
    let user = await User.findOne({ where: { social_id: userInfo.id, social_provider: 'naver' } });

    if (!user) {
      // 새 사용자 생성
      user = await User.create({
        username: `naver_${userInfo.id}`,
        email: userInfo.email,
        nickname: userInfo.nickname || `네이버사용자${userInfo.id.slice(-4)}`,
        social_id: userInfo.id,
        social_provider: 'naver',
        profile_image: userInfo.profile_image,
        is_email_verified: true
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 쿠키에 토큰 저장
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24시간
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('네이버 로그인 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '네이버 로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 소셜 로그인 설정 조회
router.get('/social-config/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const [rows] = await pool.query(
      'SELECT client_id, redirect_uri FROM hospital_social_configs WHERE provider = ? AND is_active = 1',
      [provider]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '설정을 찾을 수 없거나 비활성화되어 있습니다.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('소셜 설정 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = {
  router,
  authenticateToken,
  isAdmin
}; 