import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { api } from '../utils/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const socialData = location.state?.socialData;
  const provider = location.state?.provider;

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    verificationCode: '',
    realName: '',
    nickname: '',
    interests: [],
    social_provider: '',
    social_id: '',
    is_email_verified: false,
    profile_image: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [remainingTime, setRemainingTime] = useState(180); // 3분 = 180초
  const [validationErrors, setValidationErrors] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    realName: '',
    nickname: '',
    email: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (socialData) {
      setFormData(prev => ({
        ...prev,
        email: socialData.email || '',
        nickname: socialData.nickname || '',
        username: socialData.username || '',
        // 소셜 로그인의 경우 비밀번호는 필요 없음
        is_email_verified: true
      }));
    }
  }, [socialData]);

  useEffect(() => {
    // 소셜 로그인 데이터가 있는 경우 필드 자동 채우기
    if (location.state?.socialLoginData) {
      const { email, nickname, profile_image, social_id, provider, name, given_name } = location.state.socialLoginData;
      
      console.log('소셜 로그인 데이터:', location.state.socialLoginData); // 디버깅용 로그

      setFormData(prev => ({
        ...prev,
        email,
        nickname: nickname || '',
        profile_image: profile_image || '',
        social_id,
        social_provider: provider,
        is_email_verified: true,
        realName: provider === 'google' ? `${given_name} ${name}` : '',
        interests: [],
        username: '', // 사용자가 직접 입력하도록 비워둠
        password: '', // 사용자가 직접 입력하도록 비워둠
      }));
      setIsVerified(true);
    }
  }, [location.state]);

  // 타이머 효과
  useEffect(() => {
    let timer;
    if (isVerificationSent && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
    } else if (remainingTime === 0) {
      setIsVerificationSent(false);
      setError('인증 시간이 만료되었습니다. 다시 인증코드를 발급받아주세요.');
    }
    return () => clearInterval(timer);
  }, [isVerificationSent, remainingTime]);

  const interests = [
    '암', '심장병', '당뇨병', '고혈압', '관절염', '호흡기질환',
    '소화기질환', '피부질환', '정신건강', '영양', '운동', '건강검진'
  ];

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'username':
        if (value.length < 3) {
          error = '아이디는 최소 3자 이상이어야 합니다.';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = '아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다.';
        }
        break;
      case 'password':
        if (value.length < 6) {
          error = '비밀번호는 최소 6자리 이상이어야 합니다.';
        } else if (!/[A-Za-z]/.test(value)) {
          error = '비밀번호는 알파벳을 포함해야 합니다.';
        } else if (!/[0-9]/.test(value)) {
          error = '비밀번호는 숫자를 포함해야 합니다.';
        }
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          error = '비밀번호가 일치하지 않습니다.';
        }
        break;
      case 'realName':
        if (value.length < 2) {
          error = '실명은 최소 2자 이상이어야 합니다.';
        } else if (!/^[가-힣]+$/.test(value)) {
          error = '실명은 한글만 입력 가능합니다.';
        }
        break;
      case 'nickname':
        if (value.length < 2) {
          error = '닉네임은 최소 2자 이상이어야 합니다.';
        } else if (value.length > 20) {
          error = '닉네임은 최대 20자까지 가능합니다.';
        }
        break;
    }
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
    return !error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    validateField(name, value);
  };

  const handleInterestChange = (interest) => {
    setFormData(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  const handleSendVerification = async () => {
    try {
      // 이메일 중복 확인
      const checkResponse = await axios.get(`http://localhost:3001/api/auth/check-email?email=${formData.email}`, {
        withCredentials: true
      });

      if (checkResponse.data.exists) {
        setError('이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.');
        return;
      }

      // 이메일 인증 코드 전송
      const response = await axios.post('http://localhost:3001/api/email/send-verification', {
        email: formData.email
      });

      setIsVerificationSent(true);
      setRemainingTime(180); // 타이머 초기화
      alert('인증 코드가 이메일로 전송되었습니다. 3분 이내에 입력해주세요.');
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('인증 코드 전송에 실패했습니다.');
      }
    }
  };

  const handleEmailChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setValidationErrors(prev => ({
        ...prev,
        email: '올바른 이메일 형식이 아닙니다.'
      }));
      return;
    } else {
      setValidationErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
  };

  const handleVerifyCode = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/email/verify-email', {
        email: formData.email,
        verificationCode: formData.verificationCode
      });

      setIsVerified(true);
      alert('이메일 인증이 완료되었습니다.');
    } catch (err) {
      setError(err.response?.data?.message || '인증 코드 확인에 실패했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 소셜 로그인 사용자의 경우 이메일 인증 건너뛰기
      if (!formData.social_provider && !isVerified) {
        setError('이메일 인증이 필요합니다.');
        setLoading(false);
        return;
      }

      // interests를 JSON 문자열로 변환
      const interestsJson = JSON.stringify(formData.interests);

      // 회원가입 데이터 준비
      const registerData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        nickname: formData.nickname,
        interests: interestsJson,
        social_id: formData.social_id || null,
        social_provider: formData.social_provider || null,
        is_email_verified: formData.social_provider ? 1 : (formData.is_email_verified ? 1 : 0),
        profile_image: formData.profile_image || null
      };

      console.log('회원가입 요청 데이터:', registerData); // 디버깅용 로그

      const response = await api.post('/api/auth/register', registerData);
      console.log('회원가입 응답:', response.data); // 디버깅용 로그

      if (response.data.success) {
        // 소셜 로그인 사용자의 경우 바로 로그인 처리
        if (formData.social_provider) {
          console.log('소셜 로그인 사용자 로그인 시도'); // 디버깅용 로그
          const loginResponse = await api.post('/api/auth/login', {
            username: formData.username,
            password: formData.password
          });

          console.log('로그인 응답:', loginResponse.data); // 디버깅용 로그

          if (loginResponse.data.user) {
            navigate('/');
          }
        } else {
          navigate('/login', { 
            state: { 
              message: '회원가입이 완료되었습니다. 로그인해주세요.' 
            }
          });
        }
      }
    } catch (error) {
      console.error('회원가입 에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data
      });
      setError(error.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {formData.social_provider ? '소셜 계정 정보 입력' : '회원가입'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 아이디 필드 - 모든 사용자에게 표시 */}
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

            {/* 비밀번호 필드 - 모든 사용자에게 표시 */}
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

            {/* 이메일 필드 - 소셜 로그인 사용자는 읽기 전용 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div className="mt-1 flex space-x-3">
                <div className="flex-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleEmailChange}
                    readOnly={formData.social_provider}
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                      formData.social_provider ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>
                {!formData.social_provider && (
                  <button
                    type="button"
                    onClick={handleSendVerification}
                    disabled={isVerificationSent || loading || validationErrors.email}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isVerificationSent ? '인증코드 전송됨' : '인증코드 전송'}
                  </button>
                )}
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* 이메일 인증 코드 입력 - 소셜 로그인 사용자는 제외 */}
            {isVerificationSent && !formData.social_provider && (
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  인증코드
                </label>
                <div className="mt-1 flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      required
                      value={formData.verificationCode}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-sm text-gray-500">
                        {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isVerified || loading || remainingTime === 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isVerified ? '인증완료' : '인증하기'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="realName" className="block text-sm font-medium text-gray-700">
                실명
              </label>
              <div className="mt-1">
                <input
                  id="realName"
                  name="realName"
                  type="text"
                  required
                  value={formData.realName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {validationErrors.realName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.realName}</p>
              )}
            </div>

            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                닉네임
              </label>
              <div className="mt-1">
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  required
                  value={formData.nickname}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="2-20자"
                />
                {validationErrors.nickname && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.nickname}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                관심사
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {interests.map((interest) => (
                  <label key={interest} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(interest)}
                      onChange={() => handleInterestChange(interest)}
                      className="form-checkbox h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? '처리 중...' : '회원가입'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 