// src/service/api.js
import axios from "axios";

const API_URL = "/api";  // Nginx 프록시 설정이 적용됨

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
