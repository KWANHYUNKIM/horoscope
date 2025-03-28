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
  const [categoryId, setCategoryId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boardsResponse, categoriesResponse] = await Promise.all([
          axios.get('http://localhost:3001/api/boards', { withCredentials: true }),
          axios.get('http://localhost:3001/api/boards/categories', { withCredentials: true })
        ]);
        setBoards(boardsResponse.data);
        
        // 기존 카테고리 데이터 필터링 및 소아과 카테고리 추가
        const validCategories = categoriesResponse.data.filter(cat => cat && cat.name);
        const defaultCategories = [
          { id: 'pediatrics', name: '소아과', category_name: '소아과' },
          ...validCategories
        ];
        setCategories(defaultCategories);
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* 상단 헤더 영역 */}
        <div className="border-b border-gray-100 pb-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800 font-['Pretendard']">
              {categoryId ? categories.find(c => c.id === categoryId)?.name : '전체 게시글'}
            </h1>
            {isLoggedIn && (
              <button
                onClick={() => navigate('/community/create')}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                글쓰기
              </button>
            )}
          </div>

          {/* 카테고리 필터 */}
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setCategoryId(null)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                !categoryId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {categories
              .filter(cat => cat && cat.name) // null 값과 name이 없는 카테고리 필터링
              .map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    categoryId === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {boards.map(board => (
            <div
              key={board.id}
              onClick={() => handleBoardClick(board.id)}
              className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-base font-bold text-gray-800 mb-1">{board.title}</h2>
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="mr-3">작성자: {board.username}</span>
                    <span className="mr-3">작성일: {new Date(board.created_at).toLocaleString()}</span>
                    <span>댓글: {board.comment_count}</span>
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                  {board.category_name}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{board.content}</p>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage; 