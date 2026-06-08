import { SONG_MODELS, type MusicModel } from "../types.ts";

interface ModelSelectorProps {
  value: MusicModel;
  onChange: (model: MusicModel) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  return (
    <label className="field">
      <span className="field-label">Model</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MusicModel)}
        disabled={disabled}
      >
        {SONG_MODELS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  );
}
