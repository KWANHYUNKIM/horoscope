const initialState = {
  isLoggedIn: false,
  userRole: null,
  userId: null,
  error: null
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_AUTH':
      return {
        ...state,
        isLoggedIn: action.payload.isLoggedIn,
        userRole: action.payload.userRole,
        userId: action.payload.userId,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...initialState
      };
    default:
      return state;
  }
};

export default authReducer; 