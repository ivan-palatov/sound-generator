import { COVER_MODELS, type GenerateRequest, type MusicModel } from "../types.ts";

interface PromptFormProps {
  model: MusicModel;
  values: Omit<GenerateRequest, "model">;
  onChange: (values: Omit<GenerateRequest, "model">) => void;
  onSubmit: () => void;
  loading: boolean;
}

function validate(values: Omit<GenerateRequest, "model">, model: MusicModel): string | null {
  if (COVER_MODELS.has(model)) {
    if (!values.audioUrl?.trim()) return "Reference audio URL is required";
    if (!values.prompt.trim() || values.prompt.length < 10) {
      return "Style prompt must be at least 10 characters";
    }
    return null;
  }

  if (values.isInstrumental) {
    if (!values.prompt.trim()) return "Style prompt is required for instrumental";
  } else if (!values.lyricsOptimizer && !values.lyrics?.trim()) {
    return "Lyrics are required unless auto-generate is enabled";
  }

  return null;
}

export function PromptForm({ model, values, onChange, onSubmit, loading }: PromptFormProps) {
  const isCover = COVER_MODELS.has(model);
  const validationError = validate(values, model);

  const update = (patch: Partial<Omit<GenerateRequest, "model">>) => {
    onChange({ ...values, ...patch });
  };

  return (
    <form
      className="prompt-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!validationError) onSubmit();
      }}
    >
      <label className="field">
        <span className="field-label">Style prompt</span>
        <textarea
          value={values.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder={
            isCover
              ? "Jazz, smooth, late night lounge, saxophone"
              : "Pop, melancholic, perfect for a rainy night"
          }
          rows={3}
          disabled={loading}
        />
      </label>

      {!isCover && (
        <>
          <label className="field">
            <span className="field-label">Lyrics</span>
            <textarea
              value={values.lyrics ?? ""}
              onChange={(e) => update({ lyrics: e.target.value })}
              placeholder={"[Verse]\nYour lyrics here..."}
              rows={8}
              disabled={loading || values.isInstrumental || values.lyricsOptimizer}
            />
          </label>

          <div className="checkbox-row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={values.isInstrumental}
                onChange={(e) => update({ isInstrumental: e.target.checked })}
                disabled={loading}
              />
              Instrumental
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={values.lyricsOptimizer}
                onChange={(e) => update({ lyricsOptimizer: e.target.checked })}
                disabled={loading || values.isInstrumental}
              />
              Auto-generate lyrics
            </label>
          </div>
        </>
      )}

      {isCover && (
        <label className="field">
          <span className="field-label">Reference audio URL</span>
          <input
            type="url"
            value={values.audioUrl ?? ""}
            onChange={(e) => update({ audioUrl: e.target.value })}
            placeholder="https://example.com/original-song.mp3"
            disabled={loading}
          />
        </label>
      )}

      {validationError && <p className="validation-error">{validationError}</p>}

      <button type="submit" className="generate-btn" disabled={loading || !!validationError}>
        {loading ? "Generating…" : "Generate"}
      </button>
    </form>
  );
}
