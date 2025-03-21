import React from 'react';
import Slider from 'react-slick';
import { useNavigate } from 'react-router-dom';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const MedicalGuideSlider = () => {
  const navigate = useNavigate();

  const medicalGuides = [
    {
      title: "응급실 이용 가이드",
      content: "응급실은 생명이 위급한 상황에서만 이용해야 합니다. 응급실 이용 시 준비물과 절차를 알아보세요.",
      image: "/images/emergency-guide.jpg",
      link: "/guide/emergency"
    },
    {
      title: "야간진료 찾는 방법",
      content: "야간에 갑자기 아플 때! 야간진료 병원 찾는 방법과 주의사항을 알려드립니다.",
      image: "/images/night-care.jpg",
      link: "/guide/night-care"
    },
    {
      title: "주말진료 병원 찾기",
      content: "주말에도 진료하는 병원을 쉽게 찾을 수 있습니다. 주말진료 병원 찾는 방법을 알아보세요.",
      image: "/images/weekend-care.jpg",
      link: "/guide/weekend-care"
    },
    {
      title: "응급상황 대처법",
      content: "갑작스러운 응급상황 발생 시 대처 방법과 응급실 이용 시기, 준비물을 알아보세요.",
      image: "/images/emergency-care.jpg",
      link: "/guide/emergency-care"
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
      <style jsx>{`
        .medical-guide-slider {
          margin: 0;
          padding: 0;
          background: transparent;
          border-radius: 0;
          box-shadow: none;
        }
        .guide-slide {
          display: flex;
          align-items: center;
          padding: 30px;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border-radius: 12px;
          margin: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .guide-slide:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.1);
        }
        .guide-content {
          flex: 1;
          padding: 20px;
        }
        .guide-content h2 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 1.8rem;
          font-weight: 700;
        }
        .guide-content p {
          color: #4a5568;
          margin-bottom: 20px;
          line-height: 1.7;
          font-size: 1.1rem;
        }
        .guide-link {
          display: inline-block;
          padding: 10px 20px;
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.3s ease;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
        }
        .guide-link:hover {
          background: linear-gradient(135deg, #2980b9 0%, #2472a4 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
        }
        .guide-image {
          flex: 1;
          padding: 20px;
        }
        .guide-image img {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        @media (max-width: 768px) {
          .guide-slide {
            flex-direction: column;
            padding: 20px;
          }
          .guide-content, .guide-image {
            width: 100%;
          }
          .guide-content h2 {
            font-size: 1.5rem;
          }
          .guide-content p {
            font-size: 1rem;
          }
          .guide-image img {
            height: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default MedicalGuideSlider;
