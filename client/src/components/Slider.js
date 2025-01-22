import React, { useState } from "react";

const slides = [
  {
    id: 1,
    title: "야간 진료 병원을 찾으세요?",
    description: "지금 바로 검색하여 필요한 병원을 찾아보세요.",
    image: "https://via.placeholder.com/800x400",
  },
  {
    id: 2,
    title: "24시간 운영 병원 안내",
    description: "언제든 방문할 수 있는 병원을 찾아보세요.",
    image: "https://via.placeholder.com/800x400?text=24시간+병원",
  },
  {
    id: 3,
    title: "주말 진료 병원 리스트",
    description: "주말에도 운영 중인 병원을 확인하세요.",
    image: "https://via.placeholder.com/800x400?text=주말+병원",
  },
];

const Slider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="relative w-full h-64 bg-gray-300 rounded-lg shadow-md overflow-hidden">
      {/* 슬라이드 이미지 */}
      <img
        src={slides[currentIndex].image}
        alt={slides[currentIndex].title}
        className="w-full h-full object-cover"
      />

      {/* 슬라이드 텍스트 */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent text-white p-6">
        <h2 className="text-xl font-bold">{slides[currentIndex].title}</h2>
        <p>{slides[currentIndex].description}</p>
      </div>

      {/* 이전 버튼 */}
      <button
        onClick={handlePrev}
        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-gray-800 rounded-full p-2 shadow hover:bg-gray-100"
      >
        &lt;
      </button>

      {/* 다음 버튼 */}
      <button
        onClick={handleNext}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-gray-800 rounded-full p-2 shadow hover:bg-gray-100"
      >
        &gt;
      </button>

      {/* 슬라이드 인디케이터 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index === currentIndex ? "bg-white" : "bg-gray-400"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default Slider;