import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavigationBar = ({ onLogout }) => {
  const { isLoggedIn, userRole } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                삐뽀삐뽀119
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/hospitals"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                병원 찾기
              </Link>
              <Link
                to="/community"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                커뮤니티
              </Link>
              {isLoggedIn && userRole === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  관리자 페이지
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {isLoggedIn ? (
              <>
                <span className="text-gray-700">
                  {userRole === 'admin' ? '관리자' : '일반 사용자'}
                </span>
                <button
                  onClick={onLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar; 