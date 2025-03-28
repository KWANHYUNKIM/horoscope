import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAuthState = useCallback((user) => {
    if (user) {
      setIsLoggedIn(true);
      setUserRole(user.role);
      setUserId(user.id);
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/auth/check-auth', {
          withCredentials: true
        });
        updateAuthState(response.data.user);
      } catch (error) {
        updateAuthState(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [updateAuthState]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3001/api/auth/logout', {}, {
        withCredentials: true
      });
      updateAuthState(null);
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const value = {
    isLoggedIn,
    userRole,
    userId,
    isLoading,
    setIsLoggedIn,
    setUserRole,
    setUserId,
    handleLogout
  };

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 