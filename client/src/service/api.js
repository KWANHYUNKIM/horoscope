// src/service/api.js
import axios from "axios";

// 프록시 대신 실제 API 서버의 URL을 사용합니다.
const API_URL = "http://localhost:3002/api";

// 병원 목록 가져오기 (전체 조회)
export const fetchHospitals = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/hospitals/search`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    throw error;
  }
};
