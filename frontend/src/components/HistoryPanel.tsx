import type { HistoryEntry } from "../types.ts";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  selectedId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function HistoryPanel({ entries, selectedId, onSelect, onDelete }: HistoryPanelProps) {
  return (
    <aside className="history-panel">
      <h2>History</h2>
      {entries.length === 0 ? (
        <p className="history-empty">No generations yet</p>
      ) : (
        <ul className="history-list">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={`history-item ${selectedId === entry.id ? "selected" : ""} ${entry.status}`}
            >
              <button type="button" className="history-item-main" onClick={() => onSelect(entry)}>
                <span className="history-model">{entry.model}</span>
                <span className="history-prompt">{truncate(entry.prompt || "(no prompt)")}</span>
                <span className="history-date">{formatDate(entry.createdAt)}</span>
                {entry.status === "failed" && <span className="history-failed">Failed</span>}
              </button>
              <button
                type="button"
                className="history-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                title="Delete"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
