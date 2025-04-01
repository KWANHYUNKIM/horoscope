import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const NaverCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNaverCallback = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get('code');
        const state = new URLSearchParams(window.location.search).get('state');
        
        const response = await api.get('/api/auth/naver/callback', {
          params: { code, state }
        });

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          if (response.data.user) {
            localStorage.setItem('userRole', response.data.user.role);
          }
          navigate('/');
        }
      } catch (error) {
        console.error('네이버 로그인 처리 중 오류 발생:', error);
        alert('네이버 로그인 처리 중 오류가 발생했습니다.');
        navigate('/login');
      }
    };

    handleNaverCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">네이버 로그인 처리 중...</h2>
          <p className="mt-2 text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    </div>
  );
};

export default NaverCallback; 