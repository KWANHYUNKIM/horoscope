import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { getBoards, getCategories } from '../../redux/actions/communityActions';

const CommunityPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { boards, categories } = useSelector(state => state.community);
  const { isLoggedIn } = useSelector(state => state.auth);
  const [categoryId, setCategoryId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    dispatch(getBoards(categoryId, currentPage));
    dispatch(getCategories());
  }, [dispatch, categoryId, currentPage]);

  const handleBoardClick = (id) => {
    navigate(`/community/board/${id}`);
  };

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
            {categories.map(cat => (
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