import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getApiUrl } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn, setUserRole } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [kakaoSettings, setKakaoSettings] = useState({
    client_id: '',
    redirect_uri: ''
  });
  const [naverSettings, setNaverSettings] = useState({
    client_id: '',
    client_secret: '',
    redirect_uri: ''
  });

  useEffect(() => {
    setApiUrl(getApiUrl());
  }, []);

  useEffect(() => {
    const fetchSocialSettings = async () => {
      try {
        const [kakaoResponse, naverResponse] = await Promise.all([
          api.get('/api/auth/social-config/kakao'),
          api.get('/api/auth/social-config/naver')
        ]);
        
        setKakaoSettings(kakaoResponse.data);
        setNaverSettings(naverResponse.data);
      } catch (error) {
        console.error('소셜 로그인 설정 조회 실패:', error);
      }
    };
    fetchSocialSettings();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        username: formData.username,
        password: formData.password
      });

      if (response.data.user) {
        console.log('로그인 성공, 사용자 역할:', response.data.user.role);
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
        
        setSuccessMessage('로그인 성공!');
        
        setTimeout(() => {
          if (response.data.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError(error.response?.data?.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNaverLogin = async () => {
    try {
      if (!naverSettings.client_id || !naverSettings.redirect_uri) {
        alert('네이버 로그인 설정이 완료되지 않았습니다.');
        return;
      }

      const state = generateRandomString(16);
      localStorage.setItem('naverState', state);
      
      const naverLoginUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${naverSettings.client_id}&redirect_uri=${encodeURIComponent(naverSettings.redirect_uri)}&state=${state}`;
      
      window.location.href = naverLoginUrl;
    } catch (error) {
      console.error('네이버 로그인 시도 중 오류:', error);
      alert('네이버 로그인을 시도하는 중 오류가 발생했습니다.');
    }
  };

  const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const handleKakaoLogin = () => {
    if (!kakaoSettings.client_id || !kakaoSettings.redirect_uri) {
      alert('카카오 로그인 설정이 완료되지 않았습니다.');
      return;
    }
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoSettings.client_id}&redirect_uri=${kakaoSettings.redirect_uri}&response_type=code&scope=account_email profile_nickname profile_image`;
    window.location.href = KAKAO_AUTH_URL;
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await api.get('/api/auth/social-config/google');
      const { client_id, redirect_uri } = response.data;
      
      if (!client_id || !redirect_uri) {
        alert('구글 로그인 설정이 완료되지 않았습니다.');
        return;
      }

      const GOOGLE_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=email profile`;
      window.location.href = GOOGLE_AUTH_URL;
    } catch (error) {
      console.error('구글 로그인 설정 조회 실패:', error);
      alert('구글 로그인을 시도하는 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          로그인
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {successMessage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <div className="text-center">
                  <div className="text-green-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{successMessage}</h3>
                  <p className="text-sm text-gray-500">잠시 후 홈페이지로 이동합니다.</p>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <div className="text-center">
                  <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
                  <button
                    onClick={() => setError('')}
                    className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                아이디
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  간편 로그인
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleNaverLogin}
                className="w-full inline-flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-[#03C75A] text-sm font-medium text-white hover:bg-[#02b351] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#03C75A]"
              >
                <div className="w-5 h-5 flex items-center justify-center mr-2">
                  <img
                    className="w-full h-full object-contain"
                    src="/images/naver-icon.png"
                    alt="네이버 로고"
                  />
                </div>
                네이버 계정으로 로그인
              </button>

              <button
                onClick={handleKakaoLogin}
                className="w-full inline-flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-[#FEE500] text-sm font-medium text-[#000000] hover:bg-[#FDD800] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FEE500]"
              >
                <div className="w-5 h-5 flex items-center justify-center mr-2">
                  <img
                    className="w-full h-full object-contain"
                    src="/images/kakao-icon.png"
                    alt="카카오 로고"
                  />
                </div>
                카카오 계정으로 로그인
              </button>

              <button
                onClick={handleGoogleLogin}
                className="w-full inline-flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285F4]"
              >
                <div className="w-4 h-4 flex items-center justify-center mr-2">
                  <img
                    className="w-4 h-4 object-contain"
                    src="/images/google-icon.png"
                    alt="구글 로고"
                  />
                </div>
                구글 계정으로 로그인
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  계정이 없으신가요?{' '}
                  <a href="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
                    회원가입
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
