import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TermsAgreement = () => {
  const navigate = useNavigate();
  const [allChecked, setAllChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState({
    required: false,
    privacy: false,
    location: false,
    marketing: false
  });
  const [scrollProgress, setScrollProgress] = useState({
    required: 0,
    privacy: 0,
    location: 0,
    marketing: 0
  });
  const termsRefs = {
    required: useRef(null),
    privacy: useRef(null),
    location: useRef(null),
    marketing: useRef(null)
  };

  const handleAllCheck = (e) => {
    const checked = e.target.checked;
    setAllChecked(checked);
    setTermsChecked({
      required: checked,
      privacy: checked,
      location: checked,
      marketing: checked
    });
  };

  const handleIndividualCheck = (term) => {
    const newChecked = {
      ...termsChecked,
      [term]: !termsChecked[term]
    };
    setTermsChecked(newChecked);
    
    const allTermsChecked = Object.values(newChecked).every(value => value);
    setAllChecked(allTermsChecked);
  };

  const handleScroll = (term) => {
    const element = termsRefs[term].current;
    if (element) {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(prev => ({
        ...prev,
        [term]: progress
      }));

      if (progress >= 100 && !termsChecked[term]) {
        handleIndividualCheck(term);
      }
    }
  };

  const handleNext = () => {
    if (termsChecked.required && termsChecked.privacy) {
      navigate('/register');
    } else {
      alert('필수 약관에 동의해주세요.');
    }
  };

  const termsContent = {
    required: `제1조 (목적)
이 약관은 호로스코프(이하 "회사")가 제공하는 서비스의 이용조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 회사가 제공하는 모든 서비스를 말합니다.
2. "이용자"란 회사의 서비스를 이용하는 회원을 말합니다.

제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스를 이용하는 모든 이용자에 대하여 그 효력을 발생합니다.
2. 회사는 필요한 경우 이 약관을 변경할 수 있으며, 변경된 약관은 웹사이트에 공지함으로써 효력이 발생합니다.`,
    privacy: `제1조 (개인정보의 수집 및 이용목적)
회사는 다음의 목적을 위하여 개인정보를 수집 및 이용합니다:
1. 서비스 제공 및 운영
2. 서비스 이용에 따른 본인확인
3. 서비스 이용에 따른 통지
4. 서비스 이용에 따른 불만처리

제2조 (수집하는 개인정보 항목)
회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
1. 필수항목: 아이디, 비밀번호, 이메일 주소
2. 선택항목: 전화번호, 주소

제3조 (개인정보의 보유 및 이용기간)
회사는 이용자의 개인정보를 원칙적으로 서비스 이용계약의 성립 시부터 서비스 이용계약의 해지 시까지 보관합니다.`,
    location: `제1조 (위치기반서비스의 이용)
회사는 이용자의 위치정보를 이용하여 다음과 같은 서비스를 제공합니다:
1. 주변 병원 검색
2. 응급실 위치 표시
3. 야간 진료소 위치 표시

제2조 (위치정보의 수집 및 이용)
1. 회사는 이용자의 위치정보를 수집하여 서비스 제공에 이용합니다.
2. 이용자는 위치정보 수집에 대한 동의를 거부할 수 있습니다.

제3조 (위치정보의 보호)
회사는 이용자의 위치정보를 안전하게 보호하기 위해 보안시스템을 갖추고 있습니다.`,
    marketing: `제1조 (마케팅 정보 수신 동의)
회사는 이용자에게 다음과 같은 마케팅 정보를 제공합니다:
1. 새로운 서비스 안내
2. 이벤트 및 프로모션 안내
3. 맞춤형 서비스 추천

제2조 (마케팅 정보 수신 방법)
회사는 이용자가 동의한 방법으로 마케팅 정보를 제공합니다:
1. 이메일
2. SMS
3. 푸시 알림

제3조 (마케팅 정보 수신 동의 철회)
이용자는 언제든지 마케팅 정보 수신 동의를 철회할 수 있습니다.`
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          회원가입 약관 동의
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="allCheck"
                checked={allChecked}
                onChange={handleAllCheck}
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="allCheck" className="ml-3 block text-lg font-medium text-gray-900">
                전체 동의하기
              </label>
            </div>

            <div className="space-y-4 border-t border-gray-200 pt-4">
              {Object.entries(termsContent).map(([key, content]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={termsChecked[key]}
                      onChange={() => handleIndividualCheck(key)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={key} className="ml-3 block text-base font-medium text-gray-900">
                      {key === 'required' && '[필수] 이용약관 동의'}
                      {key === 'privacy' && '[필수] 개인정보 수집 및 이용 동의'}
                      {key === 'location' && '[선택] 위치기반서비스 이용약관'}
                      {key === 'marketing' && '[선택] 이벤트・혜택 정보 수신 동의'}
                    </label>
                  </div>
                  <div 
                    ref={termsRefs[key]}
                    onScroll={() => handleScroll(key)}
                    className="h-40 overflow-y-auto p-2 text-sm text-gray-600 bg-gray-50 rounded"
                  >
                    {content}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    스크롤 진행률: {Math.round(scrollProgress[key])}%
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-gray-500 space-y-2">
              <p>※ 전체 동의는 필수 및 선택 정보에 대한 동의를 포함합니다.</p>
              <p>※ 선택 항목에 대한 동의를 거부하실 수 있으며, 동의 거부 시에도 서비스 이용이 가능합니다.</p>
              <p>※ 각 약관의 전체 내용을 스크롤하여 확인하시면 자동으로 동의가 체크됩니다.</p>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                취소
              </button>
              <button
                onClick={handleNext}
                disabled={!termsChecked.required || !termsChecked.privacy}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAgreement; 