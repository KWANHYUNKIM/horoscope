import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('role');
    navigate('/');
  }, [navigate]);

  return (
    <div>
      <h1>로그아웃 중...</h1>
    </div>
  );
};

export default LogoutPage;
