import type { CoverFormState } from "../lib/cover.ts";
import type { CoverWorkflow } from "../types.ts";

interface CoverFormProps {
  values: CoverFormState;
  onChange: (values: CoverFormState) => void;
  onPreprocess: () => void;
  onSubmit: () => void;
  loading: boolean;
  preprocessing: boolean;
}

function validate(values: CoverFormState): string | null {
  if (!values.prompt.trim() || values.prompt.length < 10) {
    return "Style prompt must be at least 10 characters";
  }
  if (values.prompt.length > 300) {
    return "Style prompt must be at most 300 characters";
  }

  if (!values.audioFile && !values.audioUrl.trim()) {
    return "Reference audio file or URL is required";
  }

  if (values.workflow === "advanced") {
    if (!values.lyrics.trim() || values.lyrics.length < 10) {
      return "Lyrics must be at least 10 characters";
    }
    if (values.lyrics.length > 1000) {
      return "Lyrics must be at most 1000 characters";
    }
  }

  return null;
}

export function CoverForm({
  values,
  onChange,
  onPreprocess,
  onSubmit,
  loading,
  preprocessing,
}: CoverFormProps) {
  const validationError = validate(values);
  const canPreprocess =
    values.workflow === "advanced" &&
    (Boolean(values.audioFile) || Boolean(values.audioUrl.trim())) &&
    !preprocessing &&
    !loading;

  const update = (patch: Partial<CoverFormState>) => {
    onChange({ ...values, ...patch });
  };

  const setWorkflow = (workflow: CoverWorkflow) => {
    onChange({
      ...values,
      workflow,
      coverFeatureId: "",
      lyrics: workflow === "quick" ? "" : values.lyrics,
    });
  };

  const handleFileChange = (file: File | null) => {
    update({
      audioFile: file,
      audioUrl: file ? "" : values.audioUrl,
      coverFeatureId: "",
    });
  };

  return (
    <form
      className="prompt-form cover-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!validationError) onSubmit();
      }}
    >
      <div className="workflow-toggle" role="group" aria-label="Cover workflow">
        <button
          type="button"
          className={`workflow-btn ${values.workflow === "quick" ? "active" : ""}`}
          onClick={() => setWorkflow("quick")}
          disabled={loading || preprocessing}
        >
          Quick cover
        </button>
        <button
          type="button"
          className={`workflow-btn ${values.workflow === "advanced" ? "active" : ""}`}
          onClick={() => setWorkflow("advanced")}
          disabled={loading || preprocessing}
        >
          Edit lyrics
        </button>
      </div>

      <label className="field">
        <span className="field-label">Reference audio</span>
        <input
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.m4a"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          disabled={loading || preprocessing}
          className="file-input"
        />
        {values.audioFile && (
          <p className="field-hint file-name">{values.audioFile.name}</p>
        )}
        <span className="field-divider">or</span>
        <input
          type="url"
          value={values.audioUrl}
          onChange={(e) =>
            update({ audioUrl: e.target.value, audioFile: null, coverFeatureId: "" })
          }
          placeholder="https://example.com/original-song.mp3"
          disabled={loading || preprocessing || Boolean(values.audioFile)}
        />
        <p className="field-hint">6 seconds to 6 minutes, max 50 MB. MP3, WAV, FLAC, etc.</p>
      </label>

      <label className="field">
        <span className="field-label">Cover style</span>
        <textarea
          value={values.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder="Jazz, smooth, late night lounge, saxophone"
          rows={3}
          disabled={loading || preprocessing}
        />
      </label>

      {values.workflow === "advanced" && (
        <div className="cover-advanced-section">
          <label className="field">
            <span className="field-label">Lyrics</span>
            <textarea
              value={values.lyrics}
              onChange={(e) => update({ lyrics: e.target.value })}
              placeholder="[Verse]\nType or paste your lyrics here…"
              rows={10}
              disabled={loading || preprocessing}
            />
            <p className="field-hint">
              10–1000 characters. Type your own lyrics, or use the button below to pre-fill from
              the reference track.
            </p>
          </label>
          <button
            type="button"
            className="secondary-btn"
            onClick={onPreprocess}
            disabled={!canPreprocess}
          >
            {preprocessing ? "Extracting lyrics…" : "Extract lyrics from audio"}
          </button>
        </div>
      )}

      {validationError && <p className="validation-error">{validationError}</p>}

      <button
        type="submit"
        className="generate-btn"
        disabled={loading || preprocessing || !!validationError}
      >
        {loading ? "Generating cover…" : "Generate cover"}
      </button>
    </form>
  );
}
