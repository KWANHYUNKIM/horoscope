import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const CategoryTree = ({ categories = [], onSelectCategory, selectedCategoryId }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  // 카테고리를 계층 구조로 변환
  const buildCategoryTree = (categories) => {
    const categoryMap = {};
    const rootCategories = [];

    // 먼저 모든 카테고리를 맵으로 변환
    categories.forEach(category => {
      categoryMap[category.id] = {
        ...category,
        children: []
      };
    });

    // 부모-자식 관계 설정
    categories.forEach(category => {
      if (category.parent_id) {
        const parent = categoryMap[category.parent_id];
        if (parent) {
          parent.children.push(categoryMap[category.id]);
        }
      } else {
        rootCategories.push(categoryMap[category.id]);
      }
    });

    return rootCategories;
  };

  // 일반 게시판 카테고리와 계층형 카테고리 분리
  const boardCategories = categories.filter(cat => cat.category_type === 'board');
  const hierarchicalCategories = buildCategoryTree(
    categories.filter(cat => cat.category_type !== 'board')
  );

  const toggleExpand = (e, categoryId) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const renderCategoryNode = (category) => {
    const isExpanded = expandedCategories[category.id];
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} className="ml-2">
        <div 
          className={`flex items-center py-2 cursor-pointer hover:bg-gray-50 rounded-md ${
            selectedCategoryId === category.id ? 'bg-blue-50' : ''
          }`}
          onClick={() => onSelectCategory(category.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(e, category.id)}
              className="p-1 hover:bg-gray-200 rounded-md mr-1"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <div
            className={`flex-1 px-2 py-1 rounded-md ${
              selectedCategoryId === category.id
                ? 'text-blue-600 font-medium'
                : 'text-gray-700'
            }`}
          >
            {category.category_name}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4 border-l border-gray-200">
            {category.children.map(child => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white rounded-lg shadow-md p-4 h-[calc(100vh-200px)] overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 text-gray-800">카테고리</h2>
      
      {/* 전체 게시글 버튼 */}
      <div
        onClick={() => onSelectCategory(null)}
        className={`px-4 py-2 cursor-pointer rounded-md mb-4 ${
          !selectedCategoryId
            ? 'bg-blue-50 text-blue-600 font-medium'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        전체 게시글
      </div>

      {/* 일반 게시판 카테고리 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">게시판</h3>
        {boardCategories.map(category => (
          <div
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`px-4 py-2 cursor-pointer rounded-md ${
              selectedCategoryId === category.id
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {category.category_name}
          </div>
        ))}
      </div>

      {/* 구분선 */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* 계층형 카테고리 */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">지역/병원</h3>
        {hierarchicalCategories.map(category => renderCategoryNode(category))}
      </div>
    </div>
  );
};

export default CategoryTree; 