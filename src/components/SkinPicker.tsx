import { SKIN_LIST } from '../skins';
import type { SkinId } from '../skins/ids';
import './SkinPicker.css';

/**
 * The skin picker (ADR-007). A radio group, so arrow keys move between skins
 * and the choice is announced as one control rather than seven buttons. Each
 * swatch shows the skin's five named colors in the ADR's order.
 */
export function SkinPicker({
  value,
  onChange,
}: {
  value: SkinId;
  onChange: (id: SkinId) => void;
}) {
  return (
    <fieldset className="skins">
      <legend className="field__head">Skin</legend>
      <div className="skins__grid">
        {SKIN_LIST.map((skin) => (
          <label
            key={skin.id}
            className={skin.id === value ? 'skin skin--on' : 'skin'}
            style={{ background: skin.light.ground, color: skin.light.ink }}
          >
            <input
              type="radio"
              name="skin"
              value={skin.id}
              checked={skin.id === value}
              onChange={() => {
                onChange(skin.id);
              }}
            />
            <span className="skin__name">{skin.label}</span>
            <span className="skin__bird">{skin.bird}</span>
            <span className="skin__chips" aria-hidden="true">
              {[
                skin.light.ground,
                skin.light.ink,
                skin.light.accent,
                skin.light.secondary,
                skin.light.highlight,
              ].map((color, index) => (
                <i key={index} style={{ background: color }} />
              ))}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
