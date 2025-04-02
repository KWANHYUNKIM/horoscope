import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAuthState = useCallback((userData) => {
    // console.log('Updating Auth State with:', userData);
    if (userData) {
      setIsLoggedIn(true);
      setUserRole(userData.role);
      setUserId(userData.id);
      setUsername(userData.username);
      setUserProfileImage(userData.profile_image);
      setUser(userData);
      // console.log('Updated User State:', userData);
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setUserId(null);
      setUserProfileImage(null);
      setUsername(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/api/auth/check-auth');
        // console.log('Auth Response:', response.data);
        if (response.data && response.data.user) {
          // console.log('User Data:', response.data.user);
          updateAuthState(response.data.user);
        } else {
          updateAuthState(null);
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        updateAuthState(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [updateAuthState]);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      updateAuthState(null);
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const handleLogin = async (userData) => {
    try {
      updateAuthState(userData);
      return true;
    } catch (error) {
      console.error('로그인 상태 업데이트 오류:', error);
      return false;
    }
  };

  const value = {
    isLoggedIn,
    userRole,
    userId,
    username,
    userProfileImage,
    user,
    isLoading,
    setIsLoggedIn,
    setUserRole,
    setUserId,
    setUsername,
    setUserProfileImage,
    setUser,
    logout: handleLogout,
    login: handleLogin
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