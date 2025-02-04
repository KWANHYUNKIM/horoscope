import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";  // 쿼리 파라미터 받기
import { fetchHospitals } from "../service/api";
import FilterDropdown from "../components/FilterDropdown";

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

const filterSubjects = [
  { label: "전체", icon: "🌐"},
  { label: "상급종합", icon: "🏥" },
  { label: "보건의료원", icon: "🏥" },
  { label: "보건진료소", icon: "🏥" },
  { label: "보건지소", icon: "🏥" },
  { label: "보건소", icon: "🏥" },
  { label: "병원", icon: "🏥" },
  { label: "종합병원", icon: "🏥" },
  { label: "의원", icon: "🏥" },
  { label: "요양병원", icon: "🏥" },
  { label: "치과의원", icon: "🦷" },
  { label: "치과병원", icon: "🦷" },
  { label: "한방병원", icon: "🌿" },
  { label: "정신병원", icon: "🧠" },
  { label: "조산원", icon: "👶" }
];

const filterMajor = [
  { label: "전체", icon: "📋" },
  { label: "내과", icon: "💊" },
  { label: "외과", icon: "🔪" },
  { label: "소아과", icon: "👶" },
  { label: "치과", icon: "🦷" },
  { label: "산부인과", icon: "🤰" },
  { label: "정신건강의학과", icon: "🧠" },
  { label: "정형외과", icon: "🦴" },
  { label: "피부과", icon: "🧴" },
  { label: "이비인후과", icon: "👂" },
  { label: "한의원", icon: "🌿" },
  { label: "가정의학과", icon: "🏡" },
  { label: "결핵과", icon: "🫁" },
  { label: "구강내과", icon: "👄" },
  { label: "구강악안면외과", icon: "🦷🔪" },
  { label: "마취통증의학과", icon: "💉" },
  { label: "방사선종양학과", icon: "☢️" },
  { label: "병리과", icon: "🧬" },
  { label: "비뇨의학과", icon: "🚻" },
  { label: "사상체질과", icon: "🌀" },
  { label: "성형외과", icon: "💉✨" },
  { label: "소아청소년과", icon: "🧒" },
  { label: "소아치과", icon: "🦷👶" },
  { label: "신경과", icon: "⚡" },
  { label: "신경외과", icon: "🧠🔪" },
  { label: "심장혈관흉부외과", icon: "❤️" },
  { label: "안과", icon: "👁️" },
  { label: "영상의학과", icon: "📸" },
  { label: "영상치의학과", icon: "🦷📸" },
  { label: "예방의학과", icon: "🛡️" },
  { label: "예방치과", icon: "🦷🛡️" },
  { label: "응급의학과", icon: "🚑" },
  { label: "재활의학과", icon: "🦽" },
  { label: "직업환경의학과", icon: "🏭" },
  { label: "진단검사의학과", icon: "🔬" },
  { label: "치과교정과", icon: "🦷🔧" },
  { label: "치과보존과", icon: "🦷🛠️" },
  { label: "치과보철과", icon: "🦷🧱" },
  { label: "치주과", icon: "🦷🌱" },
  { label: "침구과", icon: "🪡" },
  { label: "통합치의학과", icon: "🦷🔄" },
  { label: "한방내과", icon: "🌿💊" },
  { label: "한방부인과", icon: "🌿🤰" },
  { label: "한방소아과", icon: "🌿👶" },
  { label: "한방신경정신과", icon: "🌿🧠" },
  { label: "한방안·이비인후·피부과", icon: "🌿👂🧴" },
  { label: "한방재활의학과", icon: "🌿🦽" },
  { label: "핵의학과", icon: "☢️🔬" }
];

const filterAdditionFilters =[
  { label: "전체", icon: "📌" },
  { label: "야간 진료", icon: "🌙" },
  { label: "24시간 진료", icon: "⏰" },
  { label: "주말 진료", icon: "📅" },
  { label: "일반 진료", icon: "🏥" },
]


