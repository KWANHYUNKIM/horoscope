import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const MedicalGuideSlider = () => {
  const [selectedGuide, setSelectedGuide] = useState(null);

  // 긴급 의료 정보 및 병원 이용 가이드 데이터
  const guides = [
    {
      id: 1,
      title: "🚑 응급실 방문 가이드",
      description: "응급실 방문 전 반드시 확인해야 할 사항!",
      image: "/images/emergency.jpg", // 실제 이미지 경로로 변경
      details: "응급실 방문 시 건강보험증, 신분증, 현재 복용 중인 약 리스트를 챙기세요. 또한 방문 전 대기 시간을 확인하면 보다 원활한 진료를 받을 수 있습니다.",
    },
    {
      id: 2,
      title: "📞 119 신고 방법",
      description: "올바른 신고 방법을 알아두세요.",
      image: "/images/call119.jpg",
      details: "119 신고 시 증상을 간결하고 정확하게 설명하세요. 또한 신고자의 위치를 정확히 전달하면 구조가 빠르게 이루어질 수 있습니다.",
    },
    {
      id: 3,
      title: "❤️ 심폐소생술 가이드",
      description: "응급 상황에서 CPR을 시행하는 방법",
      image: "/images/cpr.jpg",
      details: "심정지 발생 시 즉시 심폐소생술(CPR)을 시행해야 합니다. 가슴 압박을 100~120회/분 속도로 시행하며, 구조 요청을 병행하세요.",
    },
    {
      id: 4,
      title: "🏥 병원 예약 가이드",
      description: "병원 예약을 하면 대기 시간을 줄일 수 있습니다.",
      image: "/images/hospital_booking.jpg",
      details: "진료 예약을 하면 대기 시간을 줄일 수 있으며, 병원별 예약 방법이 다를 수 있으므로 홈페이지 또는 전화 예약 방법을 확인하세요.",
    },
  ];

  // 슬라이더 설정
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2, // 한 번에 표시할 카드 개수
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
  };

  return (
    <section className="container mx-auto mt-10 p-4 px-4 md:px-40">
      <h2 className="text-xl font-bold mb-4">🩺 긴급 의료 정보 & 병원 이용 가이드</h2>

      {/* 슬라이더 */}
      <Slider {...settings}>
        {guides.map((guide) => (
          <div
            key={guide.id}
            className="relative p-4 cursor-pointer"
            onClick={() => setSelectedGuide(guide)}
          >
            <img
              src={guide.image}
              alt={guide.title}
              className="w-full h-48 object-cover rounded-lg shadow-md"
            />
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-80 p-2 rounded-md">
              <h3 className="text-lg font-semibold">{guide.title}</h3>
              <p className="text-sm text-gray-600">{guide.description}</p>
            </div>
          </div>
        ))}
      </Slider>

      {/* 모달창 (자세한 정보 표시) */}
      {selectedGuide && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg text-center">
            <h2 className="text-2xl font-bold mb-2">{selectedGuide.title}</h2>
            <p className="text-gray-700 mb-4">{selectedGuide.details}</p>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md"
              onClick={() => setSelectedGuide(null)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default MedicalGuideSlider;
