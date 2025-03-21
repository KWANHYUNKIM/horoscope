import React from 'react';
import GuideLayout from '../../components/GuideLayout';

const EmergencyGuidePage = () => {
  return (
    <GuideLayout>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">응급실 이용 가이드</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold mb-4">응급실 이용이 필요한 경우</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>심한 통증이나 급성 질환</li>
            <li>중상이나 심각한 부상</li>
            <li>의식이 없는 경우</li>
            <li>호흡이 곤란한 경우</li>
            <li>심한 출혈이 있는 경우</li>
            <li>중독이나 과다 복용</li>
            <li>뇌졸중이나 심장마비 의심</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">준비물</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>신분증</li>
            <li>의료보험증</li>
            <li>현재 복용 중인 약 목록</li>
            <li>과거 병력 기록</li>
            <li>현금 또는 카드</li>
            <li>간단한 간식과 음료수</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">응급실 이용 절차</h2>
          <ol className="list-decimal pl-6 mb-6">
            <li>119에 전화하여 응급 상황 신고</li>
            <li>가능한 경우 가까운 응급실로 직접 내원</li>
            <li>응급실 접수 및 초기 진료</li>
            <li>필요한 검사 및 치료 진행</li>
            <li>입원 또는 퇴원 결정</li>
          </ol>

          <h2 className="text-2xl font-semibold mb-4">주의사항</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>응급실은 진료 순서가 아닌 응급도에 따라 진료 순서가 결정됩니다</li>
            <li>가능한 한 보호자가 동행하세요</li>
            <li>증상과 병력을 미리 정리해두세요</li>
            <li>필요한 경우 다음 날 평일 진료 예약을 하세요</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">응급실 비용 안내</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="mb-2">• 응급실 진료는 일반 진료보다 비용이 높을 수 있습니다</p>
            <p className="mb-2">• 의료보험 적용이 가능합니다</p>
            <p>• 입원이 필요한 경우 추가 비용이 발생할 수 있습니다</p>
          </div>
        </div>
      </div>
    </GuideLayout>
  );
};

export default EmergencyGuidePage; 