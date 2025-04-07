import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-secret-key-32-characters-long';

// 짧은 ID 생성 (8자리)
export const generateShortId = (text) => {
  return CryptoJS.SHA256(text).toString().substring(0, 8);
};

// 암호화
export const encrypt = (text) => {
  try {
    // 짧은 ID 생성
    const shortId = generateShortId(text);
    
    // AES 암호화
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    
    // 짧은 ID와 암호화된 데이터를 콜론으로 구분하여 반환
    return `${shortId}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

// 복호화
export const decrypt = (text) => {
  const textParts = text.split(':');
  if (textParts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }

  const encrypted = textParts[1];
  const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return decrypted.toString(CryptoJS.enc.Utf8);
};

// ID 암호화/복호화 유틸리티 함수
export const encryptId = (id) => {
  try {
    // 짧은 ID 생성
    const shortId = generateShortId(id);
    
    // AES 암호화
    const encrypted = CryptoJS.AES.encrypt(id.toString(), ENCRYPTION_KEY).toString();
    
    // 짧은 ID와 암호화된 데이터를 콜론으로 구분하여 반환
    return `${shortId}:${encrypted}`;
  } catch (error) {
    console.error('ID 암호화 실패:', error);
    return id;
  }
};

export const decryptId = (encryptedId) => {
  try {
    const textParts = encryptedId.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted ID format');
    }

    const encrypted = textParts[1];
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('ID 복호화 실패:', error);
    return encryptedId;
  }
}; 