import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(''); // 제네릭 제거
  const [password, setPassword] = useState(''); // 제네릭 제거
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('role', data.role || 'user');
        navigate('/');
      } else {
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('로그인 에러:', err);
      setError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  return (
    <section className="container mx-auto mt-10 p-6 px-4 md:px-40">
      <div className="bg-white shadow-md hover:shadow-lg rounded-lg overflow-hidden transition-transform duration-300 p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">로그인</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">아이디:</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="아이디를 입력하세요"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">비밀번호:</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;
