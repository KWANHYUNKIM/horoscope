const express = require('express');
const router = express.Router();
const pool = require('../config/mysql');
const { sendVerificationEmail } = require('../config/email');

// 이메일 인증 코드 전송
router.post('/send-verification', async (req, res) => {
  const { email } = req.body;
  
  try {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: '이메일 전송에 실패했습니다.' 
      });
    }

    await pool.execute(
      'INSERT INTO hospital_email_verifications (email, verification_code, expires_at, is_verified) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 MINUTE), FALSE)',
      [email, verificationCode]
    );

    res.json({ 
      success: true, 
      message: '인증 코드가 이메일로 전송되었습니다. (1분 후 만료)' 
    });
  } catch (error) {
    console.error('이메일 인증 코드 전송 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 이메일 인증 코드 확인
router.post('/verify-email', async (req, res) => {
  const { email, verificationCode } = req.body;
  
  try {
    const [verifications] = await pool.execute(
      'SELECT * FROM hospital_email_verifications WHERE email = ? AND verification_code = ? AND is_verified = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, verificationCode]
    );

    if (verifications.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않거나 만료된 인증 코드입니다.' 
      });
    }

    await pool.execute(
      'UPDATE hospital_email_verifications SET is_verified = TRUE WHERE id = ?',
      [verifications[0].id]
    );

    await pool.execute(
      'UPDATE hospital_users SET is_email_verified = TRUE WHERE email = ?',
      [email]
    );

    res.json({ 
      success: true, 
      message: '이메일 인증이 완료되었습니다.' 
    });
  } catch (error) {
    console.error('이메일 인증 확인 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

module.exports = router; 