import axios from 'axios';

export const getBoards = (categoryId = null, page = 1) => async (dispatch) => {
  try {
    const url = categoryId 
      ? `http://localhost:3001/api/boards/category/${categoryId}?page=${page}`
      : `http://localhost:3001/api/boards?page=${page}`;
    
    const response = await axios.get(url, { withCredentials: true });
    
    if (!response.data || !Array.isArray(response.data.boards)) {
      throw new Error('Invalid response format');
    }

    const payload = {
      boards: response.data.boards || [],
      totalPages: response.data.totalPages || 1,
      currentPage: response.data.currentPage || 1
    };
    
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
    const response = await axios.get('http://localhost:3001/api/boards/categories', { withCredentials: true });
    
    if (!response.data || !Array.isArray(response.data)) {
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