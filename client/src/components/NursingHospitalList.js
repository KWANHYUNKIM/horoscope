import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHospitals } from "../service/api";
import HospitalMajorList from "./HospitalMajorList";
import OperatingStatus from "./OperatingStatus";
import DistanceInfo from "./DistanceInfo";
import HealthCenterBanner from './HealthCenterBanner';
import { encryptId } from '../utils/encryption';

const filterRegions = [
  { label: "전국", icon: "🌍" },
  { label: "서울", icon: "🏙️" },
  { label: "경기", icon: "🏞️" },
  { label: "부산", icon: "🌊" },
  { label: "경남", icon: "🌾" },
  { label: "대구", icon: "🏞️" },
  { label: "인천", icon: "✈️" },
  { label: "경북", icon: "🌾" },
  { label: "전북", icon: "🌻" },
  { label: "충남", icon: "🌳" },
  { label: "전남", icon: "🌻" },
  { label: "대전", icon: "🌳" },
  { label: "광주", icon: "🌻" },
  { label: "충북", icon: "🌳" },
  { label: "강원", icon: "⛰️" },
  { label: "울산", icon: "🌾" },
  { label: "제주", icon: "🏝️" },
  { label: "세종시", icon: "🏢" },
];

const NursingHospitalList = () => {
  const navigate = useNavigate();
  // 상태 관리
  const [hospitals, setHospitals] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 필터 상태
  const [selectedRegion, setSelectedRegion] = useState("전국");

  // 데이터 가져오기
  const fetchHospitalsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: limit,
        category: "요양병원", // 요양병원만 필터링
      };

      // 지역 필터 적용
      if (selectedRegion !== "전국") {
        params.region = selectedRegion;
      }

      const response = await fetchHospitals(params);
      
      const {
        data,
        totalCount: fetchedTotalCount,
        totalPages: fetchedTotalPages,
        currentPage: fetchedCurrentPage,
      } = response;

      setHospitals(data);
      setTotalCount(fetchedTotalCount);
      setTotalPages(fetchedTotalPages);
      setCurrentPage(fetchedCurrentPage);
    } catch (err) {
      console.error(err);
      setError("요양병원 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 페이지나 필터 변경시 데이터 다시 가져오기
  useEffect(() => {
    fetchHospitalsData();
  }, [currentPage, limit, selectedRegion]);

  // 페이지네이션 핸들러
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleHospitalClick = (hospitalId) => {
    console.log('Hospital clicked:', hospitalId);
    navigate(`/nursing-hospitals/${hospitalId}`);
  };

  return (
    <div className="sticky top-16 z-50 bg-gray-50">
      {/* 건강증진센터 배너 */}
      <HealthCenterBanner />
      
      {/* 필터 섹션 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto p-4 px-4 md:px-40">
          <h2 className="text-xl font-bold mb-4">요양병원 찾기</h2>
          
          {/* 지역 필터 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">지역</h3>
            <div className="flex flex-wrap gap-2">
              {filterRegions.map((region) => (
                <button
                  key={region.label}
                  onClick={() => setSelectedRegion(region.label)}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition
                    ${selectedRegion === region.label
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  <span>{region.icon}</span>
                  <span>{region.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 병원 리스트 */}
      <section className="container mx-auto mt-10 p-6 px-4 md:px-40">
        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold">
                총 {totalCount}개의 요양병원
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hospitals.map((hospital) => (
                <div 
                  key={hospital._id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleHospitalClick(hospital._id)}
                >
                  {/* 병원 이미지 */}
                  <div className="w-full h-[180px] bg-gray-200 flex items-center justify-center relative">
                    {/* 병원 유형 및 위탁병원 정보 */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs font-semibold">
                        {hospital.category || '요양병원'}
                      </div>
                      {hospital.veteran_hospital && (
                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs font-semibold">
                          위탁병원
                        </div>
                      )}
                    </div>
                    {hospital.image ? (
                      <img
                        src={hospital.image}
                        onError={(e) => (e.currentTarget.src = "/image-placeholder.jpg")}
                        alt={hospital.yadmNm || "병원 이미지"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">🖼️ 이미지 준비 중</span>
                    )}
                  </div>

                  {/* 병원 정보 */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-1">{hospital.yadmNm}</h3>
                    <p className="text-gray-600 text-sm mb-2">{hospital.addr}</p>

                    {/* 진료과 정보 */}
                    <HospitalMajorList majors={hospital.subjects?.map(subject => subject.dgsbjtCdNm) || []} />

                    {/* 거리 정보 */}
                    <DistanceInfo hospitalLocation={hospital.location} />

                    {/* 운영 정보 */}
                    <div className="mt-2">
                      <p className="font-semibold text-gray-700">🕒 영업 여부:</p>
                      {hospital.times ? (
                        <div className="mt-1">
                          <div className="text-sm">
                            <div className="flex items-center justify-between">
                              <span>
                                <span className="font-medium">
                                  {(() => {
                                    const days = ['일', '월', '화', '수', '목', '금', '토'];
                                    return days[new Date().getDay()];
                                  })()}:
                                </span>
                                {(() => {
                                  const now = new Date();
                                  const currentHour = now.getHours();
                                  const currentMinute = now.getMinutes();
                                  const currentTime = currentHour * 60 + currentMinute;

                                  const today = now.getDay();
                                  const dayMap = {
                                    0: { start: hospital.times?.trmtSunStart, end: hospital.times?.trmtSunEnd },
                                    1: { start: hospital.times?.trmtMonStart, end: hospital.times?.trmtMonEnd },
                                    2: { start: hospital.times?.trmtTueStart, end: hospital.times?.trmtTueEnd },
                                    3: { start: hospital.times?.trmtWedStart, end: hospital.times?.trmtWedEnd },
                                    4: { start: hospital.times?.trmtThuStart, end: hospital.times?.trmtThuEnd },
                                    5: { start: hospital.times?.trmtFriStart, end: hospital.times?.trmtFriEnd },
                                    6: { start: hospital.times?.trmtSatStart, end: hospital.times?.trmtSatEnd }
                                  };

                                  const todayTime = dayMap[today];
                                  if (!todayTime || !todayTime.start || !todayTime.end) return '휴무';

                                  // 시간 문자열이 아닌 경우 처리
                                  if (typeof todayTime.start !== 'string' || typeof todayTime.end !== 'string') return '휴무';

                                  const startTime = todayTime.start.split(':').map(Number);
                                  const endTime = todayTime.end.split(':').map(Number);
                                  
                                  if (startTime.length !== 2 || endTime.length !== 2) return '휴무';
                                  
                                  const startMinutes = startTime[0] * 60 + startTime[1];
                                  const endMinutes = endTime[0] * 60 + endTime[1];

                                  // 점심시간 체크
                                  if (hospital.times?.lunchWeek && typeof hospital.times.lunchWeek === 'string') {
                                    const lunchTimes = hospital.times.lunchWeek.split('~');
                                    if (lunchTimes.length === 2) {
                                      const lunchStart = lunchTimes[0].split(':').map(Number);
                                      const lunchEnd = lunchTimes[1].split(':').map(Number);
                                      
                                      if (lunchStart.length === 2 && lunchEnd.length === 2) {
                                        const lunchStartMinutes = lunchStart[0] * 60 + lunchStart[1];
                                        const lunchEndMinutes = lunchEnd[0] * 60 + lunchEnd[1];

                                        if (currentTime >= lunchStartMinutes && currentTime <= lunchEndMinutes) {
                                          return `브레이크타임 (${todayTime.start}~${todayTime.end})`;
                                        }
                                      }
                                    }
                                  }

                                  if (currentTime >= startMinutes && currentTime <= endMinutes) {
                                    return `영업중 (${todayTime.start}~${todayTime.end})`;
                                  } else {
                                    return `영업종료 (${todayTime.start}~${todayTime.end})`;
                                  }
                                })()}
                              </span>
                              <button 
                                className="text-blue-600 hover:text-blue-800"
                                onClick={(e) => {
                                  const details = e.currentTarget.nextElementSibling;
                                  details.classList.toggle('hidden');
                                  e.currentTarget.querySelector('span').textContent = 
                                    details.classList.contains('hidden') ? '▼' : '▲';
                                }}
                              >
                                <span>▼</span>
                              </button>
                            </div>
                            <div className="hidden mt-2 space-y-1">
                              <div><span className="font-medium">월요일:</span> {hospital.times?.trmtMonStart}~{hospital.times?.trmtMonEnd}</div>
                              <div><span className="font-medium">화요일:</span> {hospital.times?.trmtTueStart}~{hospital.times?.trmtTueEnd}</div>
                              <div><span className="font-medium">수요일:</span> {hospital.times?.trmtWedStart}~{hospital.times?.trmtWedEnd}</div>
                              <div><span className="font-medium">목요일:</span> {hospital.times?.trmtThuStart}~{hospital.times?.trmtThuEnd}</div>
                              <div><span className="font-medium">금요일:</span> {hospital.times?.trmtFriStart}~{hospital.times?.trmtFriEnd}</div>
                              <div><span className="font-medium">토요일:</span> {hospital.times?.trmtSatStart}~{hospital.times?.trmtSatEnd}</div>
                              <div><span className="font-medium">일요일:</span> {hospital.times?.trmtSunStart}~{hospital.times?.trmtSunEnd}</div>
                              <div className="mt-2"><span className="font-medium">점심시간:</span> {hospital.times?.lunchWeek}</div>
                              <div><span className="font-medium">접수시간:</span> {hospital.times?.rcvWeek}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">영업시간 정보 없음</div>
                      )}
                    </div>

                    {/* 전화번호 */}
                    <div className="mt-2">
                      <p className="font-semibold text-gray-700">📞 전화번호:</p>
                      {hospital.telno ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-blue-600 font-medium">{hospital.telno}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${hospital.telno}`;
                            }}
                            className="ml-auto bg-blue-500 text-white px-2 py-1 text-sm rounded-md hover:bg-blue-600 transition"
                          >
                            📞 바로통화
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-500">전화번호 정보 없음</p>
                      )}
                    </div>

                    {/* 진료 여부 */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-md text-sm ${
                        hospital.nightCare ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}>
                        응급 야간 진료: {hospital.nightCare ? "가능 ✅" : "불가 ❌"}
                      </span>
                      <span className={`px-3 py-1 rounded-md text-sm ${
                        hospital.weekendCare ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}>
                        응급 주말 진료: {hospital.weekendCare ? "가능 ✅" : "불가 ❌"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            <div className="flex justify-center items-center mt-6 gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                이전
              </button>
              <span className="mx-4">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                다음
              </button>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-4 px-2 py-1 bg-white border rounded"
              >
                <option value={10}>10개씩</option>
                <option value={20}>20개씩</option>
                <option value={50}>50개씩</option>
              </select>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default NursingHospitalList; 