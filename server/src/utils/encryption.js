const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-characters-long';

// 짧은 ID 생성 (8자리)
const generateShortId = (text) => {
  return CryptoJS.SHA256(text).toString().substring(0, 8);
};

// 복호화
const decrypt = (text) => {
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }

    const shortId = textParts[0];
    const encrypted = textParts[1];
    
    // AES 복호화
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    // 짧은 ID 검증
    const expectedShortId = generateShortId(decryptedText);
    if (shortId !== expectedShortId) {
      console.error('Invalid short ID:', {
        received: shortId,
        expected: expectedShortId,
        decryptedText
      });
      throw new Error('Invalid short ID');
    }
    
    return decryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt');
  }
};

module.exports = { decrypt }; 