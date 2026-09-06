import { useContext } from 'react';
import { AppStateContext, type AppState } from './stateContext';

export function useAppState(): AppState {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
