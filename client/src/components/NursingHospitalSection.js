import React from 'react';
import { useNavigate } from 'react-router-dom';

const NursingHospitalSection = () => {
  const navigate = useNavigate();

  const nursingHospitals = [
    {
      id: 1,
      name: "서울요양병원",
      address: "서울특별시 강남구",
      facilities: ["물리치료", "작업치료", "재활치료", "요양실"],
      rating: 4.5,
      image: "/images/nursing/seoul-nursing.jpg"
    },
    {
      id: 2,
      name: "부산요양병원",
      address: "부산광역시 해운대구",
      facilities: ["물리치료", "작업치료", "요양실", "휴게실"],
      rating: 4.3,
      image: "/images/nursing/busan-nursing.jpg"
    },
    {
      id: 3,
      name: "대구요양병원",
      address: "대구광역시 수성구",
      facilities: ["물리치료", "작업치료", "요양실", "식사실"],
      rating: 4.4,
      image: "/images/nursing/daegu-nursing.jpg"
    }
  ];

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">요양병원 안내</h2>
          <p className="text-lg text-gray-600">
            전문적인 요양과 치료를 제공하는 요양병원을 찾아보세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {nursingHospitals.map((hospital) => (
            <div 
              key={hospital.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => navigate(`/hospitals/${hospital.id}`)}
            >
              <div className="relative h-48">
                <img
                  src={hospital.image}
                  alt={hospital.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-semibold text-blue-600">
                  {hospital.rating}점
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {hospital.name}
                </h3>
                <p className="text-gray-600 mb-4">{hospital.address}</p>
                
                <div className="flex flex-wrap gap-2">
                  {hospital.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/hospitals', { 
              state: { 
                searchType: 'nursing',
                useCurrentLocation: true 
              }
            })}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            더 많은 요양병원 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NursingHospitalSection; 