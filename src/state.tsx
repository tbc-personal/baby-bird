/**
 * The whole application state: one date, one method, three settings (ADR-006).
 * Everything else on every screen is derived.
 *
 * `saved` and `settings` are held in one state object rather than two. They
 * have to move together — writing settings has to update the persisted record —
 * and splitting them meant one updater calling another, which React does not
 * run reliably.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  createLocalStore,
  DEFAULT_SETTINGS,
  STATE_VERSION,
  type SavedState,
  type Settings,
} from './lib/storage';
import { clampCycleLength, type DatingMethod, type IsoDate } from './lib/gestation';
import { AppStateContext, type AppState } from './stateContext';

interface Model {
  readonly saved: SavedState | null;
  /** Kept separately so a skin choice survives "Forget my data" until reload. */
  readonly settings: Settings;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createLocalStore(), []);
  const [model, setModel] = useState<Model>(() => {
    const saved = store.read();
    return { saved, settings: saved?.settings ?? DEFAULT_SETTINGS };
  });

  const save = useCallback(
    (method: DatingMethod, inputDate: IsoDate, cycleLength: number) => {
      setModel((previous) => {
        const next: SavedState = {
          version: STATE_VERSION,
          method,
          inputDate,
          cycleLength: clampCycleLength(cycleLength),
          settings: previous.settings,
        };
        store.write(next);
        return { saved: next, settings: previous.settings };
      });
    },
    [store],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setModel((previous) => {
        const settings = { ...previous.settings, ...patch };
        const saved = previous.saved ? { ...previous.saved, settings } : null;
        if (saved) store.write(saved);
        return { saved, settings };
      });
    },
    [store],
  );

  const forget = useCallback(() => {
    store.clear();
    setModel({ saved: null, settings: DEFAULT_SETTINGS });
  }, [store]);

  const value = useMemo<AppState>(
    () => ({
      saved: model.saved,
      settings: model.settings,
      save,
      updateSettings,
      forget,
    }),
    [model, save, updateSettings, forget],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
