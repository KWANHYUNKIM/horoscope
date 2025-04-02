import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import communityReducer from './reducers/communityReducer';
import authReducer from './reducers/authReducer';

const rootReducer = combineReducers({
  community: communityReducer,
  auth: authReducer
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store; 