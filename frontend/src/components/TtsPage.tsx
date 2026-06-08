import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  generateTts,
  isApiClientError,
  translateError,
  updateHistoryEntry,
} from "../api/client.ts";
import { useHistory } from "../context/HistoryContext.tsx";
import {
  defaultTtsForm,
  entryToTtsForm,
  ttsFormToRequest,
  type TtsFormState,
  type TtsPrefill,
} from "../lib/tts.ts";
import { translateEntryError } from "../lib/translateError.ts";
import type { HistoryEntry, TtsModel } from "../types.ts";
import { TTS_MODEL_OPTIONS } from "../types.ts";
import { GenerationResult } from "./GenerationResult.tsx";
import { TtsForm } from "./TtsForm.tsx";

interface TtsPageProps {
  mode: "new" | "entry";
  initialEntry?: HistoryEntry;
  prefill?: TtsPrefill;
  onGenerated?: (entry: HistoryEntry) => void | Promise<void>;
}

export function TtsPage({ mode, initialEntry, prefill, onGenerated }: TtsPageProps) {
  const { t } = useTranslation();
  const { refreshHistory } = useHistory();
  const [model, setModel] = useState<TtsModel>(
    initialEntry?.model === "speech-2.8-turbo" ? "speech-2.8-turbo" : "speech-2.8-hd",
  );
  const [form, setForm] = useState<TtsFormState>(
    mode === "entry" && initialEntry ? entryToTtsForm(initialEntry) : defaultTtsForm,
  );
  const [current, setCurrent] = useState<HistoryEntry | null>(initialEntry ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialEntry?.status === "failed"
      ? (translateEntryError(initialEntry) ?? t("result.generationFailed"))
      : null,
  );

  useEffect(() => {
    if (mode === "new") {
      if (prefill) {
        setModel(prefill.model);
        setForm(prefill.form);
      } else {
        setModel("speech-2.8-hd");
        setForm(defaultTtsForm);
      }
      setCurrent(null);
      setError(null);
      return;
    }

    if (initialEntry) {
      setModel(initialEntry.model as TtsModel);
      setForm(entryToTtsForm(initialEntry));
      setCurrent(initialEntry);
      setError(
        initialEntry.status === "failed"
          ? (translateEntryError(initialEntry) ?? t("result.generationFailed"))
          : null,
      );
    }
  }, [mode, initialEntry, prefill, t]);

  const handleTitleChange = async (title: string) => {
    if (!current) return;
    const updated = await updateHistoryEntry(current.id, { title });
    setCurrent(updated);
    await refreshHistory();
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const { entry, error: genError } = await generateTts(ttsFormToRequest(model, form));
      setCurrent(entry);
      if (genError) {
        setError(translateError(genError.code, genError.params, t("errors.TTS_GENERATION_FAILED")));
      }
      await onGenerated?.(entry);
    } catch (err) {
      if (isApiClientError(err)) {
        setError(translateError(err.code, err.params, t("errors.TTS_GENERATION_FAILED")));
      } else {
        setError(t("errors.TTS_GENERATION_FAILED"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-panel">
      <label className="field">
        <span className="field-label">{t("common.model")}</span>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as TtsModel)}
          disabled={loading}
        >
          {TTS_MODEL_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {t(`models.${m.value}`)}
            </option>
          ))}
        </select>
      </label>

      <TtsForm values={form} onChange={setForm} onSubmit={handleGenerate} loading={loading} />

      <GenerationResult
        entry={current}
        loading={loading}
        error={error}
        onTitleChange={mode === "entry" && current ? handleTitleChange : undefined}
        emptyMessage={t("result.emptyTts")}
        loadingMessage={t("result.loadingTts")}
      />
    </main>
  );
}
