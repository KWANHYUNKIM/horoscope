import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';

const CategoryTypeManagementPage = () => {
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [newType, setNewType] = useState({
    type_name: '',
    type_code: '',
    description: '',
    order_sequence: 1,
    is_active: true
  });
  const [editingType, setEditingType] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategoryTypes();
  }, []);

  const fetchCategoryTypes = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/boards/category-types`, {
        withCredentials: true
      });
      setCategoryTypes(response.data);
    } catch (error) {
      setError('카테고리 타입 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${getApiUrl()}/api/boards/category-types`, newType, {
        withCredentials: true
      });
      setSuccess('카테고리 타입이 성공적으로 생성되었습니다.');
      setNewType({
        type_name: '',
        type_code: '',
        description: '',
        order_sequence: 1,
        is_active: true
      });
      fetchCategoryTypes();
    } catch (error) {
      setError(error.response?.data?.message || '카테고리 타입 생성에 실패했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 카테고리 타입을 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`${getApiUrl()}/api/boards/category-types/${id}`, {
        withCredentials: true
      });
      setSuccess('카테고리 타입이 성공적으로 삭제되었습니다.');
      fetchCategoryTypes();
    } catch (error) {
      setError(error.response?.data?.message || '카테고리 타입 삭제에 실패했습니다.');
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setNewType({
      type_name: type.type_name,
      type_code: type.type_code,
      description: type.description,
      order_sequence: type.order_sequence,
      is_active: type.is_active
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${getApiUrl()}/api/boards/category-types/${editingType.id}`, newType, {
        withCredentials: true
      });
      setSuccess('카테고리 타입이 성공적으로 수정되었습니다.');
      setEditingType(null);
      setNewType({
        type_name: '',
        type_code: '',
        description: '',
        order_sequence: 1,
        is_active: true
      });
      fetchCategoryTypes();
    } catch (error) {
      setError(error.response?.data?.message || '카테고리 타입 수정에 실패했습니다.');
    }
  };

  const cancelEdit = () => {
    setEditingType(null);
    setNewType({
      type_name: '',
      type_code: '',
      description: '',
      order_sequence: 1,
      is_active: true
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">카테고리 타입 관리</h1>

      {/* 카테고리 타입 생성/수정 폼 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold p-6 border-b">
          {editingType ? '카테고리 타입 수정' : '새 카테고리 타입 생성'}
        </h2>
        <form onSubmit={editingType ? handleUpdate : handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              타입 이름
            </label>
            <input
              type="text"
              value={newType.type_name}
              onChange={(e) => setNewType({ ...newType, type_name: e.target.value })}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              타입 코드
            </label>
            <input
              type="text"
              value={newType.type_code}
              onChange={(e) => setNewType({ ...newType, type_code: e.target.value })}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <input
              type="text"
              value={newType.description}
              onChange={(e) => setNewType({ ...newType, description: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              순서
            </label>
            <input
              type="number"
              value={newType.order_sequence}
              onChange={(e) => setNewType({ ...newType, order_sequence: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-md"
              min="1"
              required
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newType.is_active}
                onChange={(e) => setNewType({ ...newType, is_active: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">활성화</span>
            </label>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              {editingType ? '수정하기' : '타입 생성'}
            </button>
            {editingType && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                취소
              </button>
            )}
          </div>
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

      {/* 카테고리 타입 목록 */}
      <div className="bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold p-6 border-b">카테고리 타입 목록</h2>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">타입 이름</th>
                  <th className="px-4 py-2 text-left">타입 코드</th>
                  <th className="px-4 py-2 text-left">설명</th>
                  <th className="px-4 py-2 text-center">순서</th>
                  <th className="px-4 py-2 text-center">상태</th>
                  <th className="px-4 py-2 text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                {categoryTypes.map((type) => (
                  <tr key={type.id} className="border-t">
                    <td className="px-4 py-2">{type.type_name}</td>
                    <td className="px-4 py-2">{type.type_code}</td>
                    <td className="px-4 py-2">{type.description}</td>
                    <td className="px-4 py-2 text-center">{type.order_sequence}</td>
                    <td className="px-4 py-2 text-center">
                      {type.is_active ? '활성' : '비활성'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </div>
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

export default CategoryTypeManagementPage; 