import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    category_name: '',
    description: '',
    allow_comments: true,
    is_secret_default: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/boards/categories');
      setCategories(response.data);
    } catch (error) {
      setError('카테고리 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3001/api/boards/categories', newCategory, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('카테고리가 성공적으로 생성되었습니다.');
      setNewCategory({
        category_name: '',
        description: '',
        allow_comments: true,
        is_secret_default: false
      });
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || '카테고리 생성에 실패했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 카테고리를 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/boards/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('카테고리가 성공적으로 삭제되었습니다.');
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || '카테고리 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">게시판 카테고리 관리</h1>

      {/* 카테고리 생성 폼 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">새 카테고리 생성</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리 이름
            </label>
            <input
              type="text"
              value={newCategory.category_name}
              onChange={(e) => setNewCategory({ ...newCategory, category_name: e.target.value })}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <input
              type="text"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newCategory.allow_comments}
                onChange={(e) => setNewCategory({ ...newCategory, allow_comments: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">댓글 허용</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newCategory.is_secret_default}
                onChange={(e) => setNewCategory({ ...newCategory, is_secret_default: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">기본 비밀글</span>
            </label>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            카테고리 생성
          </button>
        </form>
      </div>

      {/* 메시지 표시 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* 카테고리 목록 */}
      <div className="bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold p-6 border-b">카테고리 목록</h2>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">카테고리 이름</th>
                  <th className="px-4 py-2 text-left">설명</th>
                  <th className="px-4 py-2 text-center">댓글 허용</th>
                  <th className="px-4 py-2 text-center">기본 비밀글</th>
                  <th className="px-4 py-2 text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t">
                    <td className="px-4 py-2">{category.category_name}</td>
                    <td className="px-4 py-2">{category.description}</td>
                    <td className="px-4 py-2 text-center">
                      {category.allow_comments ? '✓' : '✗'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {category.is_secret_default ? '✓' : '✗'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementPage; 