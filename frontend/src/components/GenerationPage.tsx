import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { generateMusic, isApiClientError, translateError, updateHistoryEntry } from "../api/client.ts";
import { useHistory } from "../context/HistoryContext.tsx";
import { defaultForm, entryToForm, type GenerationPrefill } from "../lib/generation.ts";
import { translateEntryError } from "../lib/translateError.ts";
import type { GenerateRequest, HistoryEntry, MusicModel } from "../types.ts";
import { GenerationResult } from "./GenerationResult.tsx";
import { ModelSelector } from "./ModelSelector.tsx";
import { PromptForm } from "./PromptForm.tsx";

interface GenerationPageProps {
  mode: "new" | "entry";
  initialEntry?: HistoryEntry;
  prefill?: GenerationPrefill;
  onGenerated?: (entry: HistoryEntry) => void | Promise<void>;
}

export function GenerationPage({ mode, initialEntry, prefill, onGenerated }: GenerationPageProps) {
  const { t } = useTranslation();
  const { refreshHistory } = useHistory();
  const [model, setModel] = useState<MusicModel>(initialEntry?.model ?? "music-2.6");
  const [form, setForm] = useState<Omit<GenerateRequest, "model">>(
    mode === "entry" && initialEntry ? entryToForm(initialEntry) : defaultForm,
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
        setModel("music-2.6");
        setForm(defaultForm);
      }
      setCurrent(null);
      setError(null);
      return;
    }

    if (initialEntry) {
      setModel(initialEntry.model);
      setForm(entryToForm(initialEntry));
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
      const { entry, error: genError } = await generateMusic({ model, ...form });
      setCurrent(entry);
      if (genError) {
        setError(translateError(genError.code, genError.params, t("result.generationFailed")));
      }
      await onGenerated?.(entry);
    } catch (err) {
      if (isApiClientError(err)) {
        setError(translateError(err.code, err.params, t("result.generationFailed")));
      } else {
        setError(t("result.generationFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-panel">
      <ModelSelector value={model} onChange={setModel} disabled={loading} />
      <PromptForm
        values={form}
        onChange={setForm}
        onSubmit={handleGenerate}
        loading={loading}
      />
      <GenerationResult
        entry={current}
        loading={loading}
        error={error}
        onTitleChange={mode === "entry" && current ? handleTitleChange : undefined}
      />
    </main>
  );
}
