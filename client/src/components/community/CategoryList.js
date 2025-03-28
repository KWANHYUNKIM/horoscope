import React from 'react';
import { useNavigate } from 'react-router-dom';

const CategoryList = ({ categories, categoryId }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">카테고리</h2>
      <div className="space-y-2">
        <div
          className={`p-2 hover:bg-gray-100 rounded cursor-pointer ${!categoryId ? 'bg-indigo-50 text-indigo-600' : ''}`}
          onClick={() => navigate('/community')}
        >
          전체 게시글
        </div>
        {categories.map((category) => (
          <div
            key={category.id}
            className={`p-2 hover:bg-gray-100 rounded cursor-pointer ${categoryId === category.id.toString() ? 'bg-indigo-50 text-indigo-600' : ''}`}
            onClick={() => navigate(`/community/${category.id}`)}
          >
            {category.category_name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList; 