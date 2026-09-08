import { SkinPicker } from './SkinPicker';
import { useAppState } from '../useAppState';
import type { SkinId } from '../skins/ids';
import './Settings.css';

/**
 * Display preferences: skin, units, and the labor panel toggle.
 *
 * Lifted out of the old About screen when Setup and About merged. It is a
 * component rather than inline markup so that Setup reads as its four sections
 * — date, share, display, about — rather than as four hundred lines.
 */
export function SettingsPanel() {
  const { settings, updateSettings } = useAppState();

  return (
    <section className="section" aria-labelledby="display-heading">
      <h2 id="display-heading">Display</h2>

      <SkinPicker
        value={settings.skin}
        onChange={(skin: SkinId) => {
          updateSettings({ skin });
        }}
      />

      <div className="toggle">
        <span className="field__head" id="units-label">
          Units
        </span>
        <div className="segmented" role="group" aria-labelledby="units-label">
          <button
            type="button"
            aria-pressed={settings.units === 'imperial'}
            onClick={() => {
              updateSettings({ units: 'imperial' });
            }}
          >
            in / oz
          </button>
          <button
            type="button"
            aria-pressed={settings.units === 'metric'}
            onClick={() => {
              updateSettings({ units: 'metric' });
            }}
          >
            cm / g
          </button>
        </div>
      </div>

      <label className="toggle toggle--check">
        <input
          type="checkbox"
          checked={settings.laborPanelEnabled}
          onChange={(event) => {
            updateSettings({ laborPanelEnabled: event.target.checked });
          }}
        />
        <span>Show the labor chances panel from 34 weeks</span>
      </label>
    </section>
  );
}
