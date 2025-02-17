// src/pages/HospitalDetailPage.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const HospitalDetailPage = () => {
  const { id } = useParams(); // URL에서 id 가져오기
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  // 병원 상세 정보 API 호출
  const baseUrl =
  process.env.NODE_ENV === "production"
    ? "https://my-server-284451238916.asia-northeast3.run.app" // 운영용
    : "http://localhost:3001";          // 로컬 개발용

useEffect(() => {
  const fetchHospital = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/api/hospitals/details/search/${id}`
      );
      if (!response.ok) {
        throw new Error("병원 정보를 가져오는데 실패했습니다.");
      }
      const data = await response.json();
      setHospital(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchHospital();

}, [id, baseUrl]);
  if (loading)
    return <div className="text-center mt-10">🔄 로딩 중...</div>;
  if (error)
    return (
      <div className="text-center text-red-500 mt-10">❌ {error}</div>
    );
  if (!hospital)
    return (
      <div className="text-center mt-10">
        ❌ 병원 정보를 찾을 수 없습니다.
      </div>
    );

  // 요일별 운영 시간: Monday ~ Sunday, 그리고 추가 정보 항목
  const dayKeys = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const dayMap = {
    Monday: "월요일",
    Tuesday: "화요일",
    Wednesday: "수요일",
    Thursday: "목요일",
    Friday: "금요일",
    Saturday: "토요일",
    Sunday: "일요일",
  };
  const extraInfo = [
    { label: "점심시간", key: "lunch" },
    { label: "평일 접수", key: "receptionWeek" },
    { label: "토요일 접수", key: "receptionSat" },
    { label: "휴진", key: "noTreatmentHoliday" },
    { label: "응급실(주간)", key: "emergencyDay" },
    { label: "응급실(야간)", key: "emergencyNight" },
  ];

  return (
    <section className="container mx-auto mt-10 p-6 px-4 md:px-40">
      <div className="bg-white shadow-md hover:shadow-lg rounded-lg overflow-hidden transition-transform duration-300">
        {/* 병원 이미지 */}
        {hospital.image && !imgError ? (
          <img
            src={hospital.image}
            alt={hospital.yadmNm}
            className="w-full h-64 object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-sm">🖼️ 이미지 준비 중</span>
          </div>
        )}

        <div className="p-6">
          {/* 병원 기본 정보 */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {hospital.yadmNm}
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-500 mb-4">
            <span className="flex-1 truncate">{hospital.addr}</span>
            <a
              href={`https://map.naver.com/v5/search/${encodeURIComponent(
                hospital.addr
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 sm:mt-0 sm:ml-2 px-2 py-1 text-blue-500 border border-blue-300 rounded-md flex items-center gap-x-1 hover:bg-blue-100"
            >
              지도보기
              <span role="img" aria-label="map">
                🗺️
              </span>
            </a>
          </div>

          {/* 진료과 정보 */}
          {hospital.major && hospital.major.length > 0 ? (
            <div className="mb-4">
              <p className="font-semibold text-gray-700">진료과:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {hospital.major.map((major, index) => (
                  <span
                    key={index}
                    className="bg-gray-200 px-3 py-1 text-sm rounded-md"
                  >
                    {major}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="font-semibold text-gray-700">진료과:</p>
              <span className="bg-gray-200 px-3 py-1 text-sm rounded-md text-gray-500">
                정보 없음
              </span>
            </div>
          )}

          {/* 운영 시간 테이블 */}
          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-4">운영 시간</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border border-gray-200 text-left">
                      요일
                    </th>
                    <th className="px-4 py-2 border border-gray-200 text-left">
                      시간
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dayKeys.map((day) => (
                    <tr key={day} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border border-gray-200 font-medium">
                        {dayMap[day] || day} {/* 영어 요일을 한국어로 변환 */}
                      </td>
                      <td className="px-4 py-2 border border-gray-200">
                        {hospital.schedule && hospital.schedule[day]
                          ? hospital.schedule[day]
                          : "운영 정보 없음"}
                      </td>
                    </tr>
                  ))}
              </tbody>
              </table>
            </div>
          </div>

          {/* 추가 정보 영역 */}
          <div>
            <h4 className="text-xl font-semibold mb-2">추가 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {extraInfo.map(({ label, key }) => (
                <div
                  key={key}
                  className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
                >
                  <p className="text-gray-600 text-sm">{label}</p>
                  <p className="text-lg font-medium text-gray-800">
                    {(key === "emergencyDay" || key === "emergencyNight") ? (
                      hospital.schedule && hospital.schedule[key] === "Y"
                        ? "가능 ✅"
                        : "불가 ❌"
                    ) : (
                      hospital.schedule && hospital.schedule[key]
                        ? hospital.schedule[key]
                        : "정보 없음"
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HospitalDetailPage;
