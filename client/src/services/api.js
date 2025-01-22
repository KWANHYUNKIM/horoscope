import axios from "axios";

export const fetchHospitals = async () => {
  const response = await axios.get("http://localhost:3001/api/hospitals");
  return response.data;
};