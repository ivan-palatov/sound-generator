import { useCallback, useEffect, useState } from "react";
import { deleteHistoryEntry, fetchHistory, generateMusic } from "./api/client.ts";
import { GenerationResult } from "./components/GenerationResult.tsx";
import { HistoryPanel } from "./components/HistoryPanel.tsx";
import { ModelSelector } from "./components/ModelSelector.tsx";
import { PromptForm } from "./components/PromptForm.tsx";
import type { GenerateRequest, HistoryEntry, MusicModel } from "./types.ts";
import "./App.css";

const defaultForm: Omit<GenerateRequest, "model"> = {
  prompt: "",
  lyrics: "",
  isInstrumental: false,
  lyricsOptimizer: false,
  audioUrl: "",
};

function entryToForm(entry: HistoryEntry): Omit<GenerateRequest, "model"> {
  return {
    prompt: entry.prompt,
    lyrics: entry.lyrics ?? "",
    isInstrumental: entry.isInstrumental,
    lyricsOptimizer: entry.lyricsOptimizer,
    audioUrl: "",
  };
}

export default function App() {
  const [model, setModel] = useState<MusicModel>("music-2.6");
  const [form, setForm] = useState(defaultForm);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [current, setCurrent] = useState<HistoryEntry | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const entries = await fetchHistory();
      setHistory(entries);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const { entry, error: genError } = await generateMusic({ model, ...form });
      setCurrent(entry);
      setSelectedId(entry.id);
      if (genError) {
        setError(genError);
      }
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (entry: HistoryEntry) => {
    setSelectedId(entry.id);
    setCurrent(entry);
    setModel(entry.model);
    setForm(entryToForm(entry));
    setError(entry.status === "failed" ? (entry.error ?? "Generation failed") : null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHistoryEntry(id);
      if (selectedId === id) {
        setSelectedId(null);
        setCurrent(null);
        setError(null);
      }
      await loadHistory();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sound Generator</h1>
        <p className="subtitle">MiniMax Music Generation</p>
      </header>

      <div className="app-layout">
        <HistoryPanel
          entries={history}
          selectedId={selectedId}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />

        <main className="main-panel">
          <ModelSelector value={model} onChange={setModel} disabled={loading} />
          <PromptForm
            model={model}
            values={form}
            onChange={setForm}
            onSubmit={handleGenerate}
            loading={loading}
          />
          <GenerationResult entry={current} loading={loading} error={error} />
        </main>
      </div>
    </div>
  );
}
