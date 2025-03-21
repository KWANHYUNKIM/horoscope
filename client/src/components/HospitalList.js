import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HospitalCard from "./HospitalCard";

const HospitalList = ({ hospitals, filters, userLocation }) => {
  const navigate = useNavigate();

  const handleDetailClick = (hospitalId) => {
    const searchParams = new URLSearchParams();
    
    // 현재 위치 정보 추가
    if (userLocation?.latitude && userLocation?.longitude) {
      searchParams.set('lat', userLocation.latitude);
      searchParams.set('lng', userLocation.longitude);
    }
    
    // 필터 정보 추가
    if (filters.type) {
      searchParams.set('type', filters.type);
    }
    
    navigate(`/hospital/details/${hospitalId}?${searchParams.toString()}`);
  };

  return (
    <div className="space-y-4">
      {hospitals.map((hospital) => (
        <div key={hospital.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">{hospital.name}</h3>
              <p className="text-gray-600">{hospital.address}</p>
              {/* ... other hospital info ... */}
            </div>
            <button
              onClick={() => handleDetailClick(hospital.id)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            >
              자세히 보기
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HospitalList;