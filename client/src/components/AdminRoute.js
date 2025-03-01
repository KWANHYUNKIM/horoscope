import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('role') === 'admin';

  if (!isAdmin) {
    // 관리자가 아니면 로그인 페이지로 리다이렉트
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default AdminRoute;
