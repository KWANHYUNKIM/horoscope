import React from 'react';
import Slider from 'react-slick';
import { useNavigate } from 'react-router-dom';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './MedicalGuideSlider.css';

const MedicalGuideSlider = () => {
  const navigate = useNavigate();

  const medicalGuides = [
    {
      title: "응급실 이용 가이드",
      content: "응급실은 생명이 위급한 상황에서만 이용해야 합니다. 응급실 이용 시 준비물과 절차를 알아보세요.",
      image: "/images/emergency-guide.jpg",
      link: "/guides/emergency"
    },
    {
      title: "야간진료 찾는 방법",
      content: "야간에 갑자기 아플 때! 야간진료 병원 찾는 방법과 주의사항을 알려드립니다.",
      image: "/images/night-care.jpg",
      link: "/guides/night-care"
    },
    {
      title: "주말진료 병원 찾기",
      content: "주말에도 진료하는 병원을 쉽게 찾을 수 있습니다. 주말진료 병원 찾는 방법을 알아보세요.",
      image: "/images/weekend-care.jpg",
      link: "/guides/weekend-care"
    },
    {
      title: "응급상황 대처법",
      content: "갑작스러운 응급상황 발생 시 대처 방법과 응급실 이용 시기, 준비물을 알아보세요.",
      image: "/images/emergency-care.jpg",
      link: "/guides/emergency-care"
    }
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true
  };

  return (
    <div className="medical-guide-slider">
      <Slider {...settings}>
        {medicalGuides.map((guide, index) => (
          <div key={index} className="guide-slide" onClick={() => navigate(guide.link)}>
            <div className="guide-content">
              <h2>{guide.title}</h2>
              <p>{guide.content}</p>
              <span className="guide-link">
                자세히 보기 →
              </span>
            </div>
            <div className="guide-image">
              <img src={guide.image} alt={guide.title} onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/default-guide.jpg';
              }} />
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default MedicalGuideSlider;
