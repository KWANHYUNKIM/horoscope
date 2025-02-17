import React, { useState, useEffect } from "react";

const DistanceInfo = ({ hospitalLocation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("현재 브라우저에서 위치 서비스를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });

        // 병원 위치가 존재하는 경우 거리 계산
        if (hospitalLocation) {
          const dist = calculateDistance(latitude, longitude, hospitalLocation.lat, hospitalLocation.lon);
          setDistance(dist);
        }
      },
      (error) => {
        console.error("위치 정보를 가져오는 중 오류 발생:", error);
      }
    );
  }, [hospitalLocation]); // 병원 위치가 바뀔 때마다 다시 실행

  // Haversine 공식으로 거리 계산
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반지름 (km)
    const toRad = (deg) => (deg * Math.PI) / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 거리 반환 (km 단위)
  };

  // 거리를 미터(m)로 변환 (1km 미만일 경우)
  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m`; // 미터 단위로 변환
    }
    return `${distance.toFixed(2)} km`; // km 단위 유지
  };

  return (
    <>
      {distance !== null && (
        <div className="mt-1 text-sm text-gray-600">
          📍 현재 위치에서 {formatDistance(distance)}
        </div>
      )}
    </>
  );
};

export default DistanceInfo;
