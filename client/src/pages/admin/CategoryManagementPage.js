import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const CategoryManagementPage = () => {
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]);
  const [loading, setLoading] = useState({
    types: true,
    categories: false
  });
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    category_name: '',
    description: '',
    parent_id: null,
    order_sequence: 0
  });

  // 카테고리 타입 로딩
  useEffect(() => {
    const loadCategoryTypes = async () => {
      try {
        setLoading(prev => ({ ...prev, types: true }));
        const response = await api.get('/api/boards/category-types');
        const types = response.data.filter(type => type.type_code === 'REGION'); // 지역 타입만 필터링
        setCategoryTypes(types);
        
        // 지역 타입 자동 선택
        if (types.length > 0) {
          setSelectedType(types[0].id);
        }
        
        setLoading(prev => ({ ...prev, types: false }));
      } catch (error) {
        console.error('카테고리 타입 로딩 오류:', error);
        setError('카테고리 타입을 불러오는데 실패했습니다.');
        setLoading(prev => ({ ...prev, types: false }));
      }
    };

    loadCategoryTypes();
  }, []);

  // 선택된 타입의 카테고리 로딩
  useEffect(() => {
    const loadCategories = async () => {
      if (!selectedType) return;

      try {
        setLoading(prev => ({ ...prev, categories: true }));
        const response = await api.get('/api/boards/categories', {
          params: { 
            type: selectedType,
            parent_id: selectedCategory?.id || null
          }
        });
        setCategories(response.data);
        setLoading(prev => ({ ...prev, categories: false }));
      } catch (error) {
        console.error('카테고리 로딩 오류:', error);
        setError('카테고리를 불러오는데 실패했습니다.');
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    loadCategories();
  }, [selectedType, selectedCategory]);

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setSelectedCategory(null);
    setCategoryPath([]);
    setEditingCategory(null);
    setNewCategory({
      category_name: '',
      description: '',
      parent_id: null,
      order_sequence: 0
    });
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    // 카테고리 경로 업데이트
    const path = [];
    let current = category;
    while (current) {
      path.unshift(current);
      current = categories.find(cat => cat.id === current.parent_id);
    }
    setCategoryPath(path);

    // 하위 카테고리 로드
    try {
      setLoading(prev => ({ ...prev, categories: true }));
      
      // 현재 카테고리의 타입에 따라 다음 타입 결정
      let nextTypeId = null;
      const currentType = categoryTypes.find(type => type.id === category.category_type_id);
      
      if (currentType?.type_code === 'REGION' && !category.parent_id) {
        // 최상위 지역 선택 후: 같은 지역 타입의 하위 카테고리 (구/시/군)
        nextTypeId = currentType.id;
      } else if (currentType?.type_code === 'REGION' && category.parent_id) {
        // 구/시/군 선택 후: 병원 종류
        const hospitalType = categoryTypes.find(type => type.type_code === 'HOSPITAL_TYPE');
        nextTypeId = hospitalType?.id;
        if (hospitalType) {
          setSelectedType(hospitalType.id); // 병원 종류 타입으로 변경
        }
      } else if (currentType?.type_code === 'HOSPITAL_TYPE') {
        // 병원 종류 선택 후: 진료과
        const departmentType = categoryTypes.find(type => type.type_code === 'DEPARTMENT');
        nextTypeId = departmentType?.id;
        if (departmentType) {
          setSelectedType(departmentType.id); // 진료과 타입으로 변경
        }
      }

      // 카테고리 타입 목록 다시 로드
      const typesResponse = await api.get('/api/boards/category-types');
      const allTypes = typesResponse.data;
      setCategoryTypes(allTypes);

      const response = await api.get('/api/boards/categories', {
        params: { 
          type: nextTypeId,
          parent_id: category.id
        }
      });
      setCategories(response.data);
      setLoading(prev => ({ ...prev, categories: false }));
    } catch (error) {
      console.error('하위 카테고리 로딩 오류:', error);
      setError('하위 카테고리를 불러오는데 실패했습니다.');
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCategories(items);

    try {
      await api.put(`/api/boards/categories/${reorderedItem.id}/order`, {
        order_sequence: result.destination.index
      });
    } catch (error) {
      console.error('순서 업데이트 오류:', error);
      setError('순서 업데이트에 실패했습니다.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/boards/categories', {
        ...newCategory,
        category_type_id: selectedType,
        parent_id: selectedCategory?.id || null
      });
      setCategories([...categories, response.data]);
      setNewCategory({
        category_name: '',
        description: '',
        parent_id: null,
        order_sequence: 0
      });
    } catch (error) {
      console.error('카테고리 추가 오류:', error);
      setError('카테고리 추가에 실패했습니다.');
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/api/boards/categories/${editingCategory.id}`, editingCategory);
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? response.data : cat
      ));
      setEditingCategory(null);
    } catch (error) {
      console.error('카테고리 수정 오류:', error);
      setError('카테고리 수정에 실패했습니다.');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('이 카테고리를 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/api/boards/categories/${categoryId}`);
      setCategories(categories.filter(cat => cat.id !== categoryId));
      if (selectedCategory?.id === categoryId) {
        setSelectedCategory(null);
        setCategoryPath([]);
      }
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      setError('카테고리 삭제에 실패했습니다.');
    }
  };

  const renderCategory = (category) => {
    const hasChildren = categories.some(cat => cat.parent_id === category.id);
    const isSelected = selectedCategory?.id === category.id;

    return (
      <div
        key={category.id}
        className={`p-2 rounded-md cursor-pointer ${
          isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
        }`}
        onClick={() => handleCategorySelect(category)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>{hasChildren ? '▼' : '▶'}</span>
            <span>{category.category_name}</span>
            <span className="text-sm text-gray-500">{category.description}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingCategory(category);
              }}
              className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              수정
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCategory(category.id);
              }}
              className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading.types) return <div className="p-4">카테고리 타입을 불러오는 중...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">카테고리 관리</h1>
      
      {/* 카테고리 타입 선택 버튼 숨기기 */}
      
      {selectedType && (
        <>
          {/* 현재 선택된 카테고리 경로 */}
          {categoryPath.length > 0 && (
            <div className="mb-4 flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryPath([]);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                전체
              </button>
              {categoryPath.map((category, index) => (
                <React.Fragment key={category.id}>
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => handleCategorySelect(category)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {category.category_name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* 카테고리 추가 폼 */}
          <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">
              {selectedCategory ? `${selectedCategory.category_name} 하위 카테고리 추가` : '새 카테고리 추가'}
            </h2>
            <form onSubmit={handleAddCategory} className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">카테고리 이름</label>
                <input
                  type="text"
                  value={newCategory.category_name}
                  onChange={(e) => setNewCategory({ ...newCategory, category_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">설명</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                추가
              </button>
            </form>
          </div>

          {/* 카테고리 목록 */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-2">
              {selectedCategory ? `${selectedCategory.category_name} 하위 카테고리` : '카테고리 목록'}
            </h2>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {categories
                      .filter(category => {
                        if (!selectedCategory) {
                          return !category.parent_id; // 최상위 카테고리만 표시
                        }
                        return category.parent_id === selectedCategory.id; // 선택된 카테고리의 하위 카테고리만 표시
                      })
                      .map((category, index) => (
                        <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {renderCategory(category)}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* 카테고리 수정 모달 */}
          {editingCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-4 rounded-lg shadow-lg w-96">
                <h2 className="text-lg font-semibold mb-2">카테고리 수정</h2>
                <form onSubmit={handleUpdateCategory} className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">카테고리 이름</label>
                    <input
                      type="text"
                      value={editingCategory.category_name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, category_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">설명</label>
                    <input
                      type="text"
                      value={editingCategory.description}
                      onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      저장
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryManagementPage; 