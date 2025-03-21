import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 빠른 검색 처리 함수
  const handleQuickSearch = (query) => {
    // 여기에 검색 로직 구현
    console.log('Quick search:', query);
    // 실제 구현에서는 검색 결과를 처리하고 상태를 업데이트하는 로직이 들어갈 수 있습니다
  };

  const value = {
    user,
    loading,
    error,
    handleQuickSearch,
    setUser,
    setLoading,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 