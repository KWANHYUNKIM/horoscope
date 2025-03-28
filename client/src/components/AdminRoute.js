import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { isLoggedIn, userRole, isLoading } = useAuth();

  console.log('AdminRoute 상태:', { isLoggedIn, userRole, isLoading }); // 디버깅용 로그

  if (isLoading) {
    console.log('로딩 중...'); // 디버깅용 로그
    return null;
  }

  if (!isLoggedIn) {
    console.log('로그인되지 않음'); // 디버깅용 로그
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'admin') {
    console.log('관리자 권한 없음:', userRole); // 디버깅용 로그
    return <Navigate to="/" replace />;
  }

  console.log('관리자 권한 확인됨'); // 디버깅용 로그
  return children;
};

export default AdminRoute;
