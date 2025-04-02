import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';

const ProfilePage = () => {
  const { userId, username } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    nickname: '',
    interests: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [currentPasswordError, setCurrentPasswordError] = useState('');

  // 랜덤 색상 생성 함수
  const getRandomColor = (username) => {
    const colors = [
      'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 
      'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-green-500',
      'bg-yellow-500', 'bg-orange-500'
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // 사용자 이니셜 가져오기
  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${getApiUrl()}/api/auth/users/${userId}`, { withCredentials: true });
        setProfile(prev => ({
          ...prev,
          username: response.data.username,
          email: response.data.email,
          nickname: response.data.nickname,
          interests: response.data.interests || ''
        }));
        setPreviewUrl(response.data.profile_image ? `${getApiUrl()}${response.data.profile_image}` : '');
      } catch (error) {
        console.error('프로필 로딩 실패:', error);
        setError('프로필 정보를 불러오는데 실패했습니다.');
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));

    // 비밀번호 일치 여부 확인
    if (name === 'newPassword' || name === 'confirmPassword') {
      const newPassword = name === 'newPassword' ? value : profile.newPassword;
      const confirmPassword = name === 'confirmPassword' ? value : profile.confirmPassword;
      setPasswordMatch(newPassword === confirmPassword);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setCurrentPasswordError('');

    if (profile.newPassword && !passwordMatch) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nickname', profile.nickname);
      formData.append('interests', profile.interests || '[]');
      
      if (profile.newPassword) {
        formData.append('current_password', profile.currentPassword);
        formData.append('new_password', profile.newPassword);
      }

      if (profileImage) {
        formData.append('profile_image', profileImage);
      }

      const response = await axios.put(
        `${getApiUrl()}/api/auth/users/${userId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );

      setMessage('프로필이 성공적으로 업데이트되었습니다.');
      setProfile(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      if (error.response?.data?.message === '현재 비밀번호가 일치하지 않습니다.') {
        setCurrentPasswordError('현재 비밀번호가 일치하지 않습니다.');
      } else {
        setError(error.response?.data?.message || '프로필 업데이트에 실패했습니다.');
      }
    }
  };

  // 프로필 이미지 URL 생성 함수
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${getApiUrl()}/uploads/${imagePath}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">프로필 설정</h2>
          
          {message && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="프로필 이미지"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-semibold ${getRandomColor(profile.username)}`}>
                    {getInitials(profile.username)}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer hover:bg-blue-600">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </label>
              </div>
              <div>
                <p className="text-sm text-gray-500">프로필 이미지 변경</p>
                <p className="text-xs text-gray-400">권장 크기: 200x200px</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">아이디</label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">이메일</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">닉네임</label>
              <input
                type="text"
                name="nickname"
                value={profile.nickname}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">관심사</label>
              <textarea
                name="interests"
                value={profile.interests}
                onChange={handleChange}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">비밀번호 변경</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">현재 비밀번호</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={profile.currentPassword}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      currentPasswordError ? 'border-red-500' : ''
                    }`}
                  />
                  {currentPasswordError && (
                    <p className="mt-1 text-sm text-red-600">{currentPasswordError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={profile.newPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={profile.confirmPassword}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      !passwordMatch ? 'border-red-500' : ''
                    }`}
                  />
                  {!passwordMatch && (
                    <p className="mt-1 text-sm text-red-600">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                저장
              </button>
            </div>
          </form>

          {profile.profile_image && (
            <div className="mt-4">
              <img
                src={getProfileImageUrl(profile.profile_image)}
                alt="프로필 이미지"
                className="w-32 h-32 rounded-full object-cover mx-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 