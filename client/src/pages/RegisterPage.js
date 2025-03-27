import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    verificationCode: '',
    realName: '',
    nickname: '',
    interests: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    realName: '',
    nickname: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      const response = await axios.post('http://localhost:3001/api/email/send-verification', {
        email: formData.email
      });

      setIsVerificationSent(true);
      alert('인증 코드가 이메일로 전송되었습니다. 1분 이내에 입력해주세요.');
    } catch (err) {
      setError(err.response?.data?.message || '인증 코드 전송에 실패했습니다.');
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

    if (!validateField('username', formData.username)) {
      return;
    }

    if (!validateField('password', formData.password)) {
      return;
    }

    if (!validateField('confirmPassword', formData.confirmPassword)) {
      return;
    }

    if (!isVerified) {
      setError('이메일 인증을 완료해주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', formData);
      
      if (response.data.success) {
        alert('회원가입이 완료되었습니다.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          회원가입
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
                  placeholder="3자 이상, 영문/숫자/언더스코어(_) 사용 가능"
                />
                {validationErrors.username && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
                )}
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
                  placeholder="6자 이상, 영문/숫자 포함"
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                비밀번호 확인
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isVerificationSent || loading}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isVerificationSent ? '인증코드 전송됨' : '인증코드 전송'}
                </button>
              </div>
            </div>

            {isVerificationSent && (
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  인증코드
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    value={formData.verificationCode}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isVerified || loading}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
                  placeholder="2자 이상, 한글만 입력 가능"
                />
                {validationErrors.realName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.realName}</p>
                )}
              </div>
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
                disabled={loading || Object.values(validationErrors).some(error => error)}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? '가입 중...' : '회원가입'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 