import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const NaverCallback = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn, setUserRole } = useAuth();

  useEffect(() => {
    const handleNaverLogin = async () => {
      try {
        // URL에서 code와 state 파라미터 추출
        const params = new URL(window.location.href).searchParams;
        const code = params.get('code');
        const state = params.get('state');
        
        // state 값 검증
        const savedState = sessionStorage.getItem('naverState');
        if (!state || state !== savedState) {
          throw new Error('Invalid state parameter');
        }
        
        // state 값 사용 후 제거
        sessionStorage.removeItem('naverState');

        if (!code) {
          throw new Error('인증 코드가 없습니다.');
        }

        // 서버에 인증 코드 전송
        const response = await axios.post('http://localhost:3001/api/auth/naver/callback', 
          { code, state },
          { withCredentials: true }
        );

        if (response.data.user) {
          // 로그인 상태 업데이트
          await Promise.all([
            new Promise(resolve => {
              setIsLoggedIn(true);
              resolve();
            }),
            new Promise(resolve => {
              setUserRole(response.data.user.role);
              resolve();
            })
          ]);

          // 로그인 성공 시 메인 페이지로 이동
          if (response.data.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        }
      } catch (error) {
        console.error('네이버 로그인 콜백 처리 오류:', error);
        alert('로그인 처리 중 오류가 발생했습니다.');
        navigate('/login');
      }
    };

    handleNaverLogin();
  }, [navigate, setIsLoggedIn, setUserRole]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">네이버 로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default NaverCallback; 