import { combineReducers } from 'redux';

// Import feature reducers and state interfaces.
// import { ReadAlongState } from './components/read-along-component/reducers';

// This interface represents app state by nesting feature states.
export interface RootState {
//   todos: ReadAlongState;
}

// Combine feature reducers into a single root reducer
export const rootReducer = combineReducers({
//   todos,
});