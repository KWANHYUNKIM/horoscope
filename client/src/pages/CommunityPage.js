import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getBoards, getCategories } from '../redux/actions/communityActions';
import { useAuth } from '../contexts/AuthContext';

const CommunityPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const communityState = useSelector(state => state.community || {});
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [categoryId, setCategoryId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await dispatch(getBoards(categoryId, currentPage));        
        await dispatch(getCategories());
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch, categoryId, currentPage]);

  // Redux 상태가 변경될 때마다 로컬 상태 업데이트
  useEffect(() => {

    if (communityState) {
      // boards 처리
      let newBoards = [];
      if (communityState.boards) {
        if (Array.isArray(communityState.boards)) {
          newBoards = communityState.boards;
        } else if (typeof communityState.boards === 'object' && communityState.boards !== null) {
          newBoards = Object.values(communityState.boards);
        }
      }
      
      // categories 처리
      let newCategories = [];
      if (communityState.categories) {
        if (Array.isArray(communityState.categories)) {
          newCategories = communityState.categories;
        } else if (typeof communityState.categories === 'object' && communityState.categories !== null) {
          newCategories = Object.values(communityState.categories);
        }
      }
          
      setBoards(newBoards);
      setCategories(newCategories);
      
      if (typeof communityState.totalPages === 'number') {
        setTotalPages(communityState.totalPages);
      }
      if (typeof communityState.currentPage === 'number') {
        setCurrentPage(communityState.currentPage);
      }
    }
  }, [communityState]);

  const handleBoardClick = (id) => {
    navigate(`/community/board/${id}`);
  };

  if (isLoading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-gray-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* 상단 헤더 영역 */}
        <div className="border-b border-gray-100 pb-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800 font-['Pretendard']">
              {categoryId ? categories.find(c => c.id === categoryId)?.category_name : '전체 게시글'}
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
            {Array.isArray(categories) && categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  categoryId === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {Array.isArray(boards) && boards.map(board => (
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