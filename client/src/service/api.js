// src/service/api.js
import axios from "axios";

// 프록시 대신 실제 API 서버의 URL을 사용합니다.
// 환경에 따라 baseURL 설정
const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://my-server-284451238916.asia-northeast3.run.app"  // Cloud Run 배포 URL
    : "http://localhost:3001";          // 로컬 API URL

// 병원 목록 가져오기 (전체 조회)
export const fetchHospitals = async (params) => {
  try {
    const response = await axios.get(`${baseURL}/api/hospitals/search`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    throw error;
  }
};

// 병원 상세 정보 가져오기 (ID를 URL 파라미터로 전달)
// 서버 측에서는 app.use('/api/hospitals/details/search', hospitalDetailSearchRoutes)로 라우팅됩니다.
export const fetchHospitalDetail = async (id) => {
  try {
    const response = await axios.get(`${baseURL}/api/hospitals/details/search/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching hospital detail:", error);
    throw error;
  }
};