const Major = [
  { label: "전체", icon: "📋" },
  { label: "내과", icon: "💊" },
  { label: "외과", icon: "🔪" },
  { label: "소아과", icon: "👶" },
  { label: "산부인과", icon: "🤰" },
  { label: "정신건강의학과", icon: "🧠" },
  { label: "정형외과", icon: "🦴" },
  { label: "이비인후과", icon: "👂" },
  { label: "가정의학과", icon: "🏡" },
  { label: "소아청소년과", icon: "🧒" },
];

const additionalFilters = [
  { label: "전체", icon: "📌" },
  { label: "야간 진료", icon: "🌙" },
  { label: "24시간 진료", icon: "⏰" },
  { label: "주말 진료", icon: "📅" },
  { label: "일반 진료", icon: "🏥" },
];

const HospitalListPage = () => {
  
  const [selectedRegion, setSelectedRegion] = useState("전국");
  const [selectedSubject, setSelectedSubject] = useState("전체");
  const [selectedAdditionalFilter, setSelectedAdditionalFilter] = useState("전체");
  const [selectedMajor, setSelectedMajor] = useState("전체");

  // 검색 쿼리 상태
  const [searchQuery, setSearchQuery] = useState("");

  // 위치 기반 검색 상태
  const [locationBased, setLocationBased] = useState(false);
  const [userLocation, setUserLocation] = useState({ x: null, y: null });

  // 병원 목록 + 페이징 정보
  const [hospitals, setHospitals] = useState([]);  // 실제 아이템 배열
  const [totalCount, setTotalCount] = useState(0); // 총 개수
  const [totalPages, setTotalPages] = useState(1); // 총 페이지 수
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);          // 페이지당 표시 개수

  // 로딩/에러
  const [, setLoading] = useState(false);
  const [, setError] = useState(null);

  const filterCategories = [
    { name: "지역", options: filterRegions, state: selectedRegion, setState: setSelectedRegion },
    { name: "타입", options: filterSubjects, state: selectedSubject, setState: setSelectedSubject },
    { name: "전공", options: filterMajor, state: selectedMajor, setState: setSelectedMajor },
    { name: "진료시간", options: filterAdditionFilters, state: selectedAdditionalFilter, setState: setSelectedAdditionalFilter },
  ];

  const handleFilterChange = (categoryName, option) => {
    console.log(`${categoryName}: ${option}`);
  
    if (categoryName === "지역") {
      setSelectedRegion(option);
    } else if (categoryName === "타입") {
      setSelectedSubject(option);
    } else if (categoryName === "전공") {
      setSelectedMajor(option);
    } else if (categoryName === "진료시간") {
      setSelectedAdditionalFilter(option);
    }
  
    setCurrentPage(1); // 페이지 초기화
  };
  
  // URL에서 쿼리 파라미터 읽어오기
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const query = params.get("query");
    const x = params.get("x");
    const y = params.get("y");

    if (category) {
      setSelectedAdditionalFilter(category);
    } else {
      setSelectedAdditionalFilter("전체");
    }

    if (query) {
      setSearchQuery(query);
      setLocationBased(false);
    } else {
      setSearchQuery("");
    }

    if (x && y) {
      setUserLocation({ x: parseFloat(x), y: parseFloat(y) });
      setLocationBased(true);
      // 선택된 필터 초기화
      setSelectedRegion("전국");
      setSelectedSubject("전체");
      setSelectedMajor("전체");
      setSelectedAdditionalFilter("전체");
    } else {
      setLocationBased(false);
    }
  }, [location]);

  // 서버 데이터 불러오기
  const fetchHospitalsFromServer = async () => {
    try {
      setLoading(true);
      setError(null);

      // '/api/hospitals/search' 에 ?page=..., &limit=..., &region=..., &subject=..., &nightCare=... 등
      const params = {
        page: currentPage,
        limit: limit,
      };

      // 검색 쿼리 추가
      if (searchQuery.trim() !== "") {
        params.query = searchQuery.trim();
      }

      // 위치 기반 검색 추가
      if (locationBased && userLocation.x !== null && userLocation.y !== null) {
        params.x = userLocation.x;
        params.y = userLocation.y;
        params.distance = "10km"; // 필요 시 동적으로 설정
      }

      // 필터가 '전체'가 아닐 경우에만 해당 파라미터 추가
      if (selectedRegion !== "전국") {
        params.region = selectedRegion;
      }

      if (selectedSubject !== "전체") {
        params.subject = selectedSubject;
      }

      if (selectedMajor !== "전체") {
        params.major = selectedMajor; // Major 필터 추가
      }

      if (selectedAdditionalFilter === "야간진료") {
        params.category = "야간진료";
      } else if (selectedAdditionalFilter === "24시간진료") {
        params.category = "24시간진료";
      } else if (selectedAdditionalFilter === "주말진료") {
        params.category = "주말진료";
      }

      const response = await fetchHospitals(params);

      
      // 구조분해: { data, totalCount, currentPage, totalPages }
      const {
        data,
        totalCount: fetchedTotalCount,
        totalPages: fetchedTotalPages,
        currentPage: fetchedCurrentPage,
      } = response.data;

      // 상태 업데이트
      setHospitals(data);
      setTotalCount(fetchedTotalCount);
      setTotalPages(fetchedTotalPages);
      setCurrentPage(fetchedCurrentPage);
    } catch (err) {
      console.error(err);
      setError("서버에서 병원 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 필터/페이지 변경 시마다 재요청
  useEffect(() => {
    fetchHospitalsFromServer();
    // eslint-disable-next-line
  }, [selectedRegion, selectedSubject, selectedAdditionalFilter, selectedMajor, currentPage, limit, searchQuery, locationBased, userLocation]);

  // 클릭 핸들러
  const handleAdditionalFilterClick = (filterLabel) => {
    setSelectedAdditionalFilter(filterLabel);
    setCurrentPage(1);
  };

  const handleMajorClick = (majorLabel) => { // Major 필터 핸들러 추가
    setSelectedMajor(majorLabel);
    setCurrentPage(1);
  };

  // 페이지네이션 버튼
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="sticky top-16 z-50 bg-gray-50">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-2xl font-bold">삐뽀삐뽀119</h1>
          <p className="text-lg mt-2">선택한 지역의 병원을 쉽게 찾아보세요</p>
          {/* 검색어 표시 */}
          {searchQuery && (
            <p className="text-md mt-1">검색어: <strong>{searchQuery}</strong></p>
          )}
          {/* 위치 기반 검색 표시 */}
          {locationBased && userLocation.x !== null && userLocation.y !== null && (
            <p className="text-md mt-1">내 주변 병원 검색 중...</p>
          )}
        </div>
      </header>
      
      {/* 필터 컨테이너 (고정형) */}
      <div className="top-0 z-50 bg-white shadow-md py-4">
      {/* Major 선택 */}
        <section className="container mx-auto mt-6 p-2 px-40">
          <div className="flex flex-wrap justify-center gap-2">
            {Major.map((m) => (
              <button
                key={m.label}
                onClick={() => handleMajorClick(m.label)}
                className={`px-3 py-1 rounded-full transition border flex items-center gap-2 ${
                  selectedMajor === m.label
                    ? "bg-purple-500 text-white border-purple-500"
                    : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-purple-100"
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 근무 시간*/}
        <section className="container mx-auto mt-6 p-2 px-40">
          <div className="flex flex-wrap justify-center gap-2">
            {additionalFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => handleAdditionalFilterClick(filter.label)}
                className={`px-3 py-1 rounded-full transition border flex items-center gap-2 ${
                  selectedAdditionalFilter === filter.label
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-yellow-100"
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 필터  */}
        <div className="container mx-auto mt-6 p-2 px-40">
          <div className="container mx-auto flex justify-center">
            <FilterDropdown categories={filterCategories}
                            onFilterChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      {/* 병원 리스트 */}
      <section className="container mx-auto mt-10 p-6 px-40">
        <div className="flex justify-between items-center mb-6">
          <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold">
            총 {totalCount} 개의 병원
          </div>
        </div>
        
        {hospitals && hospitals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {hospitals.map((hospital) => (
                <div
                key={hospital._id}
                className="relative bg-white shadow-md hover:shadow-lg rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                {/* 병원 유형 (요양병원, 일반 병원 등) */}
                {hospital.subject && (
                  <div className="absolute top-3 left-3 bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs font-semibold">
                    {hospital.subject}
                  </div>
                )}
                  {/* 병원 이미지 */}
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    {hospital.image ? (
                      <img
                        src={hospital.image}
                        onError={(e) => (e.currentTarget.src = "/image-placeholder.jpg")}
                        alt={hospital.yadmNm || "병원 이미지"}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">🖼️ 이미지 준비 중</span>
                    )}
                  </div>

                  <div className="p-4">
                    {/* 병원 이름 */}
                    <h3 className="text-lg font-bold text-gray-800">{hospital.yadmNm}</h3>

                    {/* 주소 & 지도 링크 */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex-1 truncate">{hospital.addr}</span>

                      <a
                        href={`https://map.naver.com/v5/search/${encodeURIComponent(hospital.addr)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 px-2 py-1 text-blue-500 border border-blue-300 rounded-md flex items-center gap-x-1 hover:bg-blue-100"
                      >
                        <span>지도보기</span>
                        <span role="img" aria-label="map">🗺️</span>
                      </a>
                    </div>

                    {/* 진료과 정보 */}
                    {hospital.major && hospital.major.length > 0 ? (
                      <div className="mt-2">
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
                      <div className="mt-2">
                        <p className="font-semibold text-gray-700">진료과:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="bg-gray-200 px-3 py-1 text-sm rounded-md text-gray-500">
                            정보 없음
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 진료 여부 */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`px-3 py-1 rounded-md text-sm ${
                          hospital.nightCare
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        야간 진료: {hospital.nightCare ? "가능 ✅" : "불가 ❌"}
                      </span>
                      {hospital.twentyfourCare && (
                        <span className="px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-600">
                          24시간 진료 가능
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-md text-sm ${
                          hospital.weekendCare
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        주말 진료: {hospital.weekendCare ? "가능 ✅" : "불가 ❌"}
                      </span>
                    </div>

                    {/* 상세보기 버튼 */}
                    <button
                      className="mt-2 bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition"
                      onClick={() => window.location.href = `/hospital/details/${hospital._id}`}
                    >
                      🔍 자세히 보기
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 UI */}
            <div className="flex justify-center items-center mt-6 gap-2">
              {/* 이전 페이지 버튼 */}
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                이전
              </button>

              {/* 페이지 번호 (현재 페이지 기준으로 앞뒤 5개만 표시) */}
              {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                const page = Math.max(1, currentPage - 5) + i;
                if (page > totalPages) return null; // totalPages 초과 페이지 숨김

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded ${
                      page === currentPage ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* 다음 페이지 버튼 */}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                다음
              </button>

              {/* 페이지당 개수 선택 */}
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1); // limit 변경 시 페이지를 1로 초기화
                }}
                className="ml-4 px-2 py-1 bg-white border rounded"
              >
                <option value={5}>5개씩</option>
                <option value={10}>10개씩</option>
                <option value={20}>20개씩</option>
                <option value={50}>50개씩</option>
              </select>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">선택한 조건에 맞는 병원이 없습니다.</p>
        )}
      </section>
    </div>
  );
};

export default HospitalListPage;
