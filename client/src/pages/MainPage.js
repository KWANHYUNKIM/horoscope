import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppTour from "../components/AppTour"; // 위에서 만든 투어 컴포넌트
import AutoComplete from "../components/AutoComplete";
import Slider from "../components/Slider";
import FloatingAnnouncementModal from "../components/FloatingAnnouncementModal";
import MedicalGuideSlider from "../components/MedicalGuideSlider"; // 긴급 의료 정보 슬라이더 추가
const MainPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 첫 방문 시 자동 투어 실행 */}
      <AppTour />

      <header className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-6 shadow-md header-title">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-2xl font-bold">삐뽀삐뽀119</h1>
          <p className="text-lg mt-1">
            당신의 근처에서 운영 중인 병원을 쉽게 찾아보세요
          </p>
          <section className="w-full mt-6 p-2 search-bar">
            <AutoComplete searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </section>
        </div>
      </header>

      <section className="container mx-auto mt-6 p-4 px-4 md:px-40 slider-section">
        <Slider />
      </section>

      <FloatingAnnouncementModal className="floating-announcement" />
    </div>
  );
};

export default MainPage;
