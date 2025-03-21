import React from 'react';

const EmergencyCare = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">응급 상황 대처법</h1>
      
      <div className="space-y-8">
        {/* 응급 상황 기본 대처법 */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">기본 응급 대처법</h2>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-red-600 mb-2">1. 119 신고</h3>
              <p className="text-gray-700">응급 상황 발생 시 즉시 119에 신고하세요.</p>
              <ul className="list-disc list-inside mt-2 text-gray-700">
                <li>정확한 위치 알리기</li>
                <li>환자의 상태 설명하기</li>
                <li>응급차 도착 전 대기하기</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">2. 기본 응급 처치</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>환자의 의식 확인</li>
                <li>호흡 상태 확인</li>
                <li>출혈이 있는 경우 지혈</li>
                <li>체온 유지</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 주요 응급 상황별 대처법 */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">주요 응급 상황별 대처법</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">1. 심정지</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">심정지 발생 시 즉시 심폐소생술을 시작하세요.</p>
                <ol className="list-decimal list-inside text-gray-700">
                  <li>환자의 의식 확인</li>
                  <li>호흡 확인</li>
                  <li>가슴 압박 30회 (분당 100-120회)</li>
                  <li>인공호흡 2회</li>
                  <li>반복 (30:2 비율)</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">2. 대형 출혈</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">출혈이 심한 경우 즉시 지혈하세요.</p>
                <ol className="list-decimal list-inside text-gray-700">
                  <li>깨끗한 천으로 상처 부위 직접 압박</li>
                  <li>상처 부위를 심장보다 높게 올리기</li>
                  <li>지혈대 사용 (필요한 경우)</li>
                  <li>환자의 체온 유지</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">3. 화상</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">화상 발생 시 즉시 응급 처치를 하세요.</p>
                <ol className="list-decimal list-inside text-gray-700">
                  <li>화상 부위를 흐르는 물에 10-20분간 담그기</li>
                  <li>화상 부위를 깨끗한 천으로 덮기</li>
                  <li>화상 부위를 심장보다 높게 올리기</li>
                  <li>환자의 체온 유지</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">4. 중독</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">중독 발생 시 즉시 응급 처치를 하세요.</p>
                <ol className="list-decimal list-inside text-gray-700">
                  <li>중독 물질 확인</li>
                  <li>의식 확인</li>
                  <li>구토 유도 (의식이 있는 경우에만)</li>
                  <li>환자의 체온 유지</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* 응급실 이용 안내 */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">응급실 이용 안내</h2>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-yellow-600 mb-2">응급실 이용 시 준비물</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>신분증</li>
                <li>의료보험증</li>
                <li>현재 복용 중인 약 목록</li>
                <li>알레르기 정보</li>
                <li>기저질환 정보</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-green-600 mb-2">응급실 이용 시 주의사항</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>응급실은 진정한 응급 상황에서만 이용</li>
                <li>환자의 상태 변화를 주의 깊게 관찰</li>
                <li>의료진의 지시를 정확히 따르기</li>
                <li>다른 환자의 프라이버시 존중</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 응급 상황 예방 */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">응급 상황 예방</h2>
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-purple-600 mb-2">일상적인 예방 수칙</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>정기적인 건강검진</li>
                <li>응급 처치 교육 참여</li>
                <li>응급 의료 정보 앱 설치</li>
                <li>가정 내 응급 의료 키트 준비</li>
                <li>응급 연락처 저장</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmergencyCare; 