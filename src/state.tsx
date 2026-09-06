/**
 * The whole application state: one date, one method, three settings (ADR-006).
 * Everything else on every screen is derived. The store is created once and
 * kept in a context so screens do not each re-read localStorage.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  createLocalStore,
  DEFAULT_SETTINGS,
  STATE_VERSION,
  type SavedState,
  type Settings,
} from './lib/storage';
import type { DatingMethod, IsoDate } from './lib/gestation';
import { AppStateContext, type AppState } from './stateContext';

export function AppStateProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createLocalStore(), []);
  const [saved, setSaved] = useState<SavedState | null>(() => store.read());
  // Settings persist even with no date saved, so the skin survives a "forget".
  const [settings, setSettings] = useState<Settings>(
    () => store.read()?.settings ?? DEFAULT_SETTINGS,
  );

  const save = useCallback(
    (method: DatingMethod, inputDate: IsoDate) => {
      setSaved((previous) => {
        const next: SavedState = {
          version: STATE_VERSION,
          method,
          inputDate,
          settings: previous?.settings ?? settings,
        };
        store.write(next);
        return next;
      });
    },
    [store, settings],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((previous) => {
        const next = { ...previous, ...patch };
        setSaved((current) => {
          if (!current) return current;
          const updated = { ...current, settings: next };
          store.write(updated);
          return updated;
        });
        return next;
      });
    },
    [store],
  );

  const forget = useCallback(() => {
    store.clear();
    setSaved(null);
    setSettings(DEFAULT_SETTINGS);
  }, [store]);

  const value = useMemo<AppState>(
    () => ({ saved, settings, save, updateSettings, forget }),
    [saved, settings, save, updateSettings, forget],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
