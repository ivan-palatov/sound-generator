import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fetchHistoryEntry } from "../api/client.ts";
import { CoverPage } from "../components/CoverPage.tsx";
import { GenerationPage } from "../components/GenerationPage.tsx";
import { useHistory } from "../context/HistoryContext.tsx";
import { isCoverEntry } from "../lib/generation.ts";
import type { HistoryEntry } from "../types.ts";

function HistoryEntryPage() {
  const entry = Route.useLoaderData();
  const navigate = useNavigate();
  const { refreshHistory } = useHistory();

  if (!entry) {
    return (
      <main className="main-panel">
        <div className="generation-result error">
          <p>Entry not found</p>
          <Link to="/" className="not-found-link">
            Create a new generation
          </Link>
        </div>
      </main>
    );
  }

  const handleGenerated = async (newEntry: HistoryEntry) => {
    await refreshHistory();
    navigate({ to: "/history/$entryId", params: { entryId: newEntry.id } });
  };

  if (isCoverEntry(entry)) {
    return <CoverPage mode="entry" initialEntry={entry} onGenerated={handleGenerated} />;
  }

  return <GenerationPage mode="entry" initialEntry={entry} onGenerated={handleGenerated} />;
}

export const Route = createFileRoute("/history/$entryId")({
  loader: async ({ params }) => {
    try {
      return await fetchHistoryEntry(params.entryId);
    } catch {
      return null;
    }
  },
  component: HistoryEntryPage,
});
