import React, { useState, useEffect } from "react";
import axios from "axios";

const regions = [
  { label: "전국", icon: "🌍" },
  { label: "서울", icon: "🏙️" },
  { label: "부산", icon: "🌊" },
  { label: "제주", icon: "🏝️" },
  { label: "경기", icon: "🏞️" },
  { label: "인천", icon: "✈️" },
  { label: "강원", icon: "⛰️" },
  { label: "경상", icon: "🌾" },
  { label: "전라", icon: "🌻" },
  { label: "충청", icon: "🌳" },
];

const subjects = [
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
  { label: "한의원", icon: "🌿" }
];

const additionalFilters = [
  { label: "전체", icon: "📌" },
  { label: "야간 진료", icon: "🌙" },
  { label: "24시간 진료", icon: "⏰" },
  { label: "주말 진료", icon: "📅" },
  { label: "일반 진료", icon: "🏥" },
];

const HospitalListPage = () => {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedAdditionalFilter, setSelectedAdditionalFilter] = useState("전체");
  
  const [hospitals, setHospitals] = useState([]); // 서버에서 받아온 병원 목록
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // 1) 서버에서 병원 목록 가져오기
  // - region, subject 등을 사용해 서버 API에 쿼리 파라미터로 보낼 수도 있음.
  const fetchHospitalsFromServer = async (regionParam, subjectParam) => {
    try {
      setLoading(true);
      setError(null);

      // 서버 쪽에서 region, subject로 필터하도록 쿼리 파라미터 전송
      const response = await axios.get("/api/hospitals/list", {
        params: {
          region: regionParam,
          subject: subjectParam,
        },
      });

      // 서버 응답: 병원 배열
      setHospitals(response.data);
    } catch (err) {
      console.error(err);
      setError("서버에서 병원 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2) 컴포넌트 초기 렌더 시 전체/전국 목록을 불러옴(또는 원하는 기본 조건)
  useEffect(() => {
    fetchHospitalsFromServer("", "");
  }, []);

  // 3) 클릭 시, region/subject를 바꾸고 서버 재요청 (또는 클라이언트 필터)
  // 여기서는 간단히 "선택했을 때 서버에다 새로 요청" 방식을 예시
  // 만약 모든 필터를 한 번에 사용해야 한다면, useEffect + dependency 배열로 묶을 수도 있음.
  const handleRegionClick = (regionLabel) => {
    setSelectedRegion(regionLabel);
    // 다시 서버에 요쳥
    fetchHospitalsFromServer(regionLabel, selectedSubject);
  };

  const handleSubjectClick = (subjectLabel) => {
    setSelectedSubject(subjectLabel);
    // 다시 서버에 요쳥
    fetchHospitalsFromServer(selectedRegion, subjectLabel);
  };

  // --- 추가필터(야간진료 등)는 서버/클라이언트 중 어디서 필터링할지 결정 ---
  // 여기서는 예시로 클라이언트단에서만 처리 (hospitals 데이터 받았다 가정)
  // 실제로는 서버 파라미터로 `additionalFilter` 전달해도 좋음.
  const handleAdditionalFilterClick = (filterLabel) => {
    setSelectedAdditionalFilter(filterLabel);
  };

  // 4) 실제 화면에 뿌릴 "최종 필터된 병원"
  //   - region/subject는 이미 서버 필터로 걸러졌다고 가정
  //   - additionalFilter만 클라이언트에서 추가적으로 거른다고 예시
  const finalFilteredHospitals = hospitals.filter((hospital) => {
    let matchesAdditionalFilter = true;
    
    // schedule 필드가 있다고 가정
    const schedule = hospital.schedule || {};
    const currentHours = schedule[today] || "운영 시간 정보 없음";

    if (selectedAdditionalFilter === "야간 진료") {
      // 여기선 "18시 이후 영업"이라는 조건 예시
      // 실제 DB 정보, 구조에 맞게 조건을 바꿔야 함.
      matchesAdditionalFilter = currentHours.includes("18:00");
    } else if (selectedAdditionalFilter === "24시간 진료") {
      matchesAdditionalFilter = currentHours === "24시간";
    } else if (selectedAdditionalFilter === "주말 진료") {
      // 주말(토/일) 중 하나라도 "휴무" 아니면 OK
      const sat = schedule["Saturday"];
      const sun = schedule["Sunday"];
      matchesAdditionalFilter =
        (sat && sat !== "휴무") || (sun && sun !== "휴무");
    } 
    // etc. "전체", "일반 진료"는 필터 X

    return matchesAdditionalFilter;
  });

  // --- 렌더링 ---
  if (loading) {
    return <div>로딩 중...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-3xl font-bold">삐뽀삐뽀119</h1>
          <p className="text-lg mt-2">선택한 지역의 병원을 쉽게 찾아보세요</p>
        </div>
      </header>

      {/* 지역 선택 */}
      <section className="container mx-auto mt-8 p-6">
        <div className="grid grid-cols-5 gap-6 justify-center">
          {regions.map((region) => (
            <div
              key={region.label}
              className={`text-center cursor-pointer transition ${
                selectedRegion === region.label
                  ? "bg-blue-100 border-blue-500"
                  : "bg-gray-100 border-gray-300"
              } rounded-lg shadow-md hover:shadow-lg p-4 border`}
              onClick={() => handleRegionClick(region.label)}
            >
              <div className="text-4xl mb-2">{region.icon}</div>
              <p className="text-sm font-medium text-gray-700">
                {region.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 진료과목 선택 */}
      <section className="container mx-auto mt-8 p-6">
        <div className="flex flex-wrap justify-center gap-4">
          {subjects.map((subject) => (
            <button
              key={subject.label}
              className={`px-6 py-3 rounded-full transition border flex items-center gap-2 ${
                selectedSubject === subject.label
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-green-100"
              }`}
              onClick={() => handleSubjectClick(subject.label)}
            >
              <span>{subject.icon}</span>
              <span>{subject.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 추가 필터 */}
      <section className="container mx-auto mt-8 p-6">
        <div className="flex flex-wrap justify-center gap-4">
          {additionalFilters.map((filter) => (
            <button
              key={filter.label}
              className={`px-6 py-3 rounded-full transition border flex items-center gap-2 ${
                selectedAdditionalFilter === filter.label
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-yellow-100"
              }`}
              onClick={() => handleAdditionalFilterClick(filter.label)}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 병원 리스트 */}
      <section className="container mx-auto mt-10 p-6">
        {finalFilteredHospitals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalFilteredHospitals.map((hospital) => {
              // 스케줄/영업여부 표시 로직
              const schedule = hospital.schedule || {};
              const currentHours = schedule[today] || "운영 시간 정보 없음";
              const isOpen = currentHours !== "휴무" && currentHours !== "운영 시간 정보 없음";

              return (
                <div
                  key={hospital._id} // DB에서 온 _id 사용
                  className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-2xl transition"
                >
                  <img
                    src={hospital.image || "https://via.placeholder.com/300x200"}
                    alt={hospital.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800">{hospital.yadmNm || hospital.name}</h3>
                    <p className="text-sm text-gray-500">{hospital.addr || hospital.location}</p>
                    <p
                      className={`mt-2 font-bold ${
                        isOpen ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {isOpen ? `현재 운영 중 (${currentHours})` : "현재 휴무"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
