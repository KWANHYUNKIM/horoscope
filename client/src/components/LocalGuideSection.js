import React from 'react';
import { useNavigate } from 'react-router-dom';

const LocalGuideSection = () => {
  const navigate = useNavigate();

  const localGuides = [
    {
      id: 1,
      title: "내 주변 응급실",
      description: "가까운 응급실을 찾아보세요",
      icon: "🏥",
      color: "from-red-400 to-red-600"
    },
    {
      id: 2,
      title: "내 주변 야간진료",
      description: "야간에 운영하는 병원을 찾아보세요",
      icon: "🌙",
      color: "from-blue-400 to-blue-600"
    },
    {
      id: 3,
      title: "내 주변 주말진료",
      description: "주말에 운영하는 병원을 찾아보세요",
      icon: "📅",
      color: "from-green-400 to-green-600"
    },
    {
      id: 4,
      title: "내 주변 요양병원",
      description: "가까운 요양병원을 찾아보세요",
      icon: "🏛️",
      color: "from-purple-400 to-purple-600"
    }
  ];

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">내 주변 안내</h2>
          <p className="text-lg text-gray-600">
            현재 위치 기반으로 가까운 의료 시설을 찾아보세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {localGuides.map((guide) => (
            <div
              key={guide.id}
              onClick={() => navigate('/hospitals', { 
                state: { 
                  searchType: guide.title.replace('내 주변 ', '').toLowerCase(),
                  useCurrentLocation: true 
                }
              })}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <div className={`bg-gradient-to-r ${guide.color} p-6 text-white`}>
                <div className="text-4xl mb-2">{guide.icon}</div>
                <h3 className="text-xl font-semibold">{guide.title}</h3>
                <p className="text-sm opacity-90 mt-1">{guide.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/hospitals', { 
              state: { 
                useCurrentLocation: true 
              }
            })}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            더 많은 내 주변 의료시설 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalGuideSection; 