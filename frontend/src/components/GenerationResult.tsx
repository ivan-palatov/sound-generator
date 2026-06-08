import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateEntryError } from "../lib/translateError.ts";
import type { HistoryEntry } from "../types.ts";
import { AudioPlayer } from "./AudioPlayer.tsx";

interface GenerationResultProps {
  entry: HistoryEntry | null;
  loading: boolean;
  error: string | null;
  onTitleChange?: (title: string) => Promise<void>;
  emptyMessage?: string;
  loadingMessage?: string;
}

function displayTitle(entry: HistoryEntry, untitled: string): string {
  return entry.title ?? (entry.prompt ? entry.prompt.slice(0, 60) : untitled);
}

export function GenerationResult({
  entry,
  loading,
  error,
  onTitleChange,
  emptyMessage,
  loadingMessage,
}: GenerationResultProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const resolvedEmptyMessage = emptyMessage ?? t("result.emptySong");
  const resolvedLoadingMessage = loadingMessage ?? t("result.loadingSong");

  if (loading) {
    return (
      <div className="generation-result">
        <div className="spinner" />
        <p>{resolvedLoadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="generation-result error">
        <p>{error}</p>
        {entry?.traceId && <p className="trace-id">{t("common.trace", { id: entry.traceId })}</p>}
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="generation-result empty">
        <p>{resolvedEmptyMessage}</p>
        <p className="hint">{t("result.urlExpiry")}</p>
      </div>
    );
  }

  if (entry.status === "failed") {
    const failedMessage = translateEntryError(entry) ?? t("result.generationFailed");
    return (
      <div className="generation-result error">
        <p>{failedMessage}</p>
        {entry.traceId && <p className="trace-id">{t("common.trace", { id: entry.traceId })}</p>}
      </div>
    );
  }

  const title = displayTitle(entry, t("common.untitled"));

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
          aria-label={t("history.renameSong")}
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
          title={onTitleChange ? t("result.clickToRename") : undefined}
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
      {entry.audioUrl && (
        <AudioPlayer src={entry.audioUrl} durationMs={entry.durationMs} filename={title} />
      )}
      {entry.durationMs != null && (
        <p className="meta">
          {t("common.duration", { seconds: (entry.durationMs / 1000).toFixed(1) })}
        </p>
      )}
      {entry.traceId && <p className="trace-id">{t("common.trace", { id: entry.traceId })}</p>}
      <p className="hint">{t("result.urlExpiry")}</p>
    </div>
  );
}
