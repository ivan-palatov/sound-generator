import { useRef, useState } from "react";
import type { HistoryEntry } from "../types.ts";

interface GenerationResultProps {
  entry: HistoryEntry | null;
  loading: boolean;
  error: string | null;
  onTitleChange?: (title: string) => Promise<void>;
}

function displayTitle(entry: HistoryEntry): string {
  return entry.title ?? (entry.prompt ? entry.prompt.slice(0, 60) : "Untitled");
}

export function GenerationResult({
  entry,
  loading,
  error,
  onTitleChange,
}: GenerationResultProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

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

  const title = displayTitle(entry);

  const startEditing = () => {
    if (!onTitleChange) return;
    setEditing(true);
    setEditValue(title);
    requestAnimationFrame(() => editInputRef.current?.select());
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditValue("");
  };

  const saveEditing = async () => {
    if (!onTitleChange) {
      cancelEditing();
      return;
    }
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === title) {
      cancelEditing();
      return;
    }
    try {
      await onTitleChange(trimmed);
    } catch (err) {
      console.error("Failed to rename:", err);
    } finally {
      cancelEditing();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveEditing();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  return (
    <div className="generation-result success">
      {editing ? (
        <input
          ref={editInputRef}
          type="text"
          className="result-title-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => void saveEditing()}
          onKeyDown={handleKeyDown}
          maxLength={200}
          aria-label="Rename song"
        />
      ) : (
        <h3
          className={`result-title ${onTitleChange ? "result-title-editable" : ""}`}
          onClick={onTitleChange ? startEditing : undefined}
          onKeyDown={
            onTitleChange
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    startEditing();
                  }
                }
              : undefined
          }
          role={onTitleChange ? "button" : undefined}
          tabIndex={onTitleChange ? 0 : undefined}
          title={onTitleChange ? "Click to rename" : undefined}
        >
          {title}
        </h3>
      )}
      {entry.styleTags && entry.styleTags.length > 0 && (
        <div className="history-chips result-chips">
          {entry.styleTags.map((tag, i) => (
            <span key={`${tag}-${i}`} className="history-chip">
              {tag}
            </span>
          ))}
        </div>
      )}
      <audio controls src={entry.audioUrl} className="audio-player" />
      {entry.durationMs != null && (
        <p className="meta">Duration: {(entry.durationMs / 1000).toFixed(1)}s</p>
      )}
      {entry.traceId && <p className="trace-id">Trace: {entry.traceId}</p>}
      <p className="hint">Audio URL expires after 24 hours.</p>
    </div>
  );
}
