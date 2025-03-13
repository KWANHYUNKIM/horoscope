import axios from "axios";

// ✅ 환경 변수에서 API 서버 URL 가져오기 (없으면 기본값 사용)
const baseURL = process.env.REACT_APP_BACKEND_URI || "http://localhost:3001";

// 병원 목록 가져오기 (전체 조회)
export const fetchHospitals = async (params) => {
  try {
    const response = await axios.get(`${baseURL}/api/hospitals/search`, { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching hospitals:", error);
    throw error;
  }
};

// 병원 상세 정보 가져오기
export const fetchHospitalDetail = async (id) => {
  try {
    const response = await axios.get(`${baseURL}/api/hospitals/details/search/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching hospital detail:", error);
    throw error;
  }
};

// 자동완성 API 호출
export const fetchAutoComplete = async (query) => {
  try {
    const response = await axios.get(`${baseURL}/api/autocomplete`, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching autocomplete suggestions:", error);
    throw error;
  }
};

//console.log(`🔗 API Base URL: ${baseURL}`);
