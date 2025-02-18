import React, { useState, useEffect } from "react";

const slides = [
  {
    id: 1,
    title: "야간 진료 병원을 찾으세요?",
    description: "지금 바로 검색하여 필요한 병원을 찾아보세요.",
    image: "/night_time.jpg",
  }
];

const Slider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  // 자동 슬라이드 (6초마다 변경)
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-64 rounded-lg shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500">
      {/* 슬라이드 이미지 */}
      <img
        src={slides[currentIndex].image}
        alt={slides[currentIndex].title}
        className="w-full h-full object-cover transition-transform duration-1000 ease-in-out filter brightness-90"
      />

      {/* 슬라이드 텍스트 */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent text-white p-6">
        <h2 className="text-xl font-bold">{slides[currentIndex].title}</h2>
        <p>{slides[currentIndex].description}</p>
      </div>

      {/* 이전 버튼 (흰색 배경, 검은색 아이콘) */}
      <button
        onClick={handlePrev}
        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-black rounded-full p-3 shadow-lg hover:bg-gray-200 transition"
      >
        &lt;
      </button>

      {/* 다음 버튼 (흰색 배경, 검은색 아이콘) */}
      <button
        onClick={handleNext}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-black rounded-full p-3 shadow-lg hover:bg-gray-200 transition"
      >
        &gt;
      </button>

      {/* 슬라이드 인디케이터 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition ${
              index === currentIndex ? "bg-white scale-125" : "bg-gray-400"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default Slider;
