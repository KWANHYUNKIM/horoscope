import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';

const CategoryTree = ({ onSelectCategory, selectedCategoryId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [currentCategories, setCurrentCategories] = useState([]);
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
    // 카테고리 선택 시 항상 해당 카테고리 페이지로 이동
    navigate(`/community/category/${category.id}`);
  };

  // 현재 선택된 카테고리 ID 결정
  const currentSelectedCategoryId = location.pathname.includes('/create') 
    ? selectedCategoryId 
    : getCategoryIdFromUrl();

  // URL이 변경될 때마다 선택된 카테고리 업데이트
  useEffect(() => {
    if (location.pathname.includes('/community/category/')) {
      const categoryId = getCategoryIdFromUrl();
      if (categoryId) {
        onSelectCategory(categoryId);
      }
    }
  }, [location.pathname, onSelectCategory]);

  if (loading.types) return <div className="p-4">카테고리 타입을 불러오는 중...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="w-64 bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">카테고리</h2>
      <div className="space-y-4">
        {/* 현재 카테고리 목록 */}
        <div className="space-y-1">
          {loading.categories ? (
            <div className="text-sm text-gray-500">로딩 중...</div>
          ) : (
            currentCategories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors flex items-center ${
                  currentSelectedCategoryId === category.id.toString()
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.category_name}
                {currentSelectedCategoryId === category.id.toString() && (
                  <span className="ml-2 text-xs text-blue-500">✓</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryTree; 