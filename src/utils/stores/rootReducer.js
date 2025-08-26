import { combineReducers } from '@reduxjs/toolkit';
import sessionReducer from './sessionSlice';

const rootReducer = combineReducers({
  session: sessionReducer,
});

export default rootReducer;
