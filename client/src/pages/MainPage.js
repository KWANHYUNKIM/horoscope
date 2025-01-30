import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Slider from "../components/Slider"; // 슬라이더 컴포넌트 가져오기

const MainPage = () => {
  const [searchQuery, setSearchQuery] = useState(""); // 검색 입력값 상태
  const navigate = useNavigate();

  const categories = [
    { label: "야간진료", icon: "🌙" },
    { label: "24시간진료", icon: "⏰" },
    { label: "주말진료", icon: "📅" },
    { label: "일반진료", icon: "🏥" },
    { label: "내 주변", icon: "📍" }, // "내 주변" 카테고리 추가
  ];

  const handleSearch = () => {
    // 검색 버튼 클릭 시 검색 페이지로 이동
    navigate(`/hospitals?query=${encodeURIComponent(searchQuery)}`);
  };

  const handleNearby = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // 위치 정보를 서버로 전달하기 위해 쿼리 파라미터로 포함
          navigate(`/hospitals?x=${longitude}&y=${latitude}`);
        },
        (error) => {
          console.error("위치 정보를 가져오는 중 오류 발생:", error);
          alert("위치 정보를 가져오는 데 실패했습니다. 권한을 확인해주세요.");
        }
      );
    } else {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-3xl font-bold">삐뽀삐뽀119</h1>
          <p className="text-lg mt-2">
            당신의 근처에서 운영 중인 병원을 쉽게 찾아보세요
          </p>

          {/* 검색바 */}
          <section className="container mx-auto mt-8 p-4">
            <div className="flex max-w-md mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="어떤 병원을 찾으시나요?"
                className="flex-1 p-2 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-black" // 변경됨: text-black 추가, padding 조정
              />
              <button
                onClick={handleSearch}
                className="bg-purple-500 text-white px-4 py-2 rounded-r-lg shadow-sm hover:bg-purple-600"
              >
                검색
              </button>
            </div>
          </section>
        </div>
      </header>

      {/* 카테고리 */}
      <section className="container mx-auto mt-8 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            category.label !== "내 주변" ? (
              <Link
                key={index}
                to={`/hospitals?category=${encodeURIComponent(category.label)}`}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors duration-200"
              >
                <span className="text-3xl">{category.icon}</span>
                <p className="mt-1 text-base font-semibold">{category.label}</p>
              </Link>
            ) : (
              <button
                key={index}
                onClick={handleNearby}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors duration-200"
              >
                <span className="text-3xl">{category.icon}</span>
                <p className="mt-1 text-base font-semibold">{category.label}</p>
              </button>
            )
          ))}
        </div>
      </section>

      {/* 슬라이더 */}
      <section className="container mx-auto mt-10 p-6">
        <Slider /> {/* 슬라이더 컴포넌트 추가 */}
      </section>
    </div>
  );
};

export default MainPage;
