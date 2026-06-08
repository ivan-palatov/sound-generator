import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { deleteHistoryEntry, updateHistoryEntry } from "../api/client.ts";
import { useHistory } from "../context/HistoryContext.tsx";
import { entryToCoverPrefill } from "../lib/cover.ts";
import { entryToPrefill, isCoverEntry } from "../lib/generation.ts";
import { entryToTtsPrefill, isTtsEntry } from "../lib/tts.ts";
import type { HistoryEntry } from "../types.ts";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function displayTitle(entry: HistoryEntry): string {
  return entry.title ?? truncate(entry.prompt || "(no prompt)");
}

export function HistoryPanel() {
  const { entries, refreshHistory } = useHistory();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const activeEntryId = "entryId" in params ? params.entryId : null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleDuplicate = (entry: HistoryEntry, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCoverEntry(entry)) {
      navigate({
        to: "/cover",
        state: { duplicate: entryToCoverPrefill(entry) },
      });
    } else if (isTtsEntry(entry)) {
      navigate({
        to: "/tts",
        state: { duplicate: entryToTtsPrefill(entry) },
      });
    } else {
      navigate({ to: "/", state: { duplicate: entryToPrefill(entry) } });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteHistoryEntry(id);
      if (activeEntryId === id) {
        navigate({ to: "/" });
      }
      await refreshHistory();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handlePin = async (entry: HistoryEntry, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await updateHistoryEntry(entry.id, { pinned: !entry.pinned });
      await refreshHistory();
    } catch (err) {
      console.error("Failed to pin:", err);
    }
  };

  const startRename = (entry: HistoryEntry, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(entry.id);
    setEditValue(displayTitle(entry));
    requestAnimationFrame(() => editInputRef.current?.select());
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveRename = async (entry: HistoryEntry) => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === displayTitle(entry)) {
      cancelRename();
      return;
    }
    try {
      await updateHistoryEntry(entry.id, { title: trimmed });
      await refreshHistory();
    } catch (err) {
      console.error("Failed to rename:", err);
    } finally {
      cancelRename();
    }
  };

  const handleRenameKeyDown = (entry: HistoryEntry, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveRename(entry);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  };

  return (
    <aside className="history-panel">
      <div className="history-panel-header">
        <h2>History</h2>
        <div className="history-new-actions">
          <Link to="/" className="history-new-btn" state={{}}>
            + Song
          </Link>
          <Link to="/cover" className="history-new-btn" state={{}}>
            + Cover
          </Link>
          <Link to="/tts" className="history-new-btn" state={{}}>
            + TTS
          </Link>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="history-empty">No generations yet</p>
      ) : (
        <ul className="history-list">
          {entries.map((entry: HistoryEntry) => (
            <li
              key={entry.id}
              className={`history-item ${activeEntryId === entry.id ? "selected" : ""} ${entry.status} ${entry.pinned ? "pinned" : ""}`}
            >
              <Link
                to="/history/$entryId"
                params={{ entryId: entry.id }}
                className="history-item-main"
              >
                <span className="history-model">{entry.model}</span>
                {editingId === entry.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    className="history-title-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => void saveRename(entry)}
                    onKeyDown={(e) => handleRenameKeyDown(entry, e)}
                    onClick={(e) => e.preventDefault()}
                    maxLength={200}
                    aria-label="Rename song"
                  />
                ) : (
                  <span className="history-title">
                    {entry.pinned && (
                      <svg
                        className="history-pin-indicator"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M9.5 1.5 8 3l-1.5-1.5a1 1 0 0 0-1.4 0l-.1.1a1 1 0 0 0 0 1.4L6 4.2V8l-2.3 2.3a1 1 0 0 0 0 1.4l.1.1a1 1 0 0 0 1.4 0L8 10.8l2.8 2.8a1 1 0 0 0 1.4 0l.1-.1a1 1 0 0 0 0-1.4L10 8V4.2l1-1a1 1 0 0 0 0-1.4l-.1-.1a1 1 0 0 0-1.4 0Z" />
                      </svg>
                    )}
                    {displayTitle(entry)}
                  </span>
                )}
                {entry.styleTags && entry.styleTags.length > 0 && (
                  <div className="history-chips">
                    {entry.styleTags.map((tag, i) => (
                      <span key={`${tag}-${i}`} className="history-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="history-date">{formatDate(entry.createdAt)}</span>
                {entry.status === "failed" && <span className="history-failed">Failed</span>}
              </Link>
              <div className="history-item-actions">
                <button
                  type="button"
                  className={`history-action-btn history-action-pin ${entry.pinned ? "active" : ""}`}
                  onClick={(e) => void handlePin(entry, e)}
                  title={entry.pinned ? "Unpin from favorites" : "Pin to favorites"}
                  aria-label={entry.pinned ? "Unpin from favorites" : "Pin to favorites"}
                  aria-pressed={entry.pinned ?? false}
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    {entry.pinned ? (
                      <path
                        d="M9.5 1.5 8 3l-1.5-1.5a1 1 0 0 0-1.4 0l-.1.1a1 1 0 0 0 0 1.4L6 4.2V8l-2.3 2.3a1 1 0 0 0 0 1.4l.1.1a1 1 0 0 0 1.4 0L8 10.8l2.8 2.8a1 1 0 0 0 1.4 0l.1-.1a1 1 0 0 0 0-1.4L10 8V4.2l1-1a1 1 0 0 0 0-1.4l-.1-.1a1 1 0 0 0-1.4 0Z"
                        fill="currentColor"
                      />
                    ) : (
                      <path
                        d="M9.5 1.5 8 3l-1.5-1.5a1 1 0 0 0-1.4 0l-.1.1a1 1 0 0 0 0 1.4L6 4.2V8l-2.3 2.3a1 1 0 0 0 0 1.4l.1.1a1 1 0 0 0 1.4 0L8 10.8l2.8 2.8a1 1 0 0 0 1.4 0l.1-.1a1 1 0 0 0 0-1.4L10 8V4.2l1-1a1 1 0 0 0 0-1.4l-.1-.1a1 1 0 0 0-1.4 0Z"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </button>
                <button
                  type="button"
                  className="history-action-btn history-action-rename"
                  onClick={(e) => startRename(entry, e)}
                  title="Rename"
                  aria-label="Rename"
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M10.5 2.5 13.5 5.5 5.5 13.5H2.5v-3L10.5 2.5Z"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 4 12 7"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="history-action-btn history-action-duplicate"
                  onClick={(e) => handleDuplicate(entry, e)}
                  title="Duplicate settings"
                  aria-label="Duplicate settings"
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect
                      x="5"
                      y="5"
                      width="8"
                      height="8"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.25"
                    />
                    <path
                      d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="history-action-btn history-action-delete"
                  onClick={(e) => void handleDelete(entry.id, e)}
                  title="Delete"
                  aria-label="Delete"
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3.5 5h9M6 5V3.5h4V5M6.5 8v3M9.5 8v3M4.5 5l.4 7.2a1 1 0 0 0 1 .8h4.2a1 1 0 0 0 1-.8L11.5 5"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
