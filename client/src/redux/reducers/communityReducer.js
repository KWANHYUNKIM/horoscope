const initialState = {
  boards: [],
  categories: [],
  totalPages: 1,
  currentPage: 1,
  error: null
};

const communityReducer = (state = initialState, action) => {
  console.log('Reducer received action:', action.type, action.payload);

  switch (action.type) {
    case 'SET_BOARDS':
      console.log('Setting boards with payload:', action.payload);
      const newBoards = Array.isArray(action.payload.boards) ? action.payload.boards : [];
      console.log('Processed boards:', newBoards);
      
      return {
        ...state,
        boards: newBoards,
        totalPages: Number(action.payload.totalPages) || 1,
        currentPage: Number(action.payload.currentPage) || 1,
        error: null
      };
    case 'SET_CATEGORIES':
      console.log('Setting categories with payload:', action.payload);
      const newCategories = Array.isArray(action.payload) ? action.payload : [];
      console.log('Processed categories:', newCategories);
      
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