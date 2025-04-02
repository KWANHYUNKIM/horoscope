import axios from 'axios';

export const getBoards = (categoryId = null, page = 1) => async (dispatch) => {
  try {
    const url = categoryId 
      ? `http://localhost:3001/api/boards/category/${categoryId}?page=${page}`
      : `http://localhost:3001/api/boards?page=${page}`;
    
    console.log('Fetching boards from:', url);
    const response = await axios.get(url, { withCredentials: true });
    console.log('Server response:', response.data);
    
    if (!response.data || !Array.isArray(response.data.boards)) {
      console.error('Invalid response format:', response.data);
      throw new Error('Invalid response format');
    }

    const payload = {
      boards: response.data.boards || [],
      totalPages: response.data.totalPages || 1,
      currentPage: response.data.currentPage || 1
    };
    console.log('Dispatching payload:', payload);

    dispatch({
      type: 'SET_BOARDS',
      payload
    });
  } catch (error) {
    console.error('게시글 목록 조회 실패:', error);
    dispatch({
      type: 'SET_BOARDS',
      payload: {
        boards: [],
        totalPages: 1,
        currentPage: 1
      }
    });
    dispatch({
      type: 'SET_ERROR',
      payload: '게시글 목록을 불러오는데 실패했습니다.'
    });
  }
};

export const getCategories = () => async (dispatch) => {
  try {
    console.log('Fetching categories');
    const response = await axios.get('http://localhost:3001/api/boards/categories', { withCredentials: true });
    console.log('Categories response:', response.data);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid categories format:', response.data);
      throw new Error('Invalid response format');
    }

    dispatch({
      type: 'SET_CATEGORIES',
      payload: response.data
    });
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error);
    dispatch({
      type: 'SET_CATEGORIES',
      payload: []
    });
    dispatch({
      type: 'SET_ERROR',
      payload: '카테고리 목록을 불러오는데 실패했습니다.'
    });
  }
}; 