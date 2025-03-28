import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CommunityPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading } = useAuth();
  const [boards, setBoards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boardsResponse, categoriesResponse] = await Promise.all([
          axios.get('http://localhost:3001/api/boards', { withCredentials: true }),
          axios.get('http://localhost:3001/api/boards/categories', { withCredentials: true })
        ]);
        setBoards(boardsResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateBoardClick = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    navigate('/community/create');
  };

  const handleBoardClick = (boardId) => {
    navigate(`/community/board/${boardId}`);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    navigate(`/community/category/${categoryId}`);
  };

  if (loading || isLoading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        <button
          onClick={handleCreateBoardClick}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          글쓰기
        </button>
      </div>

      <div className="flex gap-8">
        {/* 메인 컨텐츠 */}
        <div className="flex-grow">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">게시글 목록</h2>
            <div className="space-y-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => handleBoardClick(board.id)}
                  className="border-b pb-4 cursor-pointer hover:bg-gray-50 p-4 rounded"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{board.title}</h3>
                      <p className="text-gray-600 mt-1">{board.summary}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="mr-4">댓글 {board.comment_count}</span>
                      <span>{new Date(board.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 카테고리 사이드바 */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-bold mb-4">카테고리</h2>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    onClick={() => handleCategoryClick(category.id)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                      selectedCategory === category.id ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    {category.category_name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage; 