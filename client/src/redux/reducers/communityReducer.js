const initialState = {
  boards: [],
  categories: [],
  totalPages: 1,
  currentPage: 1,
  error: null
};

const communityReducer = (state = initialState, action) => {

  switch (action.type) {
    case 'SET_BOARDS':
      const newBoards = Array.isArray(action.payload.boards) ? action.payload.boards : [];
      
      return {
        ...state,
        boards: newBoards,
        totalPages: Number(action.payload.totalPages) || 1,
        currentPage: Number(action.payload.currentPage) || 1,
        error: null
      };
    case 'SET_CATEGORIES':
      const newCategories = Array.isArray(action.payload) ? action.payload : [];
      
      return {
        ...state,
        categories: newCategories,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
};

export default communityReducer; 