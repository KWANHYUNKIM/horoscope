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
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getApiUrl()}/api/boards`, {
        params: {
          page: currentPage,
          limit: 10,
          categoryId: selectedCategory
        },
        withCredentials: true
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
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${getApiUrl()}/api/boards/categories`, {
          withCredentials: true
        });
        setCategories(response.data);
      } catch (error) {
        console.error('카테고리 로딩 실패:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedCategory]);

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (selectedCategory) {
      navigate(`/community/create/${selectedCategory}`);
    } else {
      navigate('/community/create');
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/community/boards/${postId}`);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 이동
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex gap-6">
        {/* 왼쪽 사이드바 - 카테고리 트리 */}
        <div className="w-1/4">
          <CategoryTree
            onSelectCategory={handleCategorySelect}
            selectedCategoryId={selectedCategory}
          />
        </div>

        {/* 오른쪽 메인 컨텐츠 */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">커뮤니티</h1>
            <button
              onClick={handleWriteClick}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              글쓰기
            </button>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="grid grid-cols-12 gap-4 p-4 border-b font-semibold text-gray-700">
              <div className="col-span-6">제목</div>
              <div className="col-span-2">작성자</div>
              <div className="col-span-2">카테고리</div>
              <div className="col-span-1">조회</div>
              <div className="col-span-1">작성일</div>
            </div>

            {posts.map(post => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50 cursor-pointer"
              >
                <div className="col-span-6">
                  <span className="text-gray-900">{post.title}</span>
                  {post.comment_count > 0 && (
                    <span className="ml-2 text-blue-500">[{post.comment_count}]</span>
                  )}
                </div>
                <div className="col-span-2 text-gray-600">{post.author_name}</div>
                <div className="col-span-2 text-gray-600">{post.category_name}</div>
                <div className="col-span-1 text-gray-600">{post.view_count}</div>
                <div className="col-span-1 text-gray-600">
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                게시글이 없습니다.
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center p-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`mx-1 px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage; 