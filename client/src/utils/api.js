import axios from 'axios';

// 초기 API URL (데이터베이스 설정을 가져오기 전까지 사용)
let API_URL = 'http://localhost:3001';

// 서버 설정에서 API URL 가져오기
const fetchServerConfig = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/admin/server-config`, {
      withCredentials: true
    });
    if (response.data && response.data.apiUrl) {
      API_URL = response.data.apiUrl;
    }
  } catch (error) {
    console.error('서버 설정 로딩 실패:', error);
  }
};

// 초기 설정 로드
fetchServerConfig();

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export { api };

export const getApiUrl = () => API_URL; 