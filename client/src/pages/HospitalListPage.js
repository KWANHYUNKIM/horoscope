import React, { useState } from "react";

const dummyHospitals = [
  {
    id: 1,
    name: "서울 메디컬 센터",
    location: "서울특별시 강남구 테헤란로 123",
    region: "서울",
    image: "https://via.placeholder.com/300x200",
    schedule: {
      Monday: "09:00 - 18:00",
      Tuesday: "09:00 - 18:00",
      Wednesday: "09:00 - 18:00",
      Thursday: "09:00 - 18:00",
      Friday: "09:00 - 18:00",
      Saturday: "10:00 - 14:00",
      Sunday: "휴무",
    },
  },
  {
    id: 2,
    name: "부산 종합병원",
    location: "부산광역시 해운대구 센텀로 456",
    region: "부산",
    image: "https://via.placeholder.com/300x200",
    schedule: {
      Monday: "08:00 - 17:00",
      Tuesday: "08:00 - 17:00",
      Wednesday: "08:00 - 17:00",
      Thursday: "08:00 - 17:00",
      Friday: "08:00 - 17:00",
      Saturday: "09:00 - 13:00",
      Sunday: "휴무",
    },
  },
  {
    id: 3,
    name: "제주 건강 클리닉",
    location: "제주특별자치도 제주시 노형로 123",
    region: "제주",
    image: "https://via.placeholder.com/300x200",
    schedule: {
      Monday: "09:30 - 18:30",
      Tuesday: "09:30 - 18:30",
      Wednesday: "09:30 - 18:30",
      Thursday: "09:30 - 18:30",
      Friday: "09:30 - 18:30",
      Saturday: "휴무",
      Sunday: "휴무",
    },
  },
];
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
  { label: "충청", icon: "🌳" }
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
  { label: "일반 진료", icon: "🏥" }
];

const HospitalListPage = () => {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedAdditionalFilter, setSelectedAdditionalFilter] = useState("전체");

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const filteredHospitals = dummyHospitals.filter((hospital) => {
    const matchesRegion = selectedRegion === "전국" || !selectedRegion || hospital.region === selectedRegion;
    const matchesSubject = selectedSubject === "전체" || !selectedSubject;

    let matchesAdditionalFilter = true;
    if (selectedAdditionalFilter === "야간 진료") {
      matchesAdditionalFilter = today in hospital.schedule && hospital.schedule[today].includes("18:00");
    } else if (selectedAdditionalFilter === "24시간 진료") {
      matchesAdditionalFilter = today in hospital.schedule && hospital.schedule[today] === "24시간";
    } else if (selectedAdditionalFilter === "주말 진료") {
      matchesAdditionalFilter = ("Saturday" in hospital.schedule && hospital.schedule["Saturday"] !== "휴무") || ("Sunday" in hospital.schedule && hospital.schedule["Sunday"] !== "휴무");
    }

    return matchesRegion && matchesSubject && matchesAdditionalFilter;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 헤더 */}
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
                selectedRegion === region.label ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-gray-300"
              } rounded-lg shadow-md hover:shadow-lg p-4 border`}
              onClick={() => setSelectedRegion(region.label)}
            >
              <div className="text-4xl mb-2">{region.icon}</div>
              <p className="text-sm font-medium text-gray-700">{region.label}</p>
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
              onClick={() => setSelectedSubject(subject.label)}
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
              onClick={() => setSelectedAdditionalFilter(filter.label)}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 병원 리스트 */}
      <section className="container mx-auto mt-10 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.length > 0 ? (
            filteredHospitals.map((hospital) => {
              const currentHours =
                hospital.schedule[today] || "운영 시간 정보 없음";
              const isOpen =
                currentHours !== "휴무" &&
                currentHours !== "운영 시간 정보 없음";

              return (
                <div
                  key={hospital.id}
                  className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-2xl transition"
                >
                  <img
                    src={hospital.image}
                    alt={hospital.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      {hospital.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {hospital.location}
                    </p>
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
            })
          ) : (
            <p className="text-center text-gray-500">
              선택한 조건에 맞는 병원이 없습니다.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default HospitalListPage;
