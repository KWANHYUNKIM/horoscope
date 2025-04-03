import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import CategoryTree from '../components/CategoryTree';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const selectedCategory = categories.find(cat => cat.id === categoryId);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [categoryId]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/boards/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('카테고리 로딩 실패:', error);
      setError('카테고리를 불러오는데 실패했습니다.');
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/boards', {
        params: {
          categoryId: categoryId
        }
      });
      
      // 서버 응답 구조에 맞게 데이터 설정
      if (response.data && response.data.boards) {
        setPosts(response.data.boards);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
      } else {
        setPosts([]);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
      setError('게시글을 불러오는데 실패했습니다.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteClick = () => {
    navigate('/community/create');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 페이지 변경 시 게시글 다시 불러오기
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 카테고리 트리 */}
          <CategoryTree
            categories={categories}
            onSelectCategory={setCategoryId}
            selectedCategoryId={categoryId}
          />

          {/* 메인 컨텐츠 영역 */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-800 font-['Pretendard']">
                    {selectedCategory ? selectedCategory.category_name : '전체 게시글'}
                  </h1>
                  <button 
                    onClick={handleWriteClick}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    글쓰기
                  </button>
                </div>
              </div>

              {/* 게시글 목록 */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">로딩 중...</div>
                ) : error ? (
                  <div className="text-center py-8 text-red-600">{error}</div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">게시글이 없습니다.</div>
                ) : (
                  posts.map(post => (
                    <div
                      key={post.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={() => navigate(`/community/post/${post.id}`)}
                    >
                      <h2 className="text-lg font-medium text-gray-800">{post.title}</h2>
                      <p className="text-gray-600 mt-2">{post.summary}</p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-500">
                          작성자: {post.username} | 조회수: {post.view_count}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage; 