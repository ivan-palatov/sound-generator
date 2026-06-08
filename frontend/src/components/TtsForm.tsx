import type { TtsFormState } from "../lib/tts.ts";

const MAX_TEXT_LENGTH = 1000;

interface TtsFormProps {
  values: TtsFormState;
  onChange: (values: TtsFormState) => void;
  onSubmit: () => void;
  loading: boolean;
}

function validate(values: TtsFormState): string | null {
  const text = values.text.trim();
  if (!text) return "Speech text is required";
  if (text.length > MAX_TEXT_LENGTH) {
    return `Speech text must be at most ${MAX_TEXT_LENGTH} characters`;
  }

  if (!values.audioFile && !values.audioUrl.trim()) {
    return "Voice sample file or URL is required";
  }

  return null;
}

export function TtsForm({ values, onChange, onSubmit, loading }: TtsFormProps) {
  const validationError = validate(values);
  const textLength = values.text.length;

  const update = (patch: Partial<TtsFormState>) => {
    onChange({ ...values, ...patch });
  };

  const handleFileChange = (file: File | null) => {
    update({
      audioFile: file,
      audioUrl: file ? "" : values.audioUrl,
    });
  };

  return (
    <form
      className="prompt-form tts-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!validationError) onSubmit();
      }}
    >
      <label className="field">
        <span className="field-label">Speech text</span>
        <textarea
          value={values.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Enter the text you want spoken in the cloned voice…"
          rows={8}
          disabled={loading}
          maxLength={MAX_TEXT_LENGTH}
        />
        <p className="field-hint">
          {textLength}/{MAX_TEXT_LENGTH} characters. Up to 1000 characters per generation.
        </p>
      </label>

      <label className="field">
        <span className="field-label">Voice sample</span>
        <input
          type="file"
          accept="audio/*,.mp3,.wav,.m4a"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          disabled={loading}
          className="file-input"
        />
        {values.audioFile && (
          <p className="field-hint file-name">{values.audioFile.name}</p>
        )}
        <span className="field-divider">or</span>
        <input
          type="url"
          value={values.audioUrl}
          onChange={(e) => update({ audioUrl: e.target.value, audioFile: null })}
          placeholder="https://example.com/voice-sample.mp3"
          disabled={loading || Boolean(values.audioFile)}
        />
        <p className="field-hint">
          10 seconds to 5 minutes, max 20 MB. MP3, M4A, or WAV.
        </p>
      </label>

      {validationError && <p className="validation-error">{validationError}</p>}

      <button
        type="submit"
        className="generate-btn"
        disabled={loading || !!validationError}
      >
        {loading ? "Generating speech…" : "Generate speech"}
      </button>
    </form>
  );
}
