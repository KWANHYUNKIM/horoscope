import React from 'react';

const MedicalInfoSection = () => {
  // 계절별 주의 질병 데이터
  const seasonalDiseases = [
    {
      season: '봄',
      diseases: [
        { name: '꽃가루 알레르기', description: '봄철 꽃가루로 인한 알레르기성 비염과 결막염이 증가합니다.' },
        { name: '수족구병', description: '3-5월에 주로 발생하는 바이러스성 질환입니다.' }
      ]
    },
    {
      season: '여름',
      diseases: [
        { name: '식중독', description: '고온다습한 환경에서 식중독 발생 위험이 높아집니다.' },
        { name: '열사병', description: '무더운 날씨에 발생하는 열 관련 질환입니다.' }
      ]
    },
    {
      season: '가을',
      diseases: [
        { name: '독감', description: '가을부터 시작되는 인플루엔자 예방이 필요합니다.' },
        { name: '천식', description: '기온 변화가 큰 시기 천식 증상이 악화될 수 있습니다.' }
      ]
    },
    {
      season: '겨울',
      diseases: [
        { name: '감기', description: '건조한 날씨와 낮은 기온으로 인한 호흡기 질환입니다.' },
        { name: '심근경색', description: '추운 날씨에 혈관 수축으로 인한 심장 질환 위험이 증가합니다.' }
      ]
    }
  ];

  // 건강 팁 데이터
  const healthTips = [
    {
      title: '수분 섭취',
      description: '하루 8잔의 물을 마시는 것이 좋습니다.',
      icon: '💧'
    },
    {
      title: '규칙적인 운동',
      description: '주 3회 이상, 30분 이상의 운동을 권장합니다.',
      icon: '🏃'
    },
    {
      title: '충분한 수면',
      description: '하루 7-8시간의 수면이 필요합니다.',
      icon: '😴'
    },
    {
      title: '균형 잡힌 식사',
      description: '다양한 영양소를 골고루 섭취하세요.',
      icon: '🥗'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">주요 의료 정보</h2>
      
      {/* 계절별 주의 질병 */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">계절별 주의 질병</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {seasonalDiseases.map((season, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-purple-600 mb-3">{season.season}</h4>
              <ul className="space-y-2">
                {season.diseases.map((disease, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">{disease.name}</span>
                    <p className="mt-1">{disease.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 건강 팁 */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">건강 팁</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthTips.map((tip, index) => (
            <div key={index} className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">{tip.icon}</div>
              <h4 className="font-medium text-gray-800 mb-2">{tip.title}</h4>
              <p className="text-sm text-gray-600">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MedicalInfoSection; 