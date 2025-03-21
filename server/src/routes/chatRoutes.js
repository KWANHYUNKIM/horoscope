const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');

// 채팅 메시지 전송
router.post('/send', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '유효한 메시지를 입력해주세요.' });
    }

    const response = await chatService.generateResponse(userId, message);
    res.json(response);
  } catch (error) {
    console.error('채팅 응답 생성 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 채팅 세션 초기화
router.post('/reset', async (req, res) => {
  try {
    const { userId } = req.body;
    const response = await chatService.resetSession(userId);
    res.json(response);
  } catch (error) {
    console.error('세션 초기화 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 