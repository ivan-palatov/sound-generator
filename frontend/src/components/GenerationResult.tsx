import type { HistoryEntry } from "../types.ts";

interface GenerationResultProps {
  entry: HistoryEntry | null;
  loading: boolean;
  error: string | null;
}

export function GenerationResult({ entry, loading, error }: GenerationResultProps) {
  if (loading) {
    return (
      <div className="generation-result">
        <div className="spinner" />
        <p>Generating music — this may take a few minutes…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="generation-result error">
        <p>{error}</p>
        {entry?.traceId && <p className="trace-id">Trace: {entry.traceId}</p>}
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="generation-result empty">
        <p>Generate a track to hear the result here.</p>
        <p className="hint">Audio URLs expire after 24 hours.</p>
      </div>
    );
  }

  if (entry.status === "failed") {
    return (
      <div className="generation-result error">
        <p>{entry.error ?? "Generation failed"}</p>
        {entry.traceId && <p className="trace-id">Trace: {entry.traceId}</p>}
      </div>
    );
  }

  return (
    <div className="generation-result success">
      <audio controls src={entry.audioUrl} className="audio-player" />
      {entry.durationMs != null && (
        <p className="meta">Duration: {(entry.durationMs / 1000).toFixed(1)}s</p>
      )}
      {entry.traceId && <p className="trace-id">Trace: {entry.traceId}</p>}
      <p className="hint">Audio URL expires after 24 hours.</p>
    </div>
  );
}
