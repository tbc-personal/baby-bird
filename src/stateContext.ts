import { createContext } from 'react';
import type { DatingMethod, IsoDate } from './lib/gestation';
import type { SavedState, Settings } from './lib/storage';

export interface AppState {
  readonly saved: SavedState | null;
  readonly settings: Settings;
  save(method: DatingMethod, inputDate: IsoDate): void;
  updateSettings(patch: Partial<Settings>): void;
  forget(): void;
}

export const AppStateContext = createContext<AppState | null>(null);
