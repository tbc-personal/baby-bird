import { createContext } from 'react';
import type { DatingMethod, IsoDate } from './lib/gestation';
import type { SavedState, Settings } from './lib/storage';

export interface AppState {
  readonly saved: SavedState | null;
  readonly settings: Settings;
  readonly save: (method: DatingMethod, inputDate: IsoDate, cycleLength: number) => void;
  readonly updateSettings: (patch: Partial<Settings>) => void;
  readonly forget: () => void;
}

export const AppStateContext = createContext<AppState | null>(null);
