import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { deleteHistoryEntry } from "../api/client.ts";
import { useHistory } from "../context/HistoryContext.tsx";
import { entryToPrefill } from "../lib/generation.ts";
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

  const handleDuplicate = (entry: HistoryEntry, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate({ to: "/", state: { duplicate: entryToPrefill(entry) } });
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

  return (
    <aside className="history-panel">
      <div className="history-panel-header">
        <h2>History</h2>
        <Link to="/" className="history-new-btn" state={{}}>
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
                <span className="history-title">
                  {entry.title ?? truncate(entry.prompt || "(no prompt)")}
                </span>
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
                  onClick={(e) => handleDelete(entry.id, e)}
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
