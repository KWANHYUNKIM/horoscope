import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('로그아웃 중...');

  useEffect(() => {
    // 모든 로컬 스토리지 항목 삭제
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isLoggedIn');
    
    setMessage('로그아웃이 완료되었습니다.');
    window.location.href = '/';
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <div className="text-center">
          <div className="text-green-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
          <p className="text-sm text-gray-500">홈페이지로 이동합니다.</p>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
