import React from 'react';

const NursingHospitalDetail = () => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100">
      {/* 상단 이미지 섹션 */}
      <div className="relative h-32 bg-gradient-to-br from-blue-500 to-blue-600 p-4">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-white text-xs font-medium">요양병원 둘러보기</span>
          </div>
          <h2 className="text-white text-lg font-bold">시설을 둘러보세요</h2>
          <p className="text-blue-100 text-sm mt-1">
            최고의 요양병원을 찾아보세요
          </p>
        </div>
      </div>

      {/* 시설 정보 섹션 */}
      <div className="p-4">
        {/* 시설 특징 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
            <div className="bg-white p-1.5 rounded-full shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h5 className="text-sm font-medium text-blue-900">24시간 케어</h5>
              <p className="text-xs text-blue-700">전문의 상시 대기</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
            <div className="bg-white p-1.5 rounded-full shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h5 className="text-sm font-medium text-blue-900">안전한 시설</h5>
              <p className="text-xs text-blue-700">현대식 의료 장비</p>
            </div>
          </div>
        </div>

        {/* 시설 둘러보기 버튼 */}
        <button className="w-full mt-3 bg-blue-500 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition duration-300 flex items-center justify-center gap-1">
          자세히 알아보기
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NursingHospitalDetail; 