import axios from 'axios';

// 초기 API URL (데이터베이스 설정을 가져오기 전까지 사용)
let apiUrl = 'http://localhost:3001';

export const initializeApi = async () => {
  try {
    // 서버 설정에서 API URL 가져오기
    const response = await axios.get(`${apiUrl}/api/admin/server-configs/current`, {
      withCredentials: true
    });
    
    if (response.data.API_URL) {
      apiUrl = response.data.API_URL;
      // axios 인스턴스의 baseURL 업데이트
      api.defaults.baseURL = apiUrl;
    }
  } catch (error) {
    console.error('API URL 설정을 가져오는데 실패했습니다:', error);
  }
};

export const getApiUrl = () => apiUrl;

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true
}); 