import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { TtsFormState } from "../lib/tts.ts";

const MAX_TEXT_LENGTH = 1000;

interface TtsFormProps {
  values: TtsFormState;
  onChange: (values: TtsFormState) => void;
  onSubmit: () => void;
  loading: boolean;
}

function validate(values: TtsFormState, t: TFunction): string | null {
  const text = values.text.trim();
  if (!text) return t("tts.validation.textRequired");
  if (text.length > MAX_TEXT_LENGTH) {
    return t("tts.validation.textMax", { max: MAX_TEXT_LENGTH });
  }

  if (!values.audioFile && !values.audioUrl.trim()) {
    return t("tts.validation.voiceRequired");
  }

  return null;
}

export function TtsForm({ values, onChange, onSubmit, loading }: TtsFormProps) {
  const { t } = useTranslation();
  const validationError = validate(values, t);
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
        <span className="field-label">{t("tts.speechText")}</span>
        <textarea
          value={values.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder={t("tts.speechTextPlaceholder")}
          rows={8}
          disabled={loading}
          maxLength={MAX_TEXT_LENGTH}
        />
        <p className="field-hint">
          {t("tts.charCount", { count: textLength, max: MAX_TEXT_LENGTH })}
        </p>
      </label>

      <label className="field">
        <span className="field-label">{t("tts.voiceSample")}</span>
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
        <span className="field-divider">{t("common.or")}</span>
        <input
          type="url"
          value={values.audioUrl}
          onChange={(e) => update({ audioUrl: e.target.value, audioFile: null })}
          placeholder={t("tts.voiceSamplePlaceholder")}
          disabled={loading || Boolean(values.audioFile)}
        />
        <p className="field-hint">{t("tts.voiceSampleHint")}</p>
      </label>

      {validationError && <p className="validation-error">{validationError}</p>}

      <button
        type="submit"
        className="generate-btn"
        disabled={loading || !!validationError}
      >
        {loading ? t("tts.generatingSpeech") : t("tts.generateSpeech")}
      </button>
    </form>
  );
}
