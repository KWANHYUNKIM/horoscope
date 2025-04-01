import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const NaverCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNaverCallback = async () => {
      try {
        const response = await api.get('/api/auth/naver/callback', {
          params: {
            code: new URLSearchParams(window.location.search).get('code'),
            state: new URLSearchParams(window.location.search).get('state')
          }
        });

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          navigate('/');
        }
      } catch (error) {
        console.error('네이버 로그인 처리 중 오류 발생:', error);
        navigate('/login');
      }
    };

    handleNaverCallback();
  }, [navigate]);

  return (
    <div>
      <h2>네이버 로그인 처리 중...</h2>
    </div>
  );
};

export default NaverCallback; 