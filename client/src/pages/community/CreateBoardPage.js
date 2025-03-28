import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CreateBoardPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isLoggedIn, userId } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesResponse = await axios.get('http://localhost:3001/api/boards/categories', { withCredentials: true });
        setCategories(categoriesResponse.data);
        
        if (id) {
          // 게시글 수정인 경우 기존 데이터 로드
          const boardResponse = await axios.get(`http://localhost:3001/api/boards/${id}`, { withCredentials: true });
          setTitle(boardResponse.data.title);
          setContent(boardResponse.data.content);
          setSelectedCategory(boardResponse.data.category_id.toString());
        }
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!title.trim() || !content.trim() || !selectedCategory) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      if (id) {
        // 수정
        await axios.put(
          `http://localhost:3001/api/boards/${id}`,
          {
            title,
            content,
            category_id: selectedCategory
          },
          { withCredentials: true }
        );
      } else {
        // 새 게시글 작성
        await axios.post(
          'http://localhost:3001/api/boards',
          {
            title,
            content,
            category_id: selectedCategory
          },
          { withCredentials: true }
        );
      }
      navigate('/community');
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      }
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">{id ? '게시글 수정' : '새 게시글 작성'}</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              카테고리
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">카테고리 선택</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded-lg"
              rows="10"
              placeholder="내용을 입력하세요"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {id ? '수정하기' : '작성하기'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardPage; 