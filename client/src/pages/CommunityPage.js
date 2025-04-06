import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import CategoryTree from '../components/CategoryTree';

const CommunityPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // URL에서 카테고리 ID 추출
  const getCategoryIdFromUrl = () => {
    if (location.pathname.includes('/community/category/')) {
      const match = location.pathname.match(/\/community\/category\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const categoryId = getCategoryIdFromUrl();
      const response = await axios.get(`${getApiUrl()}/api/boards`, {
        params: {
          page: currentPage,
          limit: 10,
          categoryId: categoryId
        }
      });
      setPosts(response.data.posts);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('게시글 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, location.pathname]);

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    navigate('/community/create');
  };

  const handlePostClick = (postId) => {
    navigate(`/community/boards/${postId}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-full mx-auto p-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-semibold text-gray-900">커뮤니티</h1>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Overview</button>
              <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">List</button>
              <button className="px-4 py-2 text-sm text-gray-900 bg-gray-100 rounded-md">Board</button>
              <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Calendar</button>
            </div>
          </div>
          <button
            onClick={handleWriteClick}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            새 글 작성
          </button>
        </div>

        <div className="flex gap-6">
          {/* 왼쪽 사이드바 - 카테고리 트리 */}
          <div className="w-1/4">
            <CategoryTree />
          </div>

          {/* 오른쪽 메인 컨텐츠 */}
          <div className="flex-1">
            {/* 칸반 보드 레이아웃 */}
            <div className="grid grid-cols-3 gap-6">
              {/* 최신 글 */}
              <div className="bg-[#f8f9fa] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    최신 글
                  </h2>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                    {posts.filter(p => p.created_at > new Date(Date.now() - 24*60*60*1000)).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {posts.filter(p => p.created_at > new Date(Date.now() - 24*60*60*1000)).map(post => (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{post.title}</h3>
                        <span className="flex-shrink-0 text-xs text-gray-500 ml-2">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {post.category_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-500">
                          <span className="text-xs flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {post.view_count}
                          </span>
                          {post.comment_count > 0 && (
                            <span className="text-xs flex items-center text-blue-600">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              {post.comment_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 인기 글 */}
              <div className="bg-[#f8f9fa] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    인기 글
                  </h2>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                    {posts.filter(p => p.view_count > 100).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {posts.filter(p => p.view_count > 100).map(post => (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{post.title}</h3>
                        <span className="flex-shrink-0 text-xs text-gray-500 ml-2">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {post.category_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-500">
                          <span className="text-xs flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {post.view_count}
                          </span>
                          {post.comment_count > 0 && (
                            <span className="text-xs flex items-center text-blue-600">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              {post.comment_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 전체 글 */}
              <div className="bg-[#f8f9fa] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    전체 글
                  </h2>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                    {posts.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {posts.map(post => (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{post.title}</h3>
                        <span className="flex-shrink-0 text-xs text-gray-500 ml-2">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {post.category_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-500">
                          <span className="text-xs flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {post.view_count}
                          </span>
                          {post.comment_count > 0 && (
                            <span className="text-xs flex items-center text-blue-600">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              {post.comment_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage; 