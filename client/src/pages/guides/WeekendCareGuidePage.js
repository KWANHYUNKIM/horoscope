import React from 'react';
import GuideLayout from '../../components/GuideLayout';

const WeekendCareGuidePage = () => {
  return (
    <GuideLayout>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">주말진료 이용 가이드</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold mb-4">주말진료란?</h2>
          <p className="mb-6">
            주말진료는 토요일과 일요일에 운영되는 의료 서비스입니다. 
            평일에는 바빠서 병원에 갈 수 없는 직장인이나 학생들을 위해 마련된 제도입니다.
          </p>

          <h2 className="text-2xl font-semibold mb-4">주말진료 이용이 필요한 경우</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>평일에는 바빠서 진료를 받지 못한 경우</li>
            <li>만성 질환의 정기적인 진료가 필요한 경우</li>
            <li>급성 통증이나 불편감이 있는 경우</li>
            <li>예방접종이나 건강검진이 필요한 경우</li>
            <li>처방전 발급이나 약 처방이 필요한 경우</li>
            <li>간단한 상담이나 진료가 필요한 경우</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">주말진료 찾는 방법</h2>
          <ol className="list-decimal pl-6 mb-6">
            <li>삐뽀삐뽀119 앱/웹사이트에서 '주말진료' 필터 선택</li>
            <li>현재 위치 기반으로 가까운 주말진료 병원 검색</li>
            <li>운영 시간과 진료과목 확인</li>
            <li>전화로 예약 가능 여부 확인</li>
            <li>필요한 경우 미리 예약 진행</li>
          </ol>

          <h2 className="text-2xl font-semibold mb-4">주말진료 이용 시 준비물</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>신분증</li>
            <li>의료보험증</li>
            <li>현재 복용 중인 약 목록</li>
            <li>과거 병력 기록</li>
            <li>현금 또는 카드</li>
            <li>간단한 간식과 음료수</li>
            <li>이전 진료 기록 (있는 경우)</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">주말진료 이용 시 주의사항</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>주말진료는 평일 진료와 동일한 서비스입니다</li>
            <li>운영 시간이 제한적이므로 미리 확인하세요</li>
            <li>진료과목이 제한적일 수 있으니 확인이 필요합니다</li>
            <li>예약이 필요한 경우가 있으니 미리 확인하세요</li>
            <li>증상이 심각한 경우 응급실을 이용하세요</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">주말진료 비용 안내</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="mb-2">• 주말진료는 평일 진료와 동일한 비용이 적용됩니다</p>
            <p className="mb-2">• 의료보험 적용이 가능합니다</p>
            <p>• 일부 특수 진료의 경우 추가 비용이 발생할 수 있습니다</p>
          </div>

          <h2 className="text-2xl font-semibold mb-4">주말진료 이용 팁</h2>
          <ul className="list-disc pl-6">
            <li>가능한 한 오전에 방문하는 것이 좋습니다</li>
            <li>전화로 예약 가능 여부를 미리 확인하세요</li>
            <li>증상과 병력을 미리 정리해두세요</li>
            <li>필요한 경우 다음 주 평일 진료 예약을 미리 하세요</li>
            <li>의료진의 지시사항을 정확히 따라주세요</li>
          </ul>
        </div>
      </div>
    </GuideLayout>
  );
};

export default WeekendCareGuidePage; 