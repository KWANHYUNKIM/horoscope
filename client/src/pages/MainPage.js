import React from "react";
import { Link } from "react-router-dom";
import Slider from "../components/Slider"; // 슬라이더 컴포넌트 가져오기

const MainPage = () => {
  const categories = [
    { label: "야간진료", icon: "🌙" },
    { label: "24시간진료", icon: "⏰" },
    { label: "주말진료", icon: "📅" },
    { label: "일반진료", icon: "🏥" },
  ];

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
          <div className="mt-6 w-full max-w-2xl">
            <input
              type="text"
              placeholder="어떤 병원을 찾으시나요?"
              className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </header>

      {/* 카테고리 */}
      <section className="container mx-auto mt-8 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/hospitals?category=${category.label}`}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:bg-gray-100"
            >
              <span className="text-4xl">{category.icon}</span>
              <p className="mt-2 text-lg font-bold">{category.label}</p>
            </Link>
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
