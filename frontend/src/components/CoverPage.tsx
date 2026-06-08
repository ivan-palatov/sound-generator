import { useEffect, useState } from "react";
import { generateCover, preprocessCover, updateHistoryEntry } from "../api/client.ts";
import { useHistory } from "../context/HistoryContext.tsx";
import {
  coverFormToRequest,
  defaultCoverForm,
  entryToCoverForm,
  type CoverFormState,
  type CoverPrefill,
} from "../lib/cover.ts";
import type { CoverModel, HistoryEntry } from "../types.ts";
import { COVER_MODEL_OPTIONS } from "../types.ts";
import { CoverForm } from "./CoverForm.tsx";
import { GenerationResult } from "./GenerationResult.tsx";

interface CoverPageProps {
  mode: "new" | "entry";
  initialEntry?: HistoryEntry;
  prefill?: CoverPrefill;
  onGenerated?: (entry: HistoryEntry) => void | Promise<void>;
}

export function CoverPage({ mode, initialEntry, prefill, onGenerated }: CoverPageProps) {
  const { refreshHistory } = useHistory();
  const [model, setModel] = useState<CoverModel>(
    initialEntry?.model === "music-cover-free" ? "music-cover-free" : "music-cover",
  );
  const [form, setForm] = useState<CoverFormState>(
    mode === "entry" && initialEntry ? entryToCoverForm(initialEntry) : defaultCoverForm,
  );
  const [current, setCurrent] = useState<HistoryEntry | null>(initialEntry ?? null);
  const [loading, setLoading] = useState(false);
  const [preprocessing, setPreprocessing] = useState(false);
  const [error, setError] = useState<string | null>(
    initialEntry?.status === "failed" ? (initialEntry.error ?? "Generation failed") : null,
  );

  useEffect(() => {
    if (mode === "new") {
      if (prefill) {
        setModel(prefill.model);
        setForm(prefill.form);
      } else {
        setModel("music-cover");
        setForm(defaultCoverForm);
      }
      setCurrent(null);
      setError(null);
      return;
    }

    if (initialEntry) {
      setModel(initialEntry.model as CoverModel);
      setForm(entryToCoverForm(initialEntry));
      setCurrent(initialEntry);
      setError(
        initialEntry.status === "failed" ? (initialEntry.error ?? "Generation failed") : null,
      );
    }
  }, [mode, initialEntry, prefill]);

  const handleTitleChange = async (title: string) => {
    if (!current) return;
    const updated = await updateHistoryEntry(current.id, { title });
    setCurrent(updated);
    await refreshHistory();
  };

  const handlePreprocess = async () => {
    setPreprocessing(true);
    setError(null);

    try {
      const result = await preprocessCover({
        model,
        audioUrl: form.audioFile ? undefined : form.audioUrl.trim() || undefined,
        audioFile: form.audioFile,
      });
      setForm((prev: CoverFormState) => ({
        ...prev,
        coverFeatureId: result.coverFeatureId,
        lyrics: result.formattedLyrics,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract lyrics");
    } finally {
      setPreprocessing(false);
    }
  };

  const ensureCoverFeatureId = async (state: CoverFormState): Promise<CoverFormState> => {
    if (state.workflow !== "advanced" || state.coverFeatureId) {
      return state;
    }

    const result = await preprocessCover({
      model,
      audioUrl: state.audioFile ? undefined : state.audioUrl.trim() || undefined,
      audioFile: state.audioFile,
    });

    const next = { ...state, coverFeatureId: result.coverFeatureId };
    setForm(next);
    return next;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const readyForm = await ensureCoverFeatureId(form);
      const { entry, error: genError } = await generateCover(
        coverFormToRequest(model, readyForm),
      );
      setCurrent(entry);
      if (genError) {
        setError(genError);
      }
      await onGenerated?.(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-panel">
      <label className="field">
        <span className="field-label">Model</span>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as CoverModel)}
          disabled={loading || preprocessing}
        >
          {COVER_MODEL_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <CoverForm
        values={form}
        onChange={setForm}
        onPreprocess={handlePreprocess}
        onSubmit={handleGenerate}
        loading={loading}
        preprocessing={preprocessing}
      />

      <GenerationResult
        entry={current}
        loading={loading}
        error={error}
        onTitleChange={mode === "entry" && current ? handleTitleChange : undefined}
        emptyMessage="Generate a cover to hear the result here."
      />
    </main>
  );
}
