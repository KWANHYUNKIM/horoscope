import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Slider from "../components/Slider"; // 슬라이더 컴포넌트
import FloatingAnnouncementModal from "../components/FloatingAnnouncementModal";
import AutoComplete from "../components/AutoComplete"; // 자동완성 컴포넌트 import
import MedicalGuideSlider from "../components/MedicalGuideSlider"; // 긴급 의료 정보 슬라이더 추가

const MainPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-2xl font-bold">삐뽀삐뽀119</h1>
          <p className="text-lg mt-1">
            당신의 근처에서 운영 중인 병원을 쉽게 찾아보세요
          </p>

          {/* 검색바 - AutoComplete 컴포넌트와 "검색" 버튼 */}
          <section className="w-full mt-6 p-2">
              <AutoComplete
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            
          </section>
        </div>
      </header>

      {/* 슬라이더 */}
      <section className="container mx-auto mt-6 p-4 px-4 md:px-40">
        <Slider />
      </section>
      
      {/* 긴급 의료 정보 & 병원 이용 가이드 슬라이더 추가 */}
      {/* <MedicalGuideSlider /> */}

      {/* 공지사항 버튼 */}
      <FloatingAnnouncementModal />
    </div>
  );
};

export default MainPage;
