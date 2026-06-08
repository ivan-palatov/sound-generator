import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
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

function validate(values: CoverFormState, t: TFunction): string | null {
  if (!values.prompt.trim() || values.prompt.length < 10) {
    return t("cover.validation.styleMin");
  }
  if (values.prompt.length > 300) {
    return t("cover.validation.styleMax");
  }

  if (!values.audioFile && !values.audioUrl.trim()) {
    return t("cover.validation.referenceRequired");
  }

  if (values.workflow === "advanced") {
    if (!values.lyrics.trim() || values.lyrics.length < 10) {
      return t("cover.validation.lyricsMin");
    }
    if (values.lyrics.length > 1000) {
      return t("cover.validation.lyricsMax");
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
  const { t } = useTranslation();
  const validationError = validate(values, t);
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
      <div className="workflow-toggle" role="group" aria-label={t("cover.workflow")}>
        <button
          type="button"
          className={`workflow-btn ${values.workflow === "quick" ? "active" : ""}`}
          onClick={() => setWorkflow("quick")}
          disabled={loading || preprocessing}
        >
          {t("cover.quickCover")}
        </button>
        <button
          type="button"
          className={`workflow-btn ${values.workflow === "advanced" ? "active" : ""}`}
          onClick={() => setWorkflow("advanced")}
          disabled={loading || preprocessing}
        >
          {t("cover.editLyrics")}
        </button>
      </div>

      <label className="field">
        <span className="field-label">{t("cover.referenceAudio")}</span>
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
        <span className="field-divider">{t("common.or")}</span>
        <input
          type="url"
          value={values.audioUrl}
          onChange={(e) =>
            update({ audioUrl: e.target.value, audioFile: null, coverFeatureId: "" })
          }
          placeholder={t("cover.referenceAudioPlaceholder")}
          disabled={loading || preprocessing || Boolean(values.audioFile)}
        />
        <p className="field-hint">{t("cover.referenceAudioHint")}</p>
      </label>

      <label className="field">
        <span className="field-label">{t("cover.coverStyle")}</span>
        <textarea
          value={values.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder={t("cover.coverStylePlaceholder")}
          rows={3}
          disabled={loading || preprocessing}
        />
      </label>

      {values.workflow === "advanced" && (
        <div className="cover-advanced-section">
          <label className="field">
            <span className="field-label">{t("cover.lyrics")}</span>
            <textarea
              value={values.lyrics}
              onChange={(e) => update({ lyrics: e.target.value })}
              placeholder={t("cover.lyricsPlaceholder")}
              rows={10}
              disabled={loading || preprocessing}
            />
            <p className="field-hint">{t("cover.lyricsHint")}</p>
          </label>
          <button
            type="button"
            className="secondary-btn"
            onClick={onPreprocess}
            disabled={!canPreprocess}
          >
            {preprocessing ? t("cover.extractingLyrics") : t("cover.extractLyrics")}
          </button>
        </div>
      )}

      {validationError && <p className="validation-error">{validationError}</p>}

      <button
        type="submit"
        className="generate-btn"
        disabled={loading || preprocessing || !!validationError}
      >
        {loading ? t("cover.generatingCover") : t("cover.generateCover")}
      </button>
    </form>
  );
}
