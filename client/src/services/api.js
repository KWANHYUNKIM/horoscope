import axios from "axios";

// 환경 변수 REACT_APP_API_URL에서 기본 API URL을 가져옵니다.
// 환경 변수 값이 없으면 기본값으로 "http://localhost:3002/api"를 사용합니다.
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002/api";

export const fetchHospitals = async () => {
  const response = await axios.get(`${API_URL}/hospitals`);
  return response.data;
};