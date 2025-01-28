// HospitalListPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";  // 쿼리 파라미터 받기
import axios from "axios";

// 지역/과목/추가필터 목록 (기존 유지)
const regions = [
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

const subjects = [
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
const major = [
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

const additionalFilters = [
  { label: "전체", icon: "📌" },
  { label: "야간 진료", icon: "🌙" },
  { label: "24시간 진료", icon: "⏰" },
  { label: "주말 진료", icon: "📅" },
  { label: "일반 진료", icon: "🏥" },
];

const HospitalListPage = () => {
  // 필터 상태
  const [selectedRegion, setSelectedRegion] = useState("전국");
  const [selectedSubject, setSelectedSubject] = useState("전체");
  const [selectedAdditionalFilter, setSelectedAdditionalFilter] = useState("전체");
  const [selectedMajor, setSelectedMajor] = useState("전체");

  // 병원 목록 + 페이징 정보
  const [hospitals, setHospitals] = useState([]);  // 실제 아이템 배열
  const [totalCount, setTotalCount] = useState(0); // 총 개수
  const [totalPages, setTotalPages] = useState(1); // 총 페이지 수
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);          // 페이지당 표시 개수

  // 로딩/에러
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // URL에서 category 읽어오기 (필요 시)
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    if (category) {
      setSelectedAdditionalFilter(category);
    } else {
      setSelectedAdditionalFilter("전체");
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
        params.nightCare = true;
      } else if (selectedAdditionalFilter === "24시간진료") {
        params.twentyfourCare = true;
      } else if (selectedAdditionalFilter === "주말진료") {
        params.weekendCare = true;
      }

      const response = await axios.get("/api/hospitals/search", { // 'filter'에서 'search'로 변경
        params: params,
      });

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
  }, [selectedRegion, selectedSubject, selectedAdditionalFilter, selectedMajor, currentPage, limit]);

  // 클릭 핸들러
  const handleRegionClick = (regionLabel) => {
    setSelectedRegion(regionLabel);
    // 페이지를 1로 초기화해서 새 검색
    setCurrentPage(1);
  };
  const handleSubjectClick = (subjectLabel) => {
    setSelectedSubject(subjectLabel);
    setCurrentPage(1);
  };
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

  // 로딩/에러
  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="sticky top-16 z-50 bg-gray-50">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-3xl font-bold">삐뽀삐뽀119</h1>
          <p className="text-lg mt-2">선택한 지역의 병원을 쉽게 찾아보세요</p>
        </div>
      </header>

      {/* 지역 선택 */}
      <section className="container mx-auto mt-4 p-2">
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 justify-center">
        {regions.map((region) => (
          <div
            key={region.label}
            onClick={() => handleRegionClick(region.label)}
            className={`text-center cursor-pointer transition ${
              selectedRegion === region.label
                ? "bg-blue-100 border-blue-500"
                : "bg-gray-100 border-gray-300"
            } rounded-lg shadow-md hover:shadow-lg p-2 border`}
          >
            <div className="text-2xl mb-1">{region.icon}</div>
            <p className="text-xs font-medium text-gray-700">{region.label}</p>
          </div>
        ))}
      </div>
    </section>

      {/* 진료과목 선택 */}
      <section className="container mx-auto mt-8 p-4">
        <div className="flex flex-wrap justify-center gap-2">
          {subjects.map((subject) => (
            <button
              key={subject.label}
              onClick={() => handleSubjectClick(subject.label)}
              className={`px-6 py-3 rounded-full transition border flex items-center gap-2 ${
                selectedSubject === subject.label
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-green-100"
              }`}
            >
              <span>{subject.icon}</span>
              <span>{subject.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Major 선택 */}
      <section className="container mx-auto mt-8 p-4">
        <div className="flex flex-wrap justify-center gap-2">
          {major.map((m) => (
            <button
              key={m.label}
              onClick={() => handleMajorClick(m.label)}
              className={`px-6 py-3 rounded-full transition border flex items-center gap-2 ${
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

      {/* 추가 필터 */}
      <section className="container mx-auto mt-8 p-4">
        <div className="flex flex-wrap justify-center gap-2">
          {additionalFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleAdditionalFilterClick(filter.label)}
              className={`px-6 py-3 rounded-full transition border flex items-center gap-2 ${
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

      {/* 병원 리스트 */}
      <section className="container mx-auto mt-10 p-6">
        {hospitals && hospitals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitals.map((hospital) => (
                <div
                  key={hospital._id} // Elasticsearch 검색 결과에서는 '_id'가 아닌 'ykiho' 등으로 설정될 수 있습니다.
                  className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-2xl transition"
                >
                  <img
                    src={hospital.image || "https://via.placeholder.com/300x200"}
                    alt={hospital.yadmNm}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      {hospital.yadmNm}
                    </h3>
                    <p className="text-sm text-gray-500">{hospital.addr}</p>

                    {/* 진료과 정보 */}
                    {hospital.major && hospital.major.length > 0 ? (
                      <div className="mt-2">
                        <p className="font-semibold text-gray-700">진료과:</p>
                        <ul className="list-disc list-inside text-sm text-gray-500">
                          {hospital.major.map((major, index) => (
                            <li key={index}>{major}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">진료과 정보 없음</p>
                    )}

                    {/* 야간 여부 */}
                    <p className={`mt-2 ${hospital.nightCare ? "text-green-500" : "text-red-500"}`}>
                      야간 진료: {hospital.nightCare ? "가능" : "불가"}
                    </p>

                    {/* 24시간 진료 여부 */}
                    {hospital.twentyfourCare && (
                      <p className="text-blue-500">24시간 진료 가능</p>
                    )}

                    {/* 주말 진료 여부 */}
                    <p className={`${hospital.weekendCare ? "text-green-500" : "text-red-500"}`}>
                      주말 진료: {hospital.weekendCare ? "가능" : "불가"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 UI */}
            <div className="flex justify-center items-center mt-6 gap-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                이전
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                다음
              </button>

              {/* 페이지당 표시 개수 선택 */}
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1); // limit 변경 시 페이지를 1로 초기화
                }}
                className="ml-4"
              >
                <option value={5}>5개씩</option>
                <option value={10}>10개씩</option>
                <option value={20}>20개씩</option>
                <option value={50}>50개씩</option>
              </select>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">
            선택한 조건에 맞는 병원이 없습니다.
          </p>
        )}
      </section>
    </div>
  );
};

export default HospitalListPage;
