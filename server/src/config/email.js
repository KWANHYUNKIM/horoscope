require('dotenv').config();
const nodemailer = require('nodemailer');

// 환경 변수 확인
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('이메일 설정 오류: EMAIL_USER 또는 EMAIL_PASS가 설정되지 않았습니다.');
  throw new Error('이메일 설정이 필요합니다.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true // 디버그 모드 활성화
});

const sendVerificationEmail = async (email, verificationCode) => {
  try {
    if (!email || !verificationCode) {
      throw new Error('이메일과 인증 코드가 필요합니다.');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '[삐뽀삐뽀119] 이메일 인증 코드',
      html: `
        <div style="font-family: 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://bippobippo119.com/logo.png" alt="삐뽀삐뽀119 로고" style="max-width: 200px; height: auto;">
          </div>
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
            <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 20px;">이메일 인증</h1>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">아래 인증 코드를 입력해주세요</p>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; display: inline-block; border: 2px dashed #e9ecef;">
              <span style="font-size: 28px; font-weight: bold; color: #3498db; letter-spacing: 5px;">${verificationCode}</span>
            </div>
            <p style="color: #e74c3c; font-size: 14px; margin-top: 20px;">※ 이 인증 코드는 1분 후 만료됩니다.</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px;">본 메일은 발신전용입니다.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('이메일 전송 성공:', info.messageId);
    return true;
  } catch (error) {
    console.error('이메일 전송 에러:', error);
    throw error; // 상위에서 에러를 처리할 수 있도록 에러를 다시 던집니다
  }
};

module.exports = {
  sendVerificationEmail,
  transporter
}; 