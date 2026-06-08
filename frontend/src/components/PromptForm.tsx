import type { GenerateRequest } from "../types.ts";

interface PromptFormProps {
  values: Omit<GenerateRequest, "model">;
  onChange: (values: Omit<GenerateRequest, "model">) => void;
  onSubmit: () => void;
  loading: boolean;
}

function validate(values: Omit<GenerateRequest, "model">): string | null {
  if (values.isInstrumental) {
    if (!values.prompt.trim()) return "Style prompt is required for instrumental";
  } else if (!values.lyricsOptimizer && !values.lyrics?.trim()) {
    return "Lyrics are required unless auto-generate is enabled";
  }

  return null;
}

export function PromptForm({ values, onChange, onSubmit, loading }: PromptFormProps) {
  const validationError = validate(values);

  const update = (patch: Partial<Omit<GenerateRequest, "model">>) => {
    onChange({ ...values, ...patch });
  };

  const setInstrumental = (checked: boolean) => {
    update({
      isInstrumental: checked,
      ...(checked ? { lyrics: "", lyricsOptimizer: false } : {}),
    });
  };

  const setLyricsOptimizer = (checked: boolean) => {
    update({
      lyricsOptimizer: checked,
      ...(checked ? { lyrics: "" } : {}),
    });
  };

  const setLyrics = (lyrics: string) => {
    update({
      lyrics,
      ...(lyrics.length > 0 ? { lyricsOptimizer: false } : {}),
    });
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
          placeholder="Pop, melancholic, perfect for a rainy night"
          rows={3}
        />
      </label>

      {!values.isInstrumental && (
        <label className="field">
          <span className="field-label">Lyrics</span>
          <textarea
            value={values.lyricsOptimizer ? "" : (values.lyrics ?? "")}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder={
              values.lyricsOptimizer
                ? "Lyrics will be generated from your style prompt"
                : "[Verse]\nYour lyrics here..."
            }
            rows={8}
            readOnly={values.lyricsOptimizer}
            className={values.lyricsOptimizer ? "readonly" : undefined}
          />
        </label>
      )}

      <div className="checkbox-row">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={values.isInstrumental}
            onChange={(e) => setInstrumental(e.target.checked)}
          />
          Instrumental
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={values.lyricsOptimizer}
            onChange={(e) => setLyricsOptimizer(e.target.checked)}
            disabled={values.isInstrumental}
          />
          Auto-generate lyrics
        </label>
      </div>

      {validationError && <p className="validation-error">{validationError}</p>}

      <button type="submit" className="generate-btn" disabled={loading || !!validationError}>
        {loading ? "Generating…" : "Generate"}
      </button>
    </form>
  );
}
