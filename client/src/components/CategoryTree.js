import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';

const CategoryTree = ({ onSelectCategory = () => {}, selectedCategoryId = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [currentCategories, setCurrentCategories] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState({
    types: true,
    categories: false
  });
  const [error, setError] = useState(null);

  // URL에서 카테고리 ID 추출
  const getCategoryIdFromUrl = () => {
    if (location.pathname.includes('/community/category/')) {
      const match = location.pathname.match(/\/community\/category\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  // 카테고리 타입 로딩
  useEffect(() => {
    const loadCategoryTypes = async () => {
      try {
        setLoading(prev => ({ ...prev, types: true }));
        const response = await api.get('/api/boards/category-types');
        setCategoryTypes(response.data);
        setLoading(prev => ({ ...prev, types: false }));
      } catch (error) {
        console.error('카테고리 타입 로딩 오류:', error);
        setError('카테고리 타입을 불러오는데 실패했습니다.');
        setLoading(prev => ({ ...prev, types: false }));
      }
    };

    loadCategoryTypes();
  }, []);

  // 카테고리 로딩
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(prev => ({ ...prev, categories: true }));
        const response = await api.get('/api/boards/categories');
        setCurrentCategories(response.data);
        setLoading(prev => ({ ...prev, categories: false }));
      } catch (error) {
        console.error('카테고리 로딩 오류:', error);
        setError('카테고리를 불러오는데 실패했습니다.');
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    loadCategories();
  }, []);

  const handleCategorySelect = (category) => {
    if (typeof onSelectCategory === 'function') {
      onSelectCategory(category.id);
    }
    navigate(`/community/category/${category.id}`);
  };

  const currentSelectedCategoryId = location.pathname.includes('/create') 
    ? selectedCategoryId 
    : getCategoryIdFromUrl();

  useEffect(() => {
    if (location.pathname.includes('/community/category/')) {
      const categoryId = getCategoryIdFromUrl();
      if (categoryId && typeof onSelectCategory === 'function') {
        onSelectCategory(categoryId);
      }
    }
  }, [location.pathname, onSelectCategory]);

  if (loading.types) return <div className="p-4">카테고리 타입을 불러오는 중...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white shadow-lg transition-all duration-300 z-40 
      ${isCollapsed ? 'w-16' : 'w-64'} font-['Pretendard']`}>
      {/* 사이드바 헤더 */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        {!isCollapsed && <h2 className="text-base font-semibold text-gray-900">카테고리</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* 카테고리 목록 */}
      <div className="overflow-y-auto h-[calc(100%-56px)]">
        {categoryTypes.map(type => (
          <div key={type.id} className="border-b last:border-b-0">
            <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50">
              {type.type_name}
            </div>
            <div className="py-2">
              {currentCategories
                .filter(category => category.category_type_id === type.id)
                .map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                      currentSelectedCategoryId === category.id.toString()
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {category.category_name}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryTree; 