/**
 * ADR-006: privacy and persistence.
 *
 * All state is two values plus display settings, kept in localStorage under a
 * versioned key. No cookies, no analytics, no network. Reading and writing are
 * both defensive: a browser with storage disabled, or a key written by a future
 * version, degrades to "no saved date" rather than throwing.
 *
 * This module is pure with respect to the clock; it never calls `new Date()`.
 */
import {
  clampCycleLength,
  DEFAULT_CYCLE_DAYS,
  dueDateFrom,
  formatIsoDate,
  isDatingMethod,
  parseIsoDate,
  toLmpEquivalent,
  type Dating,
  type DatingMethod,
  type IsoDate,
} from './gestation';
import { SKIN_IDS, type SkinId } from '../skins/ids';

export const STORAGE_KEY = 'nestling.v1';
export const STATE_VERSION = 2;
/** Versions `parseSavedState` can still read. v1 predates the cycle-length field. */
const READABLE_VERSIONS: readonly number[] = [1, STATE_VERSION];

export type Units = 'imperial' | 'metric';

export interface Settings {
  readonly units: Units;
  readonly laborPanelEnabled: boolean;
  readonly skin: SkinId;
}

export interface SavedState {
  readonly version: typeof STATE_VERSION;
  readonly method: DatingMethod;
  readonly inputDate: IsoDate;
  /**
   * Typical cycle length in days; only meaningful in `lmp` mode, but stored
   * unconditionally so switching methods and switching back is lossless.
   */
  readonly cycleLength: number;
  readonly settings: Settings;
}

/** The saved record as the date math wants it. Throws nothing; the caller has already parsed. */
export function datingFrom(saved: SavedState, inputDate: Date): Dating {
  return { method: saved.method, inputDate, cycleLength: saved.cycleLength };
}

export const DEFAULT_SETTINGS: Settings = {
  units: 'imperial',
  laborPanelEnabled: true,
  skin: 'puffin',
};

function isSkinId(value: unknown): value is SkinId {
  return typeof value === 'string' && (SKIN_IDS as readonly string[]).includes(value);
}

function readSettings(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS;
  const raw = value as Record<string, unknown>;
  return {
    units: raw.units === 'metric' ? 'metric' : 'imperial',
    laborPanelEnabled: raw.laborPanelEnabled !== false,
    skin: isSkinId(raw.skin) ? raw.skin : DEFAULT_SETTINGS.skin,
  };
}

/**
 * Parse whatever is in storage. Anything unrecognized yields null, which the app
 * treats as "no saved date" and shows Setup.
 */
export function parseSavedState(json: string | null): SavedState | null {
  if (!json) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.version !== 'number' || !READABLE_VERSIONS.includes(record.version)) {
    return null;
  }
  if (!isDatingMethod(record.method)) return null;
  if (typeof record.inputDate !== 'string' || !parseIsoDate(record.inputDate)) return null;
  return {
    version: STATE_VERSION,
    method: record.method,
    inputDate: record.inputDate,
    // A v1 record was written when every cycle was assumed to be 28 days, so
    // defaulting to 28 reproduces exactly the due date that record already
    // showed. Upgrading must never move someone's due date under them.
    cycleLength:
      typeof record.cycleLength === 'number'
        ? clampCycleLength(record.cycleLength)
        : DEFAULT_CYCLE_DAYS,
    settings: readSettings(record.settings),
  };
}

/** A storage implementation that can be swapped in tests. */
export interface StateStore {
  read(): SavedState | null;
  write(state: SavedState): void;
  clear(): void;
}

function safeLocalStorage(): Storage | null {
  try {
    const probe = '__nestling_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    // Private mode, disabled storage, or a sandboxed frame. The app still runs;
    // the date just does not survive a reload.
    return null;
  }
}

export function createLocalStore(): StateStore {
  const storage = safeLocalStorage();
  return {
    read: () => (storage ? parseSavedState(storage.getItem(STORAGE_KEY)) : null),
    write: (state) => {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* quota or disabled storage; nothing to do but carry on */
      }
    },
    clear: () => {
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    },
  };
}

// --- share links (ADR-006) -------------------------------------------------

export interface SharedDate {
  readonly method: DatingMethod;
  readonly inputDate: IsoDate;
}

/**
 * Read `?m=lmp&d=2026-03-29`. Accepts the params from either the document
 * search string or the part after `?` inside the hash, since a hash-routed app
 * can receive them in either place.
 */
export function parseShareParams(search: string): SharedDate | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const method = params.get('m');
  const inputDate = params.get('d');
  if (!isDatingMethod(method)) return null;
  if (!inputDate || !parseIsoDate(inputDate)) return null;
  return { method, inputDate };
}

/**
 * Pull share params out of a full URL, checking the query string first and then
 * a query embedded in the hash (`#/?m=…` or `#/setup?m=…`).
 */
export function shareParamsFromUrl(url: string): SharedDate | null {
  const questionMark = url.indexOf('?');
  if (questionMark === -1) return null;
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1 || questionMark < hashIndex) {
    const end = hashIndex === -1 ? url.length : hashIndex;
    const fromSearch = parseShareParams(url.slice(questionMark, end));
    if (fromSearch) return fromSearch;
  }
  const inHash = url.indexOf('?', hashIndex === -1 ? url.length : hashIndex);
  if (inHash === -1) return null;
  return parseShareParams(url.slice(inHash));
}

/**
 * Build the link Setup copies. Always emitted in due-date mode, whatever the
 * sender counts from.
 *
 * Once cycle length exists, an `?m=lmp&d=…` link is ambiguous: the recipient's
 * app would apply its own cycle length to the sender's period date and land on
 * a different due date. Sending the derived due date instead is unambiguous and
 * shares strictly less — the recipient learns the due date and nothing about
 * the sender's period date or cycle, which is the direction ADR-006 pushes.
 *
 * Links written by older versions still parse: `parseShareParams` accepts any
 * method, and an `lmp` link predates cycle length, so reading it with the
 * default 28 reproduces the sender's due date.
 */
export function buildShareLink(origin: string, dating: Dating): string {
  const base = origin.split('#')[0]?.split('?')[0] ?? origin;
  const dueDate = dueDateFrom(toLmpEquivalent(dating));
  const params = new URLSearchParams({ m: 'dueDate', d: formatIsoDate(dueDate) });
  return `${base}?${params.toString()}`;
}

/** True when review affordances (the "draft" fact chip) should show (ADR-004). */
export function isReviewMode(url: string, isDev: boolean): boolean {
  if (isDev) return true;
  return /[?&]review=1(?:&|$)/.test(url);
}
