import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { deleteHistoryEntry } from "../api/client.ts";
import { useHistory } from "../context/HistoryContext.tsx";
import type { HistoryEntry } from "../types.ts";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function HistoryPanel() {
  const { entries, refreshHistory } = useHistory();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const activeEntryId = "entryId" in params ? params.entryId : null;

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

  return (
    <aside className="history-panel">
      <div className="history-panel-header">
        <h2>History</h2>
        <Link to="/" className="history-new-btn">
          + New
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="history-empty">No generations yet</p>
      ) : (
        <ul className="history-list">
          {entries.map((entry: HistoryEntry) => (
            <li
              key={entry.id}
              className={`history-item ${activeEntryId === entry.id ? "selected" : ""} ${entry.status}`}
            >
              <Link
                to="/history/$entryId"
                params={{ entryId: entry.id }}
                className="history-item-main"
              >
                <span className="history-model">{entry.model}</span>
                <span className="history-prompt">{truncate(entry.prompt || "(no prompt)")}</span>
                <span className="history-date">{formatDate(entry.createdAt)}</span>
                {entry.status === "failed" && <span className="history-failed">Failed</span>}
              </Link>
              <button
                type="button"
                className="history-delete"
                onClick={(e) => handleDelete(entry.id, e)}
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
