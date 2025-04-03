import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const CategoryTree = ({ onSelectCategory, selectedCategoryId }) => {
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [currentCategories, setCurrentCategories] = useState([]);
  const [loading, setLoading] = useState({
    types: true,
    categories: false
  });
  const [error, setError] = useState(null);

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

  // 현재 선택된 카테고리의 하위 카테고리 로딩
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(prev => ({ ...prev, categories: true }));
        const lastSelected = selectedCategories[selectedCategories.length - 1];
        
        // 현재 선택된 카테고리의 타입을 확인
        let nextTypeId = null;
        if (!lastSelected) {
          // 첫 번째 단계: 지역 카테고리
          nextTypeId = categoryTypes.find(type => type.type_code === 'REGION')?.id;
        } else {
          // 현재 카테고리의 타입에 따라 다음 타입 결정
          const currentType = categoryTypes.find(type => type.id === lastSelected.category_type_id);
          if (currentType?.type_code === 'REGION' && !lastSelected.parent_id) {
            // 최상위 지역 선택 후: 같은 지역 타입의 하위 카테고리 (구/시/군)
            nextTypeId = currentType.id;
          } else if (currentType?.type_code === 'REGION' && lastSelected.parent_id) {
            // 구/시/군 선택 후: 병원 종류
            nextTypeId = categoryTypes.find(type => type.type_code === 'HOSPITAL_TYPE')?.id;
          } else if (currentType?.type_code === 'HOSPITAL_TYPE') {
            // 병원 종류 선택 후: 진료과
            nextTypeId = categoryTypes.find(type => type.type_code === 'DEPARTMENT')?.id;
          }
        }

        const response = await api.get('/api/boards/categories', {
          params: { 
            parent_id: lastSelected?.id || null,
            type: nextTypeId
          }
        });
        setCurrentCategories(response.data);
        setLoading(prev => ({ ...prev, categories: false }));
      } catch (error) {
        console.error('카테고리 로딩 오류:', error);
        setError('카테고리를 불러오는데 실패했습니다.');
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    loadCategories();
  }, [selectedCategories, categoryTypes]);

  const handleCategorySelect = (category) => {
    const newSelectedCategories = [...selectedCategories, category];
    setSelectedCategories(newSelectedCategories);
    onSelectCategory(category.id);
  };

  const handleBack = () => {
    const newSelectedCategories = selectedCategories.slice(0, -1);
    setSelectedCategories(newSelectedCategories);
    if (newSelectedCategories.length > 0) {
      onSelectCategory(newSelectedCategories[newSelectedCategories.length - 1].id);
    } else {
      onSelectCategory(null);
    }
  };

  if (loading.types) return <div className="p-4">카테고리 타입을 불러오는 중...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="w-64 bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">카테고리</h2>
      <div className="space-y-4">
        {/* 선택된 카테고리 경로 표시 */}
        {selectedCategories.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                {selectedCategories.map((cat, index) => (
                  <span key={cat.id}>
                    {index > 0 && ' > '}
                    {cat.category_name}
                  </span>
                ))}
              </h3>
              <button
                onClick={handleBack}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                뒤로
              </button>
            </div>
          </div>
        )}

        {/* 현재 카테고리 목록 */}
        <div className="space-y-1">
          {loading.categories ? (
            <div className="text-sm text-gray-500">로딩 중...</div>
          ) : (
            currentCategories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedCategoryId === category.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.category_name}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryTree; 