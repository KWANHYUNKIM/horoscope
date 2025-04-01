import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../utils/axios';

const KakaoCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const hasHandledRef = useRef(false); // 중복 방지용 ref

  useEffect(() => {
    const handleKakaoCallback = async () => {
      if (hasHandledRef.current) return; // 이미 처리했으면 return
      hasHandledRef.current = true;

      try {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');

        if (!code) {
          setError('인증 코드가 없습니다.');
          return;
        }

        const response = await axios.post('/api/auth/kakao/callback', { code });

        if (response.data.success) {
          if (response.data.isNewUser) {
            navigate('/register', {
              state: {
                email: response.data.email,
                nickname: response.data.nickname,
                profile_image: response.data.profile_image,
                social_id: response.data.social_id,
                provider: response.data.provider
              }
            });
          } else {
            navigate('/');
          }
        } else {
          setError(response.data.message || '로그인 처리 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('카카오 로그인 처리 중 오류 발생:', error);
        if (error.response?.data?.error === 'invalid_grant') {
          setError('인증 코드가 만료되었습니다. 다시 로그인해주세요.');
        } else if (error.response?.data?.error === 'invalid_request') {
          setError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError('로그인 처리 중 오류가 발생했습니다.');
        }
      }
    };

    handleKakaoCallback();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default KakaoCallback;
